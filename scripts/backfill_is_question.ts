
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// Heuristic regex for questions (Spanish and English)
const QUESTION_REGEX = /^[\¿\?]|[\¿\?]$|^(what|where|who|when|why|how|can|could|would|do|does|did|is|are|am|will|shall|may|might|should)\b|.*\?$/i;

async function backfillIsQuestion() {
    console.log("Starting backfill of is_question...");
    const phrasesRef = db.collection('phrases');
    const snapshot = await phrasesRef.get(); // Process all phrases

    let updatedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let opCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.is_question !== undefined) continue; // Skip if already set

        const text = data.text || "";
        const isQuestion = QUESTION_REGEX.test(text.trim());

        batch.update(doc.ref, { is_question: isQuestion });
        opCount++;
        updatedCount++;

        if (opCount >= batchSize) {
            await batch.commit();
            console.log(`Committed batch of ${opCount} updates.`);
            batch = db.batch();
            opCount = 0;
        }
    }

    if (opCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${opCount} updates.`);
    }

    console.log(`Backfill complete. Updated ${updatedCount} documents.`);
}

backfillIsQuestion().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
