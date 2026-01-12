"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildGlobalCacheLogic = void 0;
const utils_1 = require("./utils");
async function rebuildGlobalCacheLogic(db, targetLocales, limit = 100) {
    // 1. Define Supported Locales
    const ALL_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
    const SUPPORTED_LOCALES = targetLocales || ALL_LOCALES;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheData = {};
    const phrasesRef = db.collection('phrases');
    console.log(`Starting Global Cache Rebuild for: ${SUPPORTED_LOCALES.join(', ')} with Limit ${limit}`);
    for (const sourceLocale of SUPPORTED_LOCALES) {
        // 2. Fetch Top N User Phrases by usage_count
        const topSnapshot = await phrasesRef
            .where('locale', '==', sourceLocale)
            .where('is_slang', '==', false)
            .orderBy('usage_count', 'desc')
            .limit(limit)
            .get();
        if (topSnapshot.empty) {
            console.log(`No phrases found for ${sourceLocale}, skipping.`);
            cacheData[sourceLocale] = [];
            continue;
        }
        const processedPhrases = [];
        for (const doc of topSnapshot.docs) {
            const data = doc.data();
            // Prepare base object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                const intentVec = (0, utils_1.getVectorData)(data.intent_embedding) || (0, utils_1.getVectorData)(data.embedding);
                if (intentVec) {
                    const embeddingArray = intentVec;
                    if (Array.isArray(embeddingArray)) {
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
                                const allFound = new Map();
                                for (const doc of variantsDocs) {
                                    const d = doc.data();
                                    // Parse Variant Embedding for Score using Helper
                                    const variantEmbedding = (0, utils_1.getVectorData)(d.embedding);
                                    const variantIntent = (0, utils_1.getVectorData)(d.intent_embedding);
                                    const s1 = (variantEmbedding && Array.isArray(embeddingArray)) ? (0, utils_1.cosineSimilarity)(embeddingArray, variantEmbedding) : 0;
                                    const s2 = (variantIntent && Array.isArray(embeddingArray)) ? (0, utils_1.cosineSimilarity)(embeddingArray, variantIntent) : 0;
                                    const score = Math.max(s1, s2);
                                    allFound.set(doc.id, {
                                        text: d.text,
                                        is_slang: d.is_slang || false,
                                        is_question: d.is_question,
                                        score
                                    });
                                }
                                // Sort by score and filter unique texts
                                const sortedMatches = Array.from(allFound.values()).sort((a, b) => b.score - a.score);
                                const variants = [];
                                for (const match of sortedMatches) {
                                    // Use match.score directly as it's already calculated and sorted
                                    if (!seen.has(match.text) && match.score > 0.5) {
                                        console.log(`[Cache Rebuild] Match found: "${data.text}" <-> "${match.text}" (Score: ${match.score.toFixed(4)})`);
                                        seen.add(match.text);
                                        variants.push({
                                            text: match.text,
                                            is_slang: match.is_slang || false,
                                            is_question: match.is_question || false,
                                            score: parseFloat(match.score.toFixed(4))
                                        });
                                    }
                                    else if (!seen.has(match.text) && match.score > 0.45) {
                                        console.log(`[Cache Rebuild] Close but no match: "${data.text}" <-> "${match.text}" (Score: ${match.score.toFixed(4)})`);
                                    }
                                }
                                phraseEntry.variants[targetLocale] = variants;
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
            updatedAt: new Date(),
            count: phrases.length
        });
    }
    await batch.commit();
    console.log("Global Cache Rebuild Complete.");
}
exports.rebuildGlobalCacheLogic = rebuildGlobalCacheLogic;
//# sourceMappingURL=rebuild_cache.js.map