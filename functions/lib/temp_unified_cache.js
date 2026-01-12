"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnifiedPhraseCache = void 0;
exports.getUnifiedPhraseCache = functions.https.onCall(async (request) => {
    // Inputs
    const { text, userLocale, limit = 100, threshold = 0.7 } = request.data;
    if (!text || !userLocale) {
        throw new functions.https.HttpsError('invalid-argument', 'text, userLocale required.');
    }
    const phrasesRef = db.collection('phrases');
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    // 1. Get Source Phrase
    const sourceSnap = await phrasesRef.where('text', '==', text).where('locale', '==', userLocale).limit(1).get();
    if (sourceSnap.empty) {
        return { error: 'Source phrase not found' };
    }
    const sourceDoc = sourceSnap.docs[0];
    const sourceData = sourceDoc.data();
    const isSourceSlang = sourceData.is_slang || false;
    const isQuestion = sourceData.is_question || false; // Simple check
    // Parse Translated Map
    // Legacy support: if boolean true, assume ALL supported locales are translated (for now, or standard set)
    // New Standard: translated is a Map<string, boolean>
    let translatedMap = {};
    if (typeof sourceData.translated === 'boolean' && sourceData.translated) {
        // Fallback for legacy data - assume coverage for standard locales?
        // For strict testing, we might want to fail if it's not a map, but let's be lenient:
        translatedMap = SUPPORTED_LOCALES.reduce((acc, loc) => (Object.assign(Object.assign({}, acc), { [loc]: true })), {});
    }
    else if (typeof sourceData.translated === 'object') {
        translatedMap = sourceData.translated;
    }
    // 2. Vector Search (Global)
    // "lookup: source word -> all neighbors"
    const vecToUse = getVectorData(sourceData.embedding);
    // "we only look for intent matche if the word is marked as slang"
    const intentVecToUse = isSourceSlang ? getVectorData(sourceData.intent_embedding) : null;
    if (!vecToUse) {
        throw new functions.https.HttpsError('internal', 'Embedding missing on source.');
    }
    // Execute Search
    // Note: We remove limit per locale. limit applies to TOTAL results.
    // This is the risk user accepts: "why do multiple searches".
    let candidates = [];
    // Search 1: Content
    // Filter by is_question to verify matching types? (Implied by current filter logic).
    const baseQ = phrasesRef.where('is_question', '==', isQuestion);
    // We search across ALL locales (no locale filter)
    const contentResults = await baseQ.findNearest('embedding', vecToUse, { limit: limit, distanceMeasure: 'COSINE' }).get();
    candidates = [...contentResults.docs];
    // Search 2: Intent (only if slang)
    if (intentVecToUse && isSourceSlang) {
        const intentResults = await baseQ.findNearest('intent_embedding', intentVecToUse, { limit: limit, distanceMeasure: 'COSINE' }).get();
        // Merge unique
        const currentIds = new Set(candidates.map(d => d.id));
        for (const d of intentResults.docs) {
            if (!currentIds.has(d.id)) {
                candidates.push(d);
            }
        }
    }
    // 3. Post-Process & Validate
    const resultsByLocale = {};
    // Calculate scores and group
    for (const doc of candidates) {
        const d = doc.data();
        const dLoc = d.locale;
        if (dLoc === userLocale)
            continue; // Skip matching source
        // Calc Score
        const v1 = getVectorData(d.embedding);
        const v2 = getVectorData(d.intent_embedding);
        let s1 = 0;
        if (v1 && vecToUse)
            s1 = cosineSimilarity(vecToUse, v1);
        let s2 = 0;
        if (v2 && vecToUse && isSourceSlang)
            s2 = cosineSimilarity(vecToUse, v2);
        // Note: Intent matching usually implies comparing sourceIntent vs targetIntent? 
        // Existing logic used sourceEmbed vs targetIntent (asymmetric/cross-poly).
        // Let's stick to existing s2 logic: cosineSimilarity(userEmbedding, intVec)
        const score = Math.max(s1, s2);
        if (!resultsByLocale[dLoc])
            resultsByLocale[dLoc] = [];
        resultsByLocale[dLoc].push({
            text: d.text,
            is_slang: d.is_slang,
            score: parseFloat(score.toFixed(4))
        });
    }
    // Sort groups
    Object.keys(resultsByLocale).forEach(k => {
        resultsByLocale[k].sort((a, b) => b.score - a.score);
    });
    // 4. Validate Coverage
    const validationErrors = [];
    const missingGeneration = [];
    const finalVariants = {};
    for (const targetLoc of SUPPORTED_LOCALES) {
        if (targetLoc === userLocale)
            continue;
        const isMarkedTranslated = translatedMap[targetLoc] === true;
        const matches = resultsByLocale[targetLoc] || [];
        // Filter by threshold
        const validMatches = matches.filter(m => m.score > threshold);
        if (validMatches.length > 0) {
            // Good coverage
            finalVariants[targetLoc] = validMatches;
        }
        else {
            // No strict matches.
            if (isMarkedTranslated) {
                // "if any locale has no entries and translated.<locale>:true then throw an error"
                if (matches.length === 0) {
                    // ERROR: We expected it to be there!
                    validationErrors.push(`Missing entries for ${targetLoc} despite translated:true`);
                }
                else {
                    // "if translated.<locale>:true then top 1 match"
                    // Fallback to top 1 (even if low score)
                    finalVariants[targetLoc] = [matches[0]];
                }
            }
            else {
                // Not translated, and no matches.
                // "if any translated.<locale> is false ... run the translations"
                missingGeneration.push(targetLoc);
            }
        }
    }
    if (missingGeneration.length > 0) {
        return {
            status: 'incomplete',
            missing_locales: missingGeneration,
            current_variants: finalVariants,
            errors: validationErrors
        };
    }
    if (validationErrors.length > 0) {
        // "throw an error we need to fix"
        throw new functions.https.HttpsError('failed-precondition', `Cache Inconsistency: ${validationErrors.join(', ')}`);
    }
    return {
        status: 'complete',
        text: sourceData.text,
        variants: finalVariants
    };
});
//# sourceMappingURL=temp_unified_cache.js.map