/* eslint-disable @typescript-eslint/no-explicit-any */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";

// Initialize Firebase Admin
if (!process.env.FIREBASE_CONFIG && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // If no generic auth, try default or mock? 
    // Assuming local env has creds or authorized user.
    // For this environment, usually admin.credential.applicationDefault() works if gcloud is logged in.
}

initializeApp({
    projectId: 'speaknative-8ce5c'
});

const db = getFirestore();
const genAI = new GoogleGenerativeAI(API_KEY);

const LOCALES = [
    { code: 'en-US-CA', language: 'en', country: 'US', region: 'California' },
    { code: 'es-CO-CTG', language: 'es', country: 'CO', region: 'Cartagena' },
    { code: 'es-CO-MDE', language: 'es', country: 'CO', region: 'Medellín' }
];

// Parse arguments
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const localeArg = args.find(a => a.startsWith('--locale='));

const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
const LOCALE_FILTER = localeArg ? localeArg.split('=')[1] : null;

console.log(`Config: Limit=${LIMIT}, Locale=${LOCALE_FILTER || 'ALL'}`);

async function generateStructuredBasePhrases() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Calculate distribution based on LIMIT
    // 10% Tier 1, 20% Tier 2, 30% Tier 3, 40% Tier 4
    const c1 = Math.max(1, Math.floor(LIMIT * 0.1));
    const c2 = Math.max(1, Math.floor(LIMIT * 0.2));
    const c3 = Math.max(1, Math.floor(LIMIT * 0.3));
    const c4 = Math.max(1, LIMIT - c1 - c2 - c3);

    const tiers = [
        { count: c1, prompt: "single-word common expressions (e.g. 'Hello', 'Thanks', 'Yes', 'What?')" },
        { count: c2, prompt: "2-word common phrases (e.g. 'Good morning', 'Come here', 'No worries')" },
        { count: c3, prompt: "3-word common phrases (e.g. 'How are you', 'Where is it', 'I am fine')" },
        { count: c4, prompt: "4-word common phrases (e.g. 'Have a nice day', 'I need some help', 'Can you help me')" },
    ];

    let allPhrases: string[] = [];

    for (const tier of tiers) {
        if (tier.count <= 0) continue;
        const prompt = `Generate a list of the top ${tier.count} most useful and common ${tier.prompt} for daily conversation.
        Output JUST the phrases as a JSON array of strings in English. 
        Example: ["Phrase 1", "Phrase 2"]
        Do not include markdown or other text.`;

        try {
            console.log(`Generating ${tier.count} phrases for: ${tier.prompt}...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            const phrases = JSON.parse(jsonStr);

            const sliced = phrases.slice(0, tier.count);
            console.log(`   -> Got ${sliced.length} phrases.`);
            allPhrases = [...allPhrases, ...sliced];
        } catch (e) {
            console.error(`Failed to generate tier ${tier.prompt}`, e);
        }
    }

    return allPhrases;
}

// Function to translate, detect attributes, and embed
async function processPhrase(originalPhrase: string, targetLocale: typeof LOCALES[0]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const translationPrompt = `
    Translate "${originalPhrase}" into the local dialect for:
    Language: ${targetLocale.language}
    Region: ${targetLocale.region}, ${targetLocale.country}
    
    Return a JSON object with:
    1. "standard": The most common, neutral way to say this.
    2. "variants": An array of objects [{ "text": "string", "is_slang": boolean }] containing 1-3 distinct variations (slang, formal, or colloquial).
    3. "is_question": Boolean indicating if this is a question.
    
    Structure:
    {
      "standard": "Standard Phrase",
      "variants": [
        { "text": "Slang Variant", "is_slang": true }
      ],
      "is_question": false
    }
    IMPORTANT: JSON only.
    `;

    try {
        const transResult = await model.generateContent(translationPrompt);
        const transText = transResult.response.text().trim();
        const jsonStr = transText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        // 1. Get Intent Embedding (from Standard Phrase)
        const intentResult = await embeddingModel.embedContent(parsed.standard);
        const intentVector = intentResult.embedding.values;

        const documents = [];

        // 2. Add Standard Phrase
        documents.push({
            text: parsed.standard,
            is_slang: false,
            is_question: parsed.is_question,
            embedding: intentVector,        // Literal is same as intent for standard
            intent_embedding: intentVector, // Self-reference for intent
            usage_count: Math.floor(Math.random() * 50) + 1
        });

        // 3. Add Variants (Parallel Embeddings)
        if (Array.isArray(parsed.variants)) {
            const variantPromises = parsed.variants.map(async (v: any) => {
                if (v.text.toLowerCase() === parsed.standard.toLowerCase()) return null;
                const variantResult = await embeddingModel.embedContent(v.text);
                return {
                    text: v.text,
                    is_slang: v.is_slang || false,
                    is_question: parsed.is_question,
                    embedding: variantResult.embedding.values,
                    intent_embedding: intentVector,
                    usage_count: Math.floor(Math.random() * 50) + 1
                };
            });

            const results = await Promise.all(variantPromises);
            results.forEach(doc => {
                if (doc) documents.push(doc);
            });
        }
        console.log(`   > Generated ${documents.length} docs for "${originalPhrase}"`);
        return documents;

    } catch (e) {
        console.log(`\n!!! ERROR processing "${originalPhrase}" for ${targetLocale.code} !!!`);
        console.log(e);
        return [];
    }
}

async function seed() {
    try {
        // REMOVED wipeDatabase(); ADDITIVE ONLY.

        console.log('Generating base structured phrases...');
        // If we want consistency, we might want to check DB for existing English phrases first?
        // But user said "take an input of 100 phrases... seed for those".
        // Assuming generation is acceptable source.
        const basePhrases = await generateStructuredBasePhrases();
        console.log(`Total Base Phrases: ${basePhrases.length}`);

        console.log('Translating and Seeding...');

        let totalDocs = 0;

        let targetLocales = LOCALES;
        if (LOCALE_FILTER) {
            targetLocales = LOCALES.filter(l => l.code === LOCALE_FILTER);
        }

        for (const base of basePhrases) {
            console.log(`Ref: "${base}"`);

            for (const locale of targetLocales) {
                // Check Global Existence before Process? 
                // We do check inside the loop before Add.

                const variants = await processPhrase(base, locale);

                for (const v of variants) {
                    // DUPLICATE CHECK
                    const existSnap = await db.collection('phrases')
                        .where('locale', '==', locale.code)
                        .where('text', '==', v.text)
                        .limit(1)
                        .get();

                    if (existSnap.empty) {
                        await db.collection('phrases').add({
                            text: v.text,
                            is_slang: v.is_slang,
                            is_question: v.is_question,
                            usage_count: v.usage_count,
                            locale: locale.code,
                            language: locale.language,
                            country: locale.country,
                            region: locale.region,
                            embedding: FieldValue.vector(v.embedding),
                            intent_embedding: FieldValue.vector(v.intent_embedding),
                            createdAt: FieldValue.serverTimestamp()
                        });
                        totalDocs++;
                    } else {
                        console.log(`   Skipping duplicate: "${v.text}" (${locale.code})`);
                    }
                }
                // Rate limit delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            process.stdout.write('.');
        }

        console.log(`\n\nSeeding Completed! Total New Documents Stored: ${totalDocs}`);

    } catch (error) {
        console.error('Fatal Error during seeding:', error);
        process.exit(1);
    }
}

seed();

