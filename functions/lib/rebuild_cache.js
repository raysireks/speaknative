"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildGlobalCacheLogic = void 0;
const utils_1 = require("./utils");
const translate_core_js_1 = require("./translate_core.js");
async function rebuildGlobalCacheLogic(db, targetLocales, limit = 100) {
    const ALL_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
    const SUPPORTED_LOCALES = targetLocales || ALL_LOCALES;
    const phrasesRef = db.collection('phrases');
    let stable = false;
    let iteration = 0;
    const MAX_ITERATIONS = 3;
    while (!stable && iteration < MAX_ITERATIONS) {
        console.log(`--- Cache Rebuild Iteration ${iteration + 1} ---`);
        stable = true;
        iteration++;
        for (const sourceLocale of SUPPORTED_LOCALES) {
            const topSnapshot = await phrasesRef
                .where('locale', '==', sourceLocale)
                .where('is_slang', '==', false)
                .orderBy('usage_count', 'desc')
                .limit(limit)
                .get();
            for (const doc of topSnapshot.docs) {
                const data = doc.data();
                // 1. Ensure the base phrase is fully translated
                for (const loc of ALL_LOCALES) {
                    if (loc === sourceLocale)
                        continue;
                    if (!data.translated || data.translated[loc] !== true) {
                        console.log(`Triggering missing translation for base phrase: "${data.text}" (${sourceLocale} -> ${loc})`);
                        await (0, translate_core_js_1.translateCore)(db, data.text, sourceLocale, loc);
                        stable = false;
                    }
                }
            }
        }
        // If we triggered translations, re-fetch and check again in next iteration
        if (!stable)
            console.log("Translations were triggered, starting next iteration pass...");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheData = {};
    console.log(`Finalizing Global Cache for: ${SUPPORTED_LOCALES.join(', ')} with Limit ${limit}`);
    for (const sourceLocale of SUPPORTED_LOCALES) {
        const topSnapshot = await phrasesRef
            .where('locale', '==', sourceLocale)
            .where('is_slang', '==', false)
            .orderBy('usage_count', 'desc')
            .limit(limit)
            .get();
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
                const intentVec = (0, utils_1.getVectorData)(data.intent_embedding) || (0, utils_1.getVectorData)(data.embedding);
                if (intentVec) {
                    const embeddingArray = intentVec;
                    if (Array.isArray(embeddingArray)) {
                        try {
                            const baseQ = phrasesRef
                                .where('locale', '==', targetLocale)
                                .where('is_question', '==', isQuestion);
                            const [litSnap, intSnap] = await Promise.all([
                                baseQ.findNearest('embedding', embeddingArray, { limit: 20, distanceMeasure: 'COSINE' }).get(),
                                baseQ.findNearest('intent_embedding', embeddingArray, { limit: 20, distanceMeasure: 'COSINE' }).get()
                            ]);
                            const variantsDocs = [...litSnap.docs, ...intSnap.docs];
                            if (variantsDocs.length > 0) {
                                const seen = new Set();
                                const allFound = new Map();
                                for (const vDoc of variantsDocs) {
                                    const d = vDoc.data();
                                    const variantEmbedding = (0, utils_1.getVectorData)(d.embedding);
                                    const variantIntent = (0, utils_1.getVectorData)(d.intent_embedding);
                                    const s1 = (variantEmbedding && Array.isArray(embeddingArray)) ? (0, utils_1.cosineSimilarity)(embeddingArray, variantEmbedding) : 0;
                                    const s2 = (variantIntent && Array.isArray(embeddingArray)) ? (0, utils_1.cosineSimilarity)(embeddingArray, variantIntent) : 0;
                                    let score = Math.max(s1, s2);
                                    // SLANG PENALTY: Reduce score for slang to prefer proper translations
                                    if (d.is_slang) {
                                        score *= 0.95;
                                    }
                                    allFound.set(vDoc.id, {
                                        text: d.text,
                                        is_slang: d.is_slang || false,
                                        is_question: d.is_question,
                                        score
                                    });
                                }
                                // Sort by score and filter unique texts
                                const sortedMatches = Array.from(allFound.values()).sort((a, b) => b.score - a.score);
                                const highConfidence = sortedMatches.filter(m => m.score > 0.7);
                                const variants = [];
                                if (highConfidence.length > 0) {
                                    for (const match of highConfidence) {
                                        if (!seen.has(match.text)) {
                                            seen.add(match.text);
                                            variants.push({
                                                text: match.text,
                                                is_slang: match.is_slang || false,
                                                is_question: match.is_question || false,
                                                score: parseFloat(match.score.toFixed(4))
                                            });
                                        }
                                    }
                                }
                                else if (sortedMatches.length > 0) {
                                    const match = sortedMatches[0];
                                    variants.push({
                                        text: match.text,
                                        is_slang: match.is_slang || false,
                                        is_question: match.is_question || false,
                                        score: parseFloat(match.score.toFixed(4))
                                    });
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