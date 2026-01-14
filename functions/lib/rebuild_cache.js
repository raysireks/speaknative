"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildGlobalCacheLogic = void 0;
const utils_1 = require("./utils");
const translate_core_js_1 = require("./translate_core.js");
async function rebuildGlobalCacheLogic(db, targetLocales, limit = 100) {
    var _a, _b, _c;
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
                        // Check if a good vector match already exists before triggering LLM
                        const emb = (0, utils_1.getVectorData)(data.intent_embedding || data.embedding);
                        if (emb) {
                            const matchSnap = await phrasesRef
                                .where('locale', '==', loc)
                                .findNearest('embedding', emb, { limit: 1, distanceMeasure: 'COSINE' })
                                .get();
                            const bestMatch = matchSnap.docs[0];
                            const dist = (_a = bestMatch === null || bestMatch === void 0 ? void 0 : bestMatch.distance) !== null && _a !== void 0 ? _a : 1.0;
                            const score = 1.0 - dist;
                            if (score >= 0.7) {
                                console.log(`  [Skip LLM] High-confidence match already exists for "${data.text}" in ${loc} (${score.toFixed(4)})`);
                                continue;
                            }
                        }
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
                const litVec = (0, utils_1.getVectorData)(data.embedding);
                const intentVec = (0, utils_1.getVectorData)(data.intent_embedding) || litVec;
                if (litVec && intentVec) {
                    const searchVector = intentVec; // We still search near intent for better cross-language discovery
                    if (Array.isArray(searchVector)) {
                        try {
                            const baseQ = phrasesRef
                                .where('locale', '==', targetLocale)
                                .where('is_question', '==', isQuestion);
                            const [litSnap, intSnap] = await Promise.all([
                                baseQ.findNearest('embedding', searchVector, { limit: 20, distanceMeasure: 'COSINE' }).get(),
                                baseQ.findNearest('intent_embedding', searchVector, { limit: 20, distanceMeasure: 'COSINE' }).get()
                            ]);
                            const variantsDocs = [...litSnap.docs, ...intSnap.docs];
                            if (variantsDocs.length > 0) {
                                const seen = new Set();
                                const allFound = new Map();
                                for (const vDoc of variantsDocs) {
                                    const d = vDoc.data();
                                    // In-memory polarity filter to avoid requiring a composite index
                                    if (data.logical_polarity && d.logical_polarity && d.logical_polarity !== data.logical_polarity) {
                                        console.log(`    [Filter] Polarity mismatch: "${data.text}" (${data.logical_polarity}) vs "${d.text}" (${d.logical_polarity})`);
                                        continue;
                                    }
                                    const variantEmbedding = (0, utils_1.getVectorData)(d.embedding);
                                    const variantIntent = (0, utils_1.getVectorData)(d.intent_embedding);
                                    // Use centralized logic (Intent heavily weighted for slang, Literal for normal)
                                    const score = (0, utils_1.calculateUnifiedScore)(litVec, // queryLiteral
                                    intentVec, // queryIntent
                                    variantEmbedding, variantIntent, (_b = vDoc.distance) !== null && _b !== void 0 ? _b : 0.5, // fsDistance
                                    d.is_slang || false);
                                    if (score > 0.5) {
                                        console.log(`  Candidate: "${d.text}" | Score: ${score.toFixed(4)} | Slang: ${d.is_slang}`);
                                    }
                                    allFound.set(vDoc.id, {
                                        text: d.text,
                                        is_slang: d.is_slang || false,
                                        is_question: d.is_question,
                                        score: parseFloat(score.toFixed(4))
                                    });
                                }
                                // Sort by score and filter unique texts
                                const sortedMatches = Array.from(allFound.values()).sort((a, b) => b.score - a.score);
                                // 1. Primary Filter: High confidence only (> 0.7)
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
                                else if (sortedMatches.length > 0 && ((_c = data.translated) === null || _c === void 0 ? void 0 : _c[targetLocale])) {
                                    // 2. Fallback: If absolutely no match hits 0.7, take the single best match 
                                    // provided it's at least 0.6 (Best Effort).
                                    const best = sortedMatches[0];
                                    if (best.score > 0.6) {
                                        console.log(`    [FALLBACK] Using best match for confirmed concept: "${best.text}" (${best.score})`);
                                        variants.push({
                                            text: best.text,
                                            is_slang: best.is_slang || false,
                                            is_question: best.is_question || false,
                                            score: parseFloat(best.score.toFixed(4))
                                        });
                                    }
                                }
                                else {
                                    // 3. BELOW Threshold AND NOT Translated -> Trigger LLM late
                                    console.log(`    [LATE LLM] No match (>0.7) and no flag. Translating: "${data.text}" -> ${targetLocale}`);
                                    const res = await (0, translate_core_js_1.translateCore)(db, data.text, sourceLocale, targetLocale);
                                    if (res) {
                                        variants.push({
                                            text: res.text,
                                            is_slang: res.is_slang || false,
                                            is_question: res.is_question || false,
                                            score: 1.0 // Direct AI translation
                                        });
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