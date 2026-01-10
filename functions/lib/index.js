"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildGlobalCache = exports.forceRebuildCache = exports.translateAndStore = exports.getSimilarPhrases = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
// import { v4 as uuidv4 } from 'uuid';
const scheduler_1 = require("firebase-functions/v2/scheduler");
admin.initializeApp();
const db = admin.firestore();
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
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
            const docVec = getVectorData(data.embedding);
            const intentVec = getVectorData(data.intent_embedding);
            // We compare SEARCH (Literal) vs TARGET Use Cases
            let score = 0;
            if (Array.isArray(searchEmbedding)) {
                const s1 = docVec ? cosineSimilarity(searchEmbedding, docVec) : 0;
                const s2 = intentVec ? cosineSimilarity(searchEmbedding, intentVec) : 0;
                score = Math.max(s1, s2);
            }
            allDocs.set(doc.id, Object.assign(Object.assign({ id: doc.id }, data), { score }));
        }
    });
    // Convert to array and sort
    let matches = Array.from(allDocs.values()).sort((a, b) => b.score - a.score);
    // Filter by Confidence
    matches = matches.filter(m => m.score > 0.7);
    // Limit again after merge
    matches = matches.slice(0, limit);
    // If userLocale is provided, fetch translations via vector search (reverse lookup)
    if (userLocale && matches.length > 0) {
        // We have matches in Target Locale. We want to find their equivalents in User Locale.
        // Since we removed concept_id, we must use vector similarity.
        // This effectively means for each match, we search the user locale.
        // To optimize, we could do this in parallel.
        const resultsWithTranslation = await Promise.all(matches.map(async (m) => {
            // If we have the embedding (we should, from the doc), use it.
            // But the doc might not have it in `data()` if it was excluded or format differs.
            // Matches from findNearest might include the vector field.
            // If m.embedding is available and usable:
            let searchVec = m.embedding;
            if (!searchVec && searchEmbedding) {
                // Fallback to the original search embedding if match embedding is missing (approximate)
                searchVec = searchEmbedding;
            }
            // If we really need the Match's embedding to find its translation, we should rely on it being present.
            // Firestore findNearest docs: the returned document contains the vector field.
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
    return matches.map((m) => (Object.assign(Object.assign({ id: m.id }, m), { is_slang: m.is_slang || false, embedding: undefined })));
});
/**
 * Direct Translation Function (Server-Side)
 * - Checks/Creates phrase in userLocale
 * - Finds/Creates phrase in targetLocale via vector search
 * - Manages usage_count
 */
exports.translateAndStore = functions.https.onCall(async (request) => {
    var _a;
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
    // We do NOT use concept_id anymore. 
    // If not found, create it without concept_id.
    if (userDocSnapshot.empty) {
        // User phrase missing, create it
        const newUserDoc = {
            text: text,
            is_slang: false,
            usage_count: 1,
            locale: userLocale,
            language: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.language) || userLocale.split('-')[0],
            country: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) || 'Unknown',
            region: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.region) || 'Unknown',
            // No concept_id
            embedding: userVector,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await phrasesRef.add(newUserDoc);
    }
    else {
        const doc = userDocSnapshot.docs[0];
        await doc.ref.update({ usage_count: admin.firestore.FieldValue.increment(1) });
    }
    // 4. Query Target Locale using Parallel Vector Search
    const baseQuery = phrasesRef.where('locale', '==', targetLocale);
    const [litSnap, intSnap] = await Promise.all([
        baseQuery.findNearest('embedding', userEmbedding, { limit: 1, distanceMeasure: 'COSINE' }).get(),
        baseQuery.findNearest('intent_embedding', userEmbedding, { limit: 1, distanceMeasure: 'COSINE' }).get()
    ]);
    // Merge
    const allCandidates = [...litSnap.docs, ...intSnap.docs];
    // 5. Find Best Match from candidates
    // We have to manually find the best score since we merged results
    let bestMatch = null;
    let maxScore = 0;
    for (const doc of allCandidates) {
        const d = doc.data();
        const docVec = getVectorData(d.embedding);
        const intVec = getVectorData(d.intent_embedding);
        const s1 = docVec && Array.isArray(userEmbedding) ? cosineSimilarity(userEmbedding, docVec) : 0;
        const s2 = intVec && Array.isArray(userEmbedding) ? cosineSimilarity(userEmbedding, intVec) : 0;
        const score = Math.max(s1, s2);
        if (score > maxScore) {
            maxScore = score;
            bestMatch = doc;
        }
    }
    // Check Threshold
    // Check Threshold
    if (bestMatch && maxScore > 0.7) {
        const matchData = bestMatch.data();
        await bestMatch.ref.update({ usage_count: admin.firestore.FieldValue.increment(1) });
        return {
            id: bestMatch.id,
            text: matchData.text,
            is_slang: matchData.is_slang,
            usage_count: (matchData.usage_count || 0) + 1,
            locale: matchData.locale,
            source: 'cache',
            score: parseFloat(maxScore.toFixed(4))
        };
    }
    // Else: Score too low, proceed to generate
    // Else: Score too low, proceed to Generate
    console.log(`Cache miss: Best vector match "${(_a = bestMatch === null || bestMatch === void 0 ? void 0 : bestMatch.data()) === null || _a === void 0 ? void 0 : _a.text}" score ${maxScore.toFixed(4)} < 0.8. Generating new translation.`);
    // 6. IF MISSING: Call Gemini -> Store -> Return
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const regionContext = targetInfo
        ? `dialect for ${targetInfo.region}, ${targetInfo.country}`
        : `standard dialect for ${targetLocale}`;
    const translationPrompt = `
        Translate "${text}" into the ${regionContext}.
        Provide the most natural, common way to say this.
        If it's a slang phrase in the source, try to match the slang level.
        Identify if this is a question or statement.
        Output JSON: { "text": "translated string", "is_slang": boolean, "is_question": boolean }
        `;
    const transResult = await model.generateContent(translationPrompt);
    const transText = transResult.response.text();
    const jsonStr = transText.replace(/```json\n?|\n?```/g, '').trim();
    let parsed = { text: "Error translating", is_slang: false, is_question: false };
    try {
        parsed = JSON.parse(jsonStr);
    }
    catch (e) {
        console.error("JSON Parse Error", e);
        parsed.text = transText;
        parsed.is_question = text.includes('?') || text.includes('¿');
    }
    // Check for existing translation in target locale to prevent duplicates
    const existingTargetQuery = await phrasesRef
        .where('locale', '==', targetLocale)
        .where('text', '==', parsed.text)
        .limit(1)
        .get();
    if (!existingTargetQuery.empty) {
        const existingDoc = existingTargetQuery.docs[0];
        const existingData = existingDoc.data();
        await existingDoc.ref.update({ usage_count: admin.firestore.FieldValue.increment(1) });
        return {
            id: existingDoc.id,
            text: existingData.text,
            is_slang: existingData.is_slang,
            is_question: existingData.is_question,
            usage_count: (existingData.usage_count || 0) + 1,
            locale: existingData.locale,
            source: 'existing_text_match'
        };
    }
    const targetEmbedResult = await embeddingModel.embedContent(parsed.text);
    const targetEmbedding = targetEmbedResult.embedding.values;
    const targetVector = admin.firestore.FieldValue.vector(targetEmbedding);
    const newTargetDoc = {
        text: parsed.text,
        is_slang: parsed.is_slang,
        is_question: parsed.is_question !== undefined ? parsed.is_question : (parsed.text.includes('?') || parsed.text.includes('¿')),
        usage_count: 1,
        locale: targetLocale,
        language: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.language) || targetLocale.split('-')[0],
        country: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.country) || 'Unknown',
        region: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.region) || 'Unknown',
        // No concept_id
        // No concept_id
        embedding: targetVector,
        intent_embedding: targetVector,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await phrasesRef.add(newTargetDoc);
    return Object.assign(Object.assign({ id: docRef.id }, newTargetDoc), { embedding: undefined, source: 'generated' });
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
            // We iterate through OTHER locales to find the best match for this phrase.
            for (const targetLocale of SUPPORTED_LOCALES) {
                if (targetLocale === sourceLocale)
                    continue;
                const isQuestion = data.is_question !== undefined ? data.is_question : (data.text.includes('?') || data.text.includes('¿'));
                // Priority: Match by Vector
                // We use vector search to find the closest match in the target locale.
                // FILTER: Match matching Question/Statement type to separate questions from answers.
                const intentVec = getVectorData(data.intent_embedding) || getVectorData(data.embedding);
                if (intentVec) {
                    let embeddingArray = intentVec;
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
                                const variants = [];
                                for (const doc of variantsDocs) {
                                    const d = doc.data();
                                    // Parse Variant Embedding for Score using Helper
                                    const variantEmbedding = getVectorData(d.embedding);
                                    const variantIntent = getVectorData(d.intent_embedding);
                                    // Calculate Cosine Similarity Score using Helper
                                    const s1 = (variantEmbedding && Array.isArray(embeddingArray)) ? cosineSimilarity(embeddingArray, variantEmbedding) : 0;
                                    const s2 = (variantIntent && Array.isArray(embeddingArray)) ? cosineSimilarity(embeddingArray, variantIntent) : 0;
                                    const score = Math.max(s1, s2);
                                    if (!seen.has(d.text) && score > 0.7) {
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