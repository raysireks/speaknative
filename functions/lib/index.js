"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnifiedPhraseCache = exports.rebuildGlobalCache = exports.forceRebuildCache = exports.translateAndStore = exports.getSimilarPhrases = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const translate_core_1 = require("./translate_core");
const rebuild_cache_1 = require("./rebuild_cache");
const utils_1 = require("./utils");
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
    // Parallel Vector Search: Literal AND Intent
    const [literalSnapshot, intentSnapshot] = await Promise.all([
        query.findNearest('embedding', searchEmbedding, {
            limit: limit,
            distanceMeasure: 'COSINE'
        }).get(),
        query.findNearest('intent_embedding', searchEmbedding, {
            limit: limit,
            distanceMeasure: 'COSINE'
        }).get()
    ]);
    // Merge and Deduplicate
    const allDocs = new Map();
    [...literalSnapshot.docs, ...intentSnapshot.docs].forEach(doc => {
        if (!allDocs.has(doc.id)) {
            const data = doc.data();
            // Calculate Score: Max of Literal or Intent similarity
            const docVec = (0, utils_1.getVectorData)(data.embedding);
            const intentVec = (0, utils_1.getVectorData)(data.intent_embedding);
            // We compare SEARCH (Literal) vs TARGET Use Cases
            let score = 0;
            if (Array.isArray(searchEmbedding)) {
                const s1 = docVec ? (0, utils_1.cosineSimilarity)(searchEmbedding, docVec) : 0;
                const s2 = intentVec ? (0, utils_1.cosineSimilarity)(searchEmbedding, intentVec) : 0;
                score = Math.max(s1, s2);
            }
            allDocs.set(doc.id, Object.assign(Object.assign({ id: doc.id }, data), { score }));
        }
    });
    // Convert to array and sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matches = Array.from(allDocs.values()).sort((a, b) => b.score - a.score);
    // Filter by Confidence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matches = matches.filter((m) => m.score > 0.7);
    // Limit again after merge
    matches = matches.slice(0, limit);
    // If userLocale is provided, fetch translations via vector search (reverse lookup)
    if (userLocale && matches.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultsWithTranslation = await Promise.all(matches.map(async (m) => {
            let searchVec = m.embedding;
            if (!searchVec && searchEmbedding) {
                // Fallback to the original search embedding if match embedding is missing (approximate)
                searchVec = searchEmbedding;
            }
            let userText = 'Translation not found';
            if (searchVec) {
                const translationQuery = phrasesRef
                    .where('locale', '==', userLocale)
                    .findNearest('embedding', searchVec, {
                    limit: 1,
                    distanceMeasure: 'COSINE'
                });
                const transSnap = await translationQuery.get();
                if (!transSnap.empty) {
                    userText = transSnap.docs[0].data().text;
                }
            }
            return Object.assign(Object.assign({ id: m.id, text: m.text, translation: userText, is_slang: m.is_slang || false, slangText: m.is_slang ? m.text : undefined, slangTranslation: undefined }, m), { embedding: undefined // Remove large vector
             });
        }));
        return resultsWithTranslation;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return matches.map((m) => (Object.assign(Object.assign({ id: m.id }, m), { is_slang: m.is_slang || false, embedding: undefined })));
});
/**
 * Direct Translation Function (Server-Side)
 */
exports.translateAndStore = functions.https.onCall(async (request) => {
    // Wrapper to use shared Core Logic
    const { text, userLocale, targetLocale, testThreshold } = request.data;
    try {
        return await (0, translate_core_1.translateCore)(db, text, userLocale, targetLocale, testThreshold);
    }
    catch (err) {
        throw new functions.https.HttpsError('internal', err.message);
    }
});
/**
 * HTTP Trigger to manually force cache rebuild (for testing/admin).
 */
