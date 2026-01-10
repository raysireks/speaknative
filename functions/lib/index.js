"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildGlobalCache = exports.forceRebuildCache = exports.translateAndStore = exports.getSimilarPhrases = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
const uuid_1 = require("uuid");
const scheduler_1 = require("firebase-functions/v2/scheduler");
admin.initializeApp();
const db = admin.firestore();
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
/**
 * Perform vector search to find similar phrases, optionally filtered by locale.
 */
exports.getSimilarPhrases = functions.https.onCall(async (request) => {
    const { text, embedding, targetLocale, userLocale, limit = 5 } = request.data;
    let searchEmbedding = embedding;
    if (!searchEmbedding && text) {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        searchEmbedding = result.embedding.values;
    }
    if (!searchEmbedding || !Array.isArray(searchEmbedding)) {
        throw new functions.https.HttpsError('invalid-argument', 'Text or Embedding is required');
    }
    const phrasesRef = db.collection('phrases');
    // Base vector query options
    // If targetLocale is specified, strictly filter results to that locale
    let query = phrasesRef;
    if (targetLocale) {
        query = query.where('locale', '==', targetLocale);
    }
    const finalQuery = query.findNearest('embedding', searchEmbedding, {
        limit: limit,
        distanceMeasure: 'COSINE'
    });
    const snapshot = await finalQuery.get();
    const matches = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    // If userLocale is provided, fetch the corresponding translations
    if (userLocale && matches.length > 0) {
        const conceptIds = matches.map((m) => m.concept_id).filter(Boolean);
        if (conceptIds.length > 0) {
            const translationQuery = phrasesRef
                .where('locale', '==', userLocale)
                .where('concept_id', 'in', conceptIds);
            const transSnapshot = await translationQuery.get();
            const translationsMap = new Map();
            transSnapshot.forEach(doc => {
                const data = doc.data();
                translationsMap.set(data.concept_id, data);
            });
            // Merge translation into matches
            return matches.map((m) => {
                const userTranslation = translationsMap.get(m.concept_id);
                const userText = userTranslation ? userTranslation.text : 'Translation not found';
                return Object.assign(Object.assign({ id: m.concept_id, text: m.text, translation: userText, is_slang: m.is_slang || false, slangText: m.is_slang ? m.text : undefined, slangTranslation: undefined }, m), { embedding: undefined });
            });
        }
    }
    return matches.map((m) => (Object.assign(Object.assign({ id: m.concept_id }, m), { is_slang: m.is_slang || false, embedding: undefined })));
});
/**
 * Direct Translation Function (Server-Side)
 * - Checks/Creates phrase in userLocale
 * - Finds/Creates phrase in targetLocale via vector search
 * - Manages usage_count
 */
