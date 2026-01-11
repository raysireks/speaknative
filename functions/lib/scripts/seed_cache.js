"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize Admin (Auto-discovers credentials if logged in via `gcloud` or `firebase login`, 
// otherwise relies on GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();
// Helper: Extract numeric array from Firestore VectorValue or array
function getVectorData(field) {
    if (!field)
        return null;
    if (Array.isArray(field))
        return field;
    if (typeof field.toArray === 'function')
        return field.toArray();
    if (field.values && Array.isArray(field.values))
        return field.values;
    return null;
}
// Helper: Calculate Cosine Similarity
function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (magA && magB) ? dot / (magA * magB) : 0;
}
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
            // const phraseEmbedding = data.embedding; // Removed unused
            // Prepare base object
            const phraseEntry = {
                id: doc.id,
                text: data.text,
                usage_count: data.usage_count,
                is_slang: data.is_slang,
                variants: {}
            };
            // 3. Find Translations in Other Locales
            for (const targetLocale of SUPPORTED_LOCALES) {
                if (targetLocale === sourceLocale)
                    continue;
                const isQuestion = data.is_question !== undefined ? data.is_question : (data.text.includes('?') || data.text.includes('¿'));
                // Priority: Match by Vector
                // We use vector search to find the closest match in the target locale.
                // FILTER: Match matching Question/Statement type to separate questions from answers.
                const intentVec = getVectorData(data.intent_embedding) || getVectorData(data.embedding);
                if (intentVec) {
                    const embeddingArray = intentVec;
                    if (embeddingArray) {
                        try {
                            const baseQ = phrasesRef
                                .where('locale', '==', targetLocale)
                                .where('is_question', '==', isQuestion);
                            const [litSnap, intSnap] = await Promise.all([
                                baseQ.findNearest('embedding', embeddingArray, { limit: 5, distanceMeasure: 'COSINE' }).get(),
                                baseQ.findNearest('intent_embedding', embeddingArray, { limit: 5, distanceMeasure: 'COSINE' }).get()
                            ]);
                            const variantsDocs = [...litSnap.docs, ...intSnap.docs];
                            if (variantsDocs.length > 0) {
                                const seen = new Set();
                                const variants = [];
                                for (const doc of variantsDocs) {
                                    const d = doc.data();
                                    // Parse Variant Embedding using Helper
                                    const variantEmbedding = getVectorData(d.embedding);
                                    const variantIntent = getVectorData(d.intent_embedding);
                                    // Calculate Score
                                    const s1 = (variantEmbedding) ? cosineSimilarity(embeddingArray, variantEmbedding) : 0;
                                    const s2 = (variantIntent) ? cosineSimilarity(embeddingArray, variantIntent) : 0;
                                    const score = Math.max(s1, s2);
                                    if (!seen.has(d.text) && score > 0.6) {
                                        seen.add(d.text);
                                        variants.push({
                                            text: d.text,
                                            is_slang: d.is_slang || false,
                                            is_question: d.is_question,
                                            score: parseFloat(score.toFixed(4))
                                        });
                                    }
                                }
                                phraseEntry.variants[targetLocale] = variants;
                                console.log(`[Vector Match] ${data.text} (${sourceLocale}) -> ${variants.length} variants in ${targetLocale}`);
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
        const docRef = cacheRef.doc(locale);
        batch.set(docRef, {
            phrases,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            count: phrases.length
        });
        console.log(`Updated cache for ${locale} with ${phrases.length} phrases.`);
    }
    await batch.commit();
    console.log("Global Cache Rebuild Complete.");
}
// Run it
rebuildGlobalCacheLogic().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed_cache.js.map