exports.forceRebuildCache = functions.https.onRequest(async (req, res) => {
    // Parse query
    const localesOpt = req.query.locales ? req.query.locales.split(',') : undefined;
    const limitOpt = req.query.limit ? parseInt(req.query.limit) : undefined;
    await (0, rebuild_cache_1.rebuildGlobalCacheLogic)(db, localesOpt, limitOpt);
    res.send(`Cache Rebuild Initiated. Locales: ${(localesOpt === null || localesOpt === void 0 ? void 0 : localesOpt.join(',')) || 'ALL'}, Limit: ${limitOpt || 100}`);
});
exports.rebuildGlobalCache = (0, scheduler_1.onSchedule)({ schedule: 'every sunday 00:00', timeoutSeconds: 540 }, async () => {
    await (0, rebuild_cache_1.rebuildGlobalCacheLogic)(db);
});
exports.getUnifiedPhraseCache = functions.https.onCall(async (request) => {
    const SUPPORTED_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
    // Inputs
    const { text, userLocale, limit = 100, threshold = 0.7 } = request.data;
    if (!text || !userLocale) {
        throw new functions.https.HttpsError('invalid-argument', 'text, userLocale required.');
    }
    const phrasesRef = db.collection('phrases');
    // Helper to perform the global search
    async function performSearch() {
        // 1. Get Source Phrase
        const sourceSnap = await phrasesRef.where('text', '==', text).where('locale', '==', userLocale).limit(1).get();
        if (sourceSnap.empty) {
            return { error: 'Source phrase not found' };
        }
        const sourceDoc = sourceSnap.docs[0];
        const sourceData = sourceDoc.data();
        const isSourceSlang = sourceData.is_slang || false;
        const isQuestion = sourceData.is_question || false;
        // Parse Translated Map
        let translatedMap = {};
        if (typeof sourceData.translated === 'boolean' && sourceData.translated) {
            translatedMap = SUPPORTED_LOCALES.reduce((acc, loc) => (Object.assign(Object.assign({}, acc), { [loc]: true })), {});
        }
        else if (typeof sourceData.translated === 'object') {
            translatedMap = sourceData.translated;
        }
        // 2. Vector Search (Global)
        const vecToUse = (0, utils_1.getVectorData)(sourceData.embedding);
        const intentVecToUse = isSourceSlang ? (0, utils_1.getVectorData)(sourceData.intent_embedding) : null;
        if (!vecToUse) {
            throw new functions.https.HttpsError('internal', 'Embedding missing on source.');
        }
        let candidates = [];
        const baseQ = phrasesRef.where('is_question', '==', isQuestion);
        const contentResults = await baseQ.findNearest('embedding', vecToUse, { limit: limit, distanceMeasure: 'COSINE' }).get();
        candidates = [...contentResults.docs];
        if (intentVecToUse && isSourceSlang) {
            const intentResults = await baseQ.findNearest('intent_embedding', intentVecToUse, { limit: limit, distanceMeasure: 'COSINE' }).get();
            const currentIds = new Set(candidates.map(d => d.id));
            for (const d of intentResults.docs) {
                if (!currentIds.has(d.id)) {
                    candidates.push(d);
                }
            }
        }
        // 3. Post-Process & Validate
        const resultsByLocale = {};
        const missingLocales = [];
        const validationErrors = [];
        for (const targetLoc of SUPPORTED_LOCALES) {
            // We filter candidates locally
            const matches = candidates.filter(d => d.data().locale === targetLoc).map(d => {
                const dA = d.data();
                const v = (0, utils_1.getVectorData)(dA.embedding);
                const iv = (0, utils_1.getVectorData)(dA.intent_embedding);
                const s1 = v ? (0, utils_1.cosineSimilarity)(vecToUse, v) : 0;
                let s2 = 0;
                if (intentVecToUse && iv)
                    s2 = (0, utils_1.cosineSimilarity)(intentVecToUse, iv);
                return {
                    text: dA.text,
                    is_slang: dA.is_slang,
                    score: parseFloat(Math.max(s1, s2).toFixed(4))
                };
            }).sort((a, b) => b.score - a.score);
            const activeThreshold = Number(threshold);
            const validMatches = matches.filter(m => m.score > activeThreshold);
            const isMarkedTranslated = translatedMap[targetLoc] === true;
            if (validMatches.length > 0) {
                resultsByLocale[targetLoc] = validMatches;
            }
            else {
                // No valid matches
                if (isMarkedTranslated) {
                    // Fallback
                    if (matches.length > 0) {
                        resultsByLocale[targetLoc] = [matches[0]];
                    }
                    else {
                        validationErrors.push(`Missing entries for ${targetLoc} despite translated:true`);
                    }
                }
                else {
                    missingLocales.push(targetLoc);
                }
            }
        }
        return {
            resultsByLocale,
            missingLocales,
            validationErrors,
            sourceText: sourceData.text
        };
    }
    // Initial Search
    let searchResult = await performSearch();
    // Check Error/Missing
    if (searchResult.error)
        return searchResult;
    // Handle Missing Locales (Auto-Generation)
    if (searchResult.missingLocales && searchResult.missingLocales.length > 0) {
        console.log(`Auto-generating for missing locales: ${searchResult.missingLocales.join(', ')}`);
        // Run specific translations
        const generatePromises = searchResult.missingLocales.map((loc) => (0, translate_core_1.translateCore)(db, text, userLocale, loc, Number(threshold))
            .catch((e) => {
            console.error(`Failed to auto-generate for ${loc}:`, e);
            return null;
        }));
        await Promise.all(generatePromises);
        // Re-Run Search
        console.log("Re-running global search...");
        searchResult = await performSearch();
    }
    // Validate Errors (after retry)
    if (searchResult.validationErrors && searchResult.validationErrors.length > 0) {
        throw new functions.https.HttpsError('failed-precondition', `Cache Inconsistency: ${searchResult.validationErrors.join(', ')}`);
    }
    return {
        status: 'complete',
        text: searchResult.sourceText,
        variants: searchResult.resultsByLocale
    };
});
//# sourceMappingURL=index.js.map