/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const API_KEY = "AIzaSyA8IoiieYoACtyDfpKP9RfS9lLd8JYp9tg";

// Initialize Firebase Admin
initializeApp({
    projectId: 'speaknative-8ce5c'
});
const db = getFirestore();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

const LOCALES = [
    { code: 'en-US-CA', language: 'en', country: 'US', region: 'California' },
    { code: 'es-CO-CTG', language: 'es', country: 'CO', region: 'Cartagena' },
    { code: 'es-CO-MDE', language: 'es', country: 'CO', region: 'Medellín' }
];

async function generateTieredPhrases() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const tiers = [
        { count: 10, prompt: "single-word phrases (e.g. 'Hello', 'Thanks', 'Yes')" },
        { count: 20, prompt: "2-word phrases (e.g. 'Good morning', 'Come here')" },
        { count: 30, prompt: "3-word phrases (e.g. 'How are you', 'Where is it')" },
        { count: 40, prompt: "4-word phrases (e.g. 'Have a nice day', 'I need some help')" },
    ];

    let allPhrases: string[] = [];

    for (const tier of tiers) {
        const prompt = `Generate a list of the top ${tier.count} most common and useful ${tier.prompt} for a language learning app.
        Output JUST the phrases as a JSON array of strings in English. Do not include any other text.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            const phrases = JSON.parse(jsonStr);
            console.log(`Generated ${phrases.length} phrases for tier: ${tier.prompt}`);
            allPhrases = [...allPhrases, ...phrases];
        } catch (e) {
            console.error(`Failed to generate tier ${tier.prompt}`, e);
        }
    }

    return allPhrases;
}

async function translateAndEmbed(originalPhrase: string, targetLocale: typeof LOCALES[0]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const translationPrompt = `
    Translate the phrase "${originalPhrase}" into the specific dialect for:
    Language: ${targetLocale.language}
    Region: ${targetLocale.region}, ${targetLocale.country}
    
    1. Provide the standard/common translation (is_slang: false).
    2. IF there is a distinct local slang/colloquial way to say this, provide it as a SEPARATE entry (is_slang: true).
    
    Output JSON: [ 
        { "text": "common phrase", "is_slang": false },
        { "text": "slang phrase", "is_slang": true } 
    ]
    Do not include markdown formatting.
    `;

    try {
        const transResult = await model.generateContent(translationPrompt);
        const transText = transResult.response.text().trim();
        const jsonStr = transText.replace(/```json\n?|\n?```/g, '').trim();

        let parsed: { text: string, is_slang: boolean }[] = [];
        try {
            const raw = JSON.parse(jsonStr);
            parsed = Array.isArray(raw) ? raw : [raw];
        } catch (e) {
            console.warn("Failed to parse JSON from Gemini, using raw text", transText);
            parsed = [{ text: transText, is_slang: false }];
        }

        const resultsWithEmbeddings = [];
        for (const item of parsed) {
            const embedResult = await embeddingModel.embedContent(item.text);
            resultsWithEmbeddings.push({
                text: item.text,
                is_slang: item.is_slang,
                embedding: embedResult.embedding.values
            });
        }
        return resultsWithEmbeddings;

    } catch (e) {
        console.error(`Error translating "${originalPhrase}" for ${targetLocale.code}`, e);
        return [];
    }
}

async function seed() {
    try {
        console.log('Clearing existing phrases...');
        const snapshot = await db.collection('phrases').get();
        const batchSize = 500;
        let batch = db.batch();
        let count = 0;

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;
            if (count >= batchSize) {
                await batch.commit();
                batch = db.batch();
                count = 0;
            }
        }
        if (count > 0) {
            await batch.commit();
        }
        console.log('Database cleared.');

        const phrases = await generateTieredPhrases();
        console.log(`Generated ${phrases.length} base phrases.`);

        for (const basePhrase of phrases) {
            console.log(`Processing: "${basePhrase}"`);
            const conceptId = uuidv4();

            for (const locale of LOCALES) {
                const variants = await translateAndEmbed(basePhrase, locale);

                for (const variant of variants) {
                    await db.collection('phrases').add({
                        text: variant.text,
                        is_slang: variant.is_slang,
                        usage_count: 0,
                        locale: locale.code,
                        language: locale.language,
                        country: locale.country,
                        region: locale.region,
                        concept_id: conceptId,
                        embedding: FieldValue.vector(variant.embedding),
                        createdAt: FieldValue.serverTimestamp()
                    });
                    console.log(`   Stored ${locale.code}: "${variant.text}" (Slang: ${variant.is_slang})`);
                }
            }
        }

        console.log('Seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seed();
