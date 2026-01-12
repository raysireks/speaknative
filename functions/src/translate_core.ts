import { GoogleGenerativeAI } from "@google/generative-ai";
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { getVectorData, cosineSimilarity } from './utils';


export async function translateCore(
    db: Firestore,
    text: string,
    userLocale: string,
    targetLocale: string,
    testThreshold?: number
) {
    if (!text || !userLocale || !targetLocale) {
        throw new Error('text, userLocale, and targetLocale are required.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

    // Locale Map
    const LOCALE_MAP: Record<string, { language: string; country: string; region: string }> = {
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
    if (!trimmedText) throw new Error("Text cannot be empty");

    const embedResult = await embeddingModel.embedContent(trimmedText);
    const userEmbedding = embedResult.embedding.values;
    const userVector = FieldValue.vector(userEmbedding);

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
        let transMap: Record<string, boolean> = {};

        if (userDocSnapshot.empty) {
            // Create New
            const newDocRef = phrasesRef.doc();
            t.set(newDocRef, {
                text: trimmedText,
                is_slang: false,
                usage_count: 1,
                locale: userLocale,
                language: userInfo?.language || userLocale.split('-')[0],
                country: userInfo?.country || 'Unknown',
                region: userInfo?.region || 'Unknown',
                embedding: userVector,
                createdAt: FieldValue.serverTimestamp(),
                translated: { [targetLocale]: false }
            });
            docRef = newDocRef;
        } else {
            // Update Existing
            const doc = userDocSnapshot.docs[0];
            docRef = doc.ref;
            const data = doc.data();

            if (typeof data.translated === 'boolean') isTranslated = data.translated;
            else if (data.translated && typeof data.translated === 'object') {
                transMap = data.translated;
                isTranslated = transMap[targetLocale] === true;
            }

            t.update(docRef, { usage_count: FieldValue.increment(1) });
        }

        return { ref: docRef, translated: isTranslated, translatedMap: transMap };
    });

    const sourceDocRef = sourceResult.ref;
    const sourceTranslated = sourceResult.translated;

    // 4. Query Target (Parallel Vector Search)
    const baseQuery = phrasesRef.where('locale', '==', targetLocale);

    let litSnap, intSnap;
    try {
        [litSnap, intSnap] = await Promise.all([
            baseQuery.findNearest('embedding', userEmbedding, { limit: 1, distanceMeasure: 'COSINE' }).get(),
            baseQuery.findNearest('intent_embedding', userEmbedding, { limit: 1, distanceMeasure: 'COSINE' }).get()
        ]);
    } catch {
        console.warn("Vector search failed (maybe index missing or empty collection), proceeding to generate.");
        litSnap = { docs: [] };
        intSnap = { docs: [] };
    }

    const allCandidates = [...litSnap.docs, ...intSnap.docs];
    let bestMatch = null;
    let maxScore = 0;

    for (const doc of allCandidates) {
        const d = doc.data();
        const docVec = getVectorData(d.embedding);
        const intVec = getVectorData(d.intent_embedding);
        const s1 = docVec ? cosineSimilarity(userEmbedding, docVec) : 0;
        const s2 = intVec ? cosineSimilarity(userEmbedding, intVec) : 0;
        const score = Math.max(s1, s2);
        if (score > maxScore) { maxScore = score; bestMatch = doc; }
    }

    const activeThreshold = typeof testThreshold === 'number' ? testThreshold : 0.7;
    if (bestMatch && (maxScore > activeThreshold || sourceTranslated)) {
        const matchData = bestMatch.data();
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
    const targetRegionContext = targetInfo ? `dialect for ${targetInfo.region}, ${targetInfo.country}` : `standard dialect`;
    const sourceRegionContext = userInfo ? `dialect for ${userInfo.region}, ${userInfo.country}` : `standard dialect`;

    const translationPrompt = `
        Translate "${trimmedText}" (from ${sourceRegionContext}) into the ${targetRegionContext}.
        1. Provide one main literal/common translation.
        2. Provide up to 5 modern slang variations used by millennials/Gen Z if they exist.
        3. Determine if the sentence is a question.
           - Quality over quantity. Only include slang that is genuinely used (high confidence).
           - Ensure variants are distinct and not just minor grammatical variations.
           - CRITICAL: Match the sentiment/intent of the original text exactly. Do NOT add sentiment (like "how cool", "how bad", "wow") if the original text is neutral.
           - If the input is a noun (e.g. "shoes"), slang should be slang synonyms for that noun (e.g. "kicks"), NOT reactions to it.
           - If there are no good/distinct slang variants, return an empty list.
        Output JSON: {
            "text": "main literal translation",
            "is_slang": false,
            "is_question": boolean,
            "slang_variants": ["slang1", "slang2"]
        }
    `;

    const transResult = await model.generateContent(translationPrompt);
    const transText = transResult.response.text();
    const jsonMatch = transText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : transText.replace(/```json\n?|\n?```/g, '').trim();

    let parsed = { text: "Error translating", is_slang: false, is_question: false, slang_variants: [] as string[] };
    try { parsed = JSON.parse(jsonStr); } catch {
        console.error("JSON Parse Error");
        parsed.text = transText; // Fallback
    }

    // Embed result
    const resEmbed = await embeddingModel.embedContent(parsed.text);
    const resVector = FieldValue.vector(resEmbed.embedding.values);

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
        await newDocRef.update({ usage_count: FieldValue.increment(1) });
    } else {
        // Insert New Target Doc
        const newTargetDoc = {
            text: parsed.text,
            is_slang: parsed.is_slang,
            is_question: parsed.is_question !== undefined ? parsed.is_question : (parsed.text.includes('?') || parsed.text.includes('¿')),
            usage_count: 1,
            locale: targetLocale,
            language: targetInfo?.language || targetLocale.split('-')[0],
            country: targetInfo?.country || 'Unknown',
            region: targetInfo?.region || 'Unknown',
            embedding: resVector,
            intent_embedding: resVector,
            createdAt: FieldValue.serverTimestamp()
        };
        newDocRef = await phrasesRef.add(newTargetDoc);
    }

    // Slang Variants
    if (parsed.slang_variants?.length > 0) {
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
                    const svVec = FieldValue.vector(svEmbed.embedding.values);
                    const slDoc = phrasesRef.doc();
                    batch.set(slDoc, {
                        text: variant, is_slang: true, is_question: parsed.is_question, usage_count: 0,
                        locale: targetLocale, embedding: svVec, intent_embedding: resVector,
                        createdAt: FieldValue.serverTimestamp()
                    });
                }
            } catch { console.error("Embedding/Checking variant failed", variant); }
        }
        await batch.commit();
    }

    // Update Source Translated Map
    await sourceDocRef.update({
        [`translated.${targetLocale}`]: true
    });

    const finalDocSnap = await newDocRef.get();
    const finalData = finalDocSnap.data();

    return {
        id: newDocRef.id,
        text: finalData?.text || parsed.text,
        is_slang: finalData?.is_slang || parsed.is_slang,
        usage_count: finalData?.usage_count || 1,
        locale: targetLocale,
        source: existingTargetQuery.empty ? 'generated' : 'existing_text_match'
    };
}
