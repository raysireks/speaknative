"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateCore = void 0;
const generative_ai_1 = require("@google/generative-ai");
const firestore_1 = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");
const utils_1 = require("./utils");
async function translateCore(db, text, userLocale, targetLocale, testThreshold, forceRefresh = false) {
    var _a, _b;
    if (!text || !userLocale || !targetLocale) {
        throw new Error('text, userLocale, and targetLocale are required.');
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    // Locale Map
    const LOCALE_MAP = {
        'en-US-CA': { language: 'en', country: 'US', region: 'California' },
        'es-CO-CTG': { language: 'es', country: 'CO', region: 'Cartagena' },
        'es-CO-MDE': { language: 'es', country: 'CO', region: 'Medellín' }
    };
    const targetInfo = LOCALE_MAP[targetLocale];
    const userInfo = LOCALE_MAP[userLocale];
    const phrasesRef = db.collection('phrases');
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    // 2. Embed User Input (Outside Transaction to keep it fast)
    // Trim User Input to ensure consistency
    const trimmedText = text.trim();
    // Check if empty after trim
    if (!trimmedText)
        throw new Error("Text cannot be empty");
    const embedResult = await embeddingModel.embedContent(trimmedText);
    const userEmbedding = embedResult.embedding.values;
    const userVector = firestore_1.FieldValue.vector(userEmbedding);
    // 3. Check/Store User Phrase (Transactional)
    // Returns: { ref: DocumentReference, translated: boolean, translatedMap: Record<string, boolean> }
    const sourceResult = await db.runTransaction(async (t) => {
        const userQuery = phrasesRef
            .where('locale', '==', userLocale)
            .where('text', '==', trimmedText)
            .limit(1);
        const userDocSnapshot = await t.get(userQuery);
        let docRef;
        let isTranslated = false;
        let transMap = {};
        let existingData = null;
        if (userDocSnapshot.empty) {
            // Create New
            const newDocRef = phrasesRef.doc();
            t.set(newDocRef, {
                text: trimmedText,
                is_slang: false,
                usage_count: 1,
                locale: userLocale,
                language: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.language) || userLocale.split('-')[0],
                country: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) || 'Unknown',
                region: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.region) || 'Unknown',
                embedding: userVector,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                translated: { [targetLocale]: false }
            });
            docRef = newDocRef;
        }
        else {
            // Update Existing
            const doc = userDocSnapshot.docs[0];
            docRef = doc.ref;
            existingData = doc.data();
            if (typeof existingData.translated === 'boolean')
                isTranslated = existingData.translated;
            else if (existingData.translated && typeof existingData.translated === 'object') {
                transMap = existingData.translated;
                isTranslated = transMap[targetLocale] === true;
            }
            t.update(docRef, { usage_count: firestore_1.FieldValue.increment(1) });
        }
        return {
            ref: docRef,
            translated: isTranslated,
            translatedMap: transMap,
            logical_polarity: existingData === null || existingData === void 0 ? void 0 : existingData.logical_polarity,
            semantic_anchor: existingData === null || existingData === void 0 ? void 0 : existingData.semantic_anchor
        };
    });
    const sourceDocRef = sourceResult.ref;
    const sourceTranslated = sourceResult.translated;
    // 4. Query Target (Parallel Vector Search)
    const baseQuery = phrasesRef.where('locale', '==', targetLocale);
    // For search, we need a Semantic Anchor if we want a conceptual bridge.
    // OPTIMIZATION: Try a literal text search first. If zero result or low score, then anchor.
    // For now, let's just generate the anchor if we're doing a strict/rebuild pass.
    // If it's a new phrase, we don't have an anchor yet. 
    // But translateCore is often called with source intent in mind.
    let litSnap, intSnap;
    try {
        [litSnap, intSnap] = await Promise.all([
            baseQuery.findNearest('embedding', userEmbedding, { limit: 5, distanceMeasure: 'COSINE' }).get(),
            baseQuery.findNearest('intent_embedding', userEmbedding, { limit: 5, distanceMeasure: 'COSINE' }).get()
        ]);
    }
    catch (_c) {
        console.warn("Vector search failed, proceeding.");
        litSnap = { docs: [] };
        intSnap = { docs: [] };
    }
    const allCandidates = [...litSnap.docs, ...intSnap.docs];
    let bestMatch = null;
    let maxScore = 0;
    for (const doc of allCandidates) {
        const d = doc.data();
        // Polarity Filter
        if (sourceResult.logical_polarity && d.logical_polarity && d.logical_polarity !== sourceResult.logical_polarity) {
            continue;
        }
        const docVec = (0, utils_1.getVectorData)(d.embedding);
        const intVec = (0, utils_1.getVectorData)(d.intent_embedding);
        const score = (0, utils_1.calculateUnifiedScore)(userEmbedding, // queryLiteral
        userEmbedding, // queryIntent
        docVec, intVec, (_a = doc.distance) !== null && _a !== void 0 ? _a : 0.5, d.is_slang || false);
        if (score > maxScore) {
            maxScore = score;
            bestMatch = doc;
        }
    }
    const activeThreshold = typeof testThreshold === 'number' ? testThreshold : 0.7;
    if (!forceRefresh && bestMatch && (maxScore > activeThreshold || sourceTranslated)) {
        const matchData = bestMatch.data();
        // Defensive: Even if we return cache, mark the source as translated for this locale
        // to prevent iterative rebuilds from re-triggering this pair.
        if (!sourceTranslated) {
            await sourceDocRef.update({
                [`translated.${targetLocale}`]: true
            });
        }
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
    console.log(`Cache miss: Score ${maxScore.toFixed(4)} < ${activeThreshold}. Generating.`);
    // 6. Generate
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // Load and parameterize strict prompt
    const promptPath = path.join(__dirname, '..', 'prompts', 'translation_strict.md');
    let template = '';
    try {
        template = fs.readFileSync(promptPath, 'utf-8');
    }
    catch (err) {
        console.warn("Failed to load strict prompt template, falling back to basic prompt.", err);
        template = `Translate "{{TEXT}}" into {{LOCATION}} dialect. Use {{SLANG_COUNT}} slang variations.`;
    }
    const location = (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.region) || "Cartagena";
    const slangCount = 5;
    const userGender = "male";
    const recipientGender = "female";
    // Determine language name for the prompt
    const targetLangName = targetLocale.startsWith('en') ? 'English' : 'Spanish';
    const fullPrompt = template
        .replace(/{{LOCATION}}/g, location)
        .replace(/{{TARGET_LANGUAGE}}/g, targetLangName)
        .replace(/{{SLANG_COUNT}}/g, slangCount.toString())
        .replace(/{{USER_GENDER}}/g, userGender)
        .replace(/{{RECIPIENT_GENDER}}/g, recipientGender)
        .replace(/{{TEXT}}/g, trimmedText);
    const transResult = await model.generateContent(fullPrompt);
    const transResponse = transResult.response.text().trim();
    // Parse JSON output
    let parsedJson;
    try {
        // Extract JSON if wrapped in markdown code blocks
        const jsonMatch = transResponse.match(/```json\n([\s\S]*?)\n```/) || transResponse.match(/{[\s\S]*}/);
        const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : transResponse;
        parsedJson = JSON.parse(jsonText);
    }
    catch (err) {
        console.error("Failed to parse JSON response, falling back to basic structure.", err);
        parsedJson = {
            primary: "Error translating",
            semantic_anchor: "Error",
            logical_polarity: "NEUTRAL",
            slang: []
        };
    }
    const parsed = {
        text: parsedJson.primary,
        semantic_anchor: parsedJson.semantic_anchor || parsedJson.primary,
        logical_polarity: (parsedJson.logical_polarity || "NEUTRAL").toUpperCase(),
        is_slang: false,
        is_question: parsedJson.primary.includes('?'),
        slang_variants: parsedJson.slang || []
    };
    // Embed result & Semantic Anchor
    const [resEmbed, anchorEmbedObj] = await Promise.all([
        embeddingModel.embedContent(parsed.text),
        embeddingModel.embedContent(parsed.semantic_anchor)
    ]);
    const resVector = firestore_1.FieldValue.vector(resEmbed.embedding.values);
    const intentVector = firestore_1.FieldValue.vector(anchorEmbedObj.embedding.values);
    // Check for existing translation in target locale to prevent duplicates
    const existingTargetQuery = await phrasesRef
        .where('locale', '==', targetLocale)
        .where('text', '==', parsed.text)
        .limit(1)
        .get();
    let newDocRef;
    if (!existingTargetQuery.empty) {
        const existingDoc = existingTargetQuery.docs[0];
        newDocRef = existingDoc.ref;
        await newDocRef.update({ usage_count: firestore_1.FieldValue.increment(1) });
    }
    else {
        // Insert New Target Doc
        const newTargetDoc = {
            text: parsed.text,
            semantic_anchor: parsed.semantic_anchor,
            logical_polarity: parsed.logical_polarity,
            is_slang: parsed.is_slang,
            is_question: parsed.is_question !== undefined ? parsed.is_question : (parsed.text.includes('?') || parsed.text.includes('¿')),
            usage_count: 1,
            locale: targetLocale,
            language: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.language) || targetLocale.split('-')[0],
            country: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.country) || 'Unknown',
            region: (targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.region) || 'Unknown',
            embedding: resVector,
            intent_embedding: intentVector,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        };
        newDocRef = await phrasesRef.add(newTargetDoc);
    }
    // Slang Variants
    if (((_b = parsed.slang_variants) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        const batch = db.batch(); // Limit 500
        for (const variant of parsed.slang_variants) {
            try {
                // Check exist check for variant
                const exVarSnap = await phrasesRef
                    .where('locale', '==', targetLocale)
                    .where('text', '==', variant)
                    .limit(1)
                    .get();
                if (exVarSnap.empty) {
                    const svEmbed = await embeddingModel.embedContent(variant);
                    const svVec = firestore_1.FieldValue.vector(svEmbed.embedding.values);
                    const slDoc = phrasesRef.doc();
                    batch.set(slDoc, {
                        text: variant,
                        semantic_anchor: parsed.semantic_anchor,
                        logical_polarity: parsed.logical_polarity,
                        is_slang: true,
                        is_question: parsed.is_question !== undefined ? parsed.is_question : (variant.includes('?') || variant.includes('¿')),
                        usage_count: 0,
                        locale: targetLocale,
                        embedding: svVec,
                        intent_embedding: intentVector,
                        createdAt: firestore_1.FieldValue.serverTimestamp()
                    });
                }
            }
            catch (_d) {
                console.error("Embedding/Checking variant failed", variant);
            }
        }
        await batch.commit();
    }
    // Update Source Metadata & Translated Map
    const sourceUpdates = {
        [`translated.${targetLocale}`]: true,
        semantic_anchor: parsed.semantic_anchor,
        logical_polarity: parsed.logical_polarity,
        intent_embedding: intentVector
    };
    await sourceDocRef.update(sourceUpdates);
    const finalDocSnap = await newDocRef.get();
    const finalData = finalDocSnap.data();
    return {
        id: newDocRef.id,
        text: (finalData === null || finalData === void 0 ? void 0 : finalData.text) || parsed.text,
        is_slang: (finalData === null || finalData === void 0 ? void 0 : finalData.is_slang) || parsed.is_slang,
        is_question: (finalData === null || finalData === void 0 ? void 0 : finalData.is_question) || parsed.is_question,
        usage_count: (finalData === null || finalData === void 0 ? void 0 : finalData.usage_count) || 1,
        locale: targetLocale,
        source: existingTargetQuery.empty ? 'generated' : 'existing_text_match',
        embedding: (finalData === null || finalData === void 0 ? void 0 : finalData.embedding) || resVector,
        intent_embedding: (finalData === null || finalData === void 0 ? void 0 : finalData.intent_embedding) || intentVector
    };
}
exports.translateCore = translateCore;
//# sourceMappingURL=translate_core.js.map