"use strict";
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
            const phraseEmbedding = data.embedding;
            // Prepare base object
            const phraseEntry = {
                id: data.concept_id,
                text: data.text,
                usage_count: data.usage_count,
                is_slang: data.is_slang,
                translations: {}
            };
            // 3. Find Translations in Other Locales
            for (const targetLocale of SUPPORTED_LOCALES) {
                if (targetLocale === sourceLocale)
                    continue;
                // Priority 1: Match by concept_id
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
                    // Priority 2: Match by Vector
                    let embeddingArray = phraseEmbedding;
                    // Handle Firestore VectorValue logic 
                    if (!Array.isArray(phraseEmbedding) && typeof phraseEmbedding.toArray === 'function') {
                        embeddingArray = phraseEmbedding.toArray();
                    }
                    else if (phraseEmbedding.values && Array.isArray(phraseEmbedding.values)) {
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
                                console.log(`[Vector Match] ${data.text} (${sourceLocale}) -> ${match.text} (${targetLocale})`);
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