exports.translateAndStore = functions.https.onCall(async (request) => {
    // 1. Validate Input
    const { text, userLocale, targetLocale } = request.data;
    if (!text || !userLocale || !targetLocale) {
        throw new functions.https.HttpsError('invalid-argument', 'text, userLocale, and targetLocale are required.');
    }
    // Locale Map for Prompt Context (Expand as needed)
    const LOCALE_MAP = {
        'en-US-CA': { language: 'en', country: 'US', region: 'California' },
        'es-CO-CTG': { language: 'es', country: 'CO', region: 'Cartagena' },
        'es-CO-MDE': { language: 'es', country: 'CO', region: 'Medellín' }
    };
    const targetInfo = LOCALE_MAP[targetLocale];
    const userInfo = LOCALE_MAP[userLocale]; // Optional context for user phrase
    const phrasesRef = db.collection('phrases');
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    // 2. Generate Embedding for User Input
    const embedResult = await embeddingModel.embedContent(text);
    const userEmbedding = embedResult.embedding.values;
    const userVector = admin.firestore.FieldValue.vector(userEmbedding);
    // 3. Check/Store User Phrase (Idempotent-ish)
    // We try to find an exact text match in userLocale first to avoid duplicates
    const userQuery = phrasesRef
        .where('locale', '==', userLocale)
        .where('text', '==', text)
        .limit(1);
    let userDocSnapshot = await userQuery.get();
    let conceptId;
    if (userDocSnapshot.empty) {
        // User phrase missing, create it
        conceptId = (0, uuid_1.v4)();
        const newUserDoc = {
            text: text,
            is_slang: false,
            usage_count: 1,
            locale: userLocale,
            language: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.language) || userLocale.split('-')[0],
            country: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) || 'Unknown',
            region: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.region) || 'Unknown',
            concept_id: conceptId,
            embedding: userVector,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await phrasesRef.add(newUserDoc);
    }
    else {
        const doc = userDocSnapshot.docs[0];
        conceptId = doc.data().concept_id;
        // Optionally update usage_count for user phrase? logic says "Allow DB to grow", implies we store it.
        // We'll increment usage mainly on the returned TARGET phrase, but updating user phrase usage is good analytics.
        await doc.ref.update({ usage_count: admin.firestore.FieldValue.increment(1) });
    }
    // 4. Query Target Locale using Embedding (Vector Search)
    const vectorQuery = phrasesRef
        .where('locale', '==', targetLocale)
        .findNearest('embedding', userEmbedding, {
        limit: 1,
        distanceMeasure: 'COSINE'
    });
    const targetSnapshot = await vectorQuery.get();
    if (!targetSnapshot.empty) {
        // 5. IF FOUND: Return existing + increment usage
        const bestMatch = targetSnapshot.docs[0];
        // Double check concept_id match or similarity confidence?
        // If we strictly want the SAME concept, we might query by concept_id.
        // But "Smart Cache" implies vector similarity is enough.
        // However, if we have a concept_id, we should probably prefer that for EXACT translations.
        // Strategy: Try to find by concept_id first (Translation of the same concept),
        // fallback to vector search if that fails (Semantically similar).
        // EDIT: The prompt says "Query Target: Use embedding to find Nearest Neighbor".
        // It DOES NOT say "Query by concept_id". This allows "Close enough" hits.
        // But if I just created a NEW concept_id, the vector search won't find it by ID logic, only vector.
        // Let's stick to the prompt: Vector Search based.
        const matchData = bestMatch.data();
        await bestMatch.ref.update({ usage_count: admin.firestore.FieldValue.increment(1) });
        return {
            id: bestMatch.id,
            concept_id: matchData.concept_id,
            text: matchData.text,
            is_slang: matchData.is_slang,
            usage_count: (matchData.usage_count || 0) + 1,
            locale: matchData.locale,
            source: 'cache'
        };
    }
    else {
        // 6. IF MISSING: Call Gemini -> Store -> Return
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const regionContext = targetInfo
            ? `dialect for ${targetInfo.region}, ${targetInfo.country}`
            : `standard dialect for ${targetLocale}`;
        const translationPrompt = `
        Translate "${text}" into the ${regionContext}.
        Provide the most natural, common way to say this.
        If it's a slang phrase in the source, try to match the slang level.
        Output JSON: { "text": "translated string", "is_slang": boolean }
        `;
        const transResult = await model.generateContent(translationPrompt);
        const transText = transResult.response.text();
        const jsonStr = transText.replace(/```json\n?|\n?```/g, '').trim();
        let parsed = { text: "Error translating", is_slang: false };
        try {
            parsed = JSON.parse(jsonStr);
        }
        catch (e) {
            console.error("JSON Parse Error", e);
            // Fallback if JSON fails, though unlikely with structured prompt
            parsed.text = transText;
        }
        // Generate embedding for the NEW Target Phrase
        // Note: We use the TRANSLATED text for the embedding in the target locale DB?
        // Or do we use the SOURCE text embedding?
        // Standard practice: Embed the *content* of the phrase. So we embed the Spanish text for the Spanish DB entry.
        // This allows Spanish->English search later.
        const targetEmbedResult = await embeddingModel.embedContent(parsed.text);
        const targetEmbedding = targetEmbedResult.embedding.values;
        const targetVector = admin.firestore.FieldValue.vector(targetEmbedding);
        const newTargetDoc = {
            text: parsed.text,
            is_slang: parsed.is_slang,
            usage_count: 1,
            locale: targetLocale,
            language: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.language) || targetLocale.split('-')[0],
            country: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.country) || 'Unknown',
            region: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.region) || 'Unknown',
            concept_id: conceptId,
            embedding: targetVector,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await phrasesRef.add(newTargetDoc);
        return Object.assign(Object.assign({ id: docRef.id }, newTargetDoc), { embedding: undefined, source: 'generated' });
    }
});
/**
 * Weekly job to rebuild the global cache of top phrases.
 * - Fetches top 100 phrases (by usage) per locale.
 * - Finds translations/variants in other locales.
 * - Stores optimized JSON payload for client consumption.
 */
/**
 * HTTP Trigger to manually force cache rebuild (for testing/admin).
 */
exports.forceRebuildCache = functions.https.onRequest(async (req, res) => {
    // Basic auth or check if local/authorized could be added here
    await rebuildGlobalCacheLogic();
    res.send("Cache Rebuild Initiated.");
});
async function rebuildGlobalCacheLogic() {
    // 1. Define Supported Locales
    const SUPPORTED_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
    const cacheData = {};
    const phrasesRef = db.collection('phrases');
    console.log(`Starting Global Cache Rebuild for: ${SUPPORTED_LOCALES.join(', ')}`);
    for (const sourceLocale of SUPPORTED_LOCALES) {
        // 2. Fetch Top 100 User Phrases by usage_count
        const topSnapshot = await phrasesRef
            .where('locale', '==', sourceLocale)
            .orderBy('usage_count', 'desc')
            .limit(100)
            .get();
        if (topSnapshot.empty) {
            console.log(`No phrases found for ${sourceLocale}, skipping.`);
            cacheData[sourceLocale] = [];
            continue;
        }
        const processedPhrases = [];
        for (const doc of topSnapshot.docs) {
            const data = doc.data();
            const phraseEmbedding = data.embedding; // Could be VectorValue or array depending on SDK version
            // Prepare base object
            const phraseEntry = {
                id: data.concept_id,
                text: data.text,
                usage_count: data.usage_count,
                is_slang: data.is_slang,
                translations: {}
            };
            // 3. Find Translations in Other Locales
            // We iterate through OTHER locales to find the best match for this phrase.
            for (const targetLocale of SUPPORTED_LOCALES) {
                if (targetLocale === sourceLocale)
                    continue;
                // Priority 1: Match by concept_id (Exact translation link)
                // This is the most accurate way if we maintained the concept_id link correctly.
                const conceptQuery = await phrasesRef
                    .where('locale', '==', targetLocale)
                    .where('concept_id', '==', data.concept_id)
                    .limit(1)
                    .get();
                if (!conceptQuery.empty) {
                    const match = conceptQuery.docs[0].data();
                    phraseEntry.translations[targetLocale] = match.text;
                }
                else if (phraseEmbedding) {
                    // Priority 2: Match by Vector (Semantic Sibling)
                    // If concept IDs diverge or are missing, we use vector search.
                    // Note: findNearest expects an array. If phraseEmbedding is a VectorValue object, we might need value conversion.
                    // admin.firestore.FieldValue.vector generates a VectorValue. The JS SDK representation might need checking.
                    // Usually it behaves as array in write, but read might be object { toArray(): number[] }?
                    // Let's coerce safely.
                    let embeddingArray = phraseEmbedding;
                    if (!Array.isArray(phraseEmbedding) && typeof phraseEmbedding.toArray === 'function') {
                        embeddingArray = phraseEmbedding.toArray();
                    }
                    else if (phraseEmbedding.values && Array.isArray(phraseEmbedding.values)) {
                        // Some internal representations have .values
                        embeddingArray = phraseEmbedding.values;
                    }
                    if (Array.isArray(embeddingArray)) {
                        try {
                            const vectorQuery = phrasesRef
                                .where('locale', '==', targetLocale)
                                .findNearest('embedding', embeddingArray, {
                                limit: 1,
                                distanceMeasure: 'COSINE'
                            });
                            const vectorSnapshot = await vectorQuery.get();
                            if (!vectorSnapshot.empty) {
                                const match = vectorSnapshot.docs[0].data();
                                phraseEntry.translations[targetLocale] = match.text;
                            }
                        }
                        catch (err) {
                            console.error(`Vector search failed for ${data.text} -> ${targetLocale}`, err);
                        }
                    }
                }
            }
            processedPhrases.push(phraseEntry);
        }
        cacheData[sourceLocale] = processedPhrases;
    }
    // 4. Store optimized cache documents
    const batch = db.batch();
    const cacheRef = db.collection('cache_top_phrases');
    for (const [locale, phrases] of Object.entries(cacheData)) {
        // We overwrite the single doc for this locale
        const docRef = cacheRef.doc(locale);
        batch.set(docRef, {
            phrases,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            count: phrases.length
        });
    }
    await batch.commit();
    console.log("Global Cache Rebuild Complete.");
}
exports.rebuildGlobalCache = (0, scheduler_1.onSchedule)({ schedule: 'every sunday 00:00', timeoutSeconds: 540 }, async () => {
    await rebuildGlobalCacheLogic();
});
//# sourceMappingURL=index.js.map