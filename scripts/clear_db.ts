import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin (assuming local credentials handled or passed via env)
if (!getApps().length) {
    initializeApp({
        projectId: "speaknative-8ce5c"
    });
}
const db = getFirestore();

async function clearCollections() {
    console.log("Clearing 'phrases' and 'cache_top_phrases'...");

    // Clear phrases
    const phrasesSnapshot = await db.collection('phrases').get();
    if (phrasesSnapshot.empty) {
        console.log("No phrases to delete.");
    } else {
        const batch = db.batch();
        let count = 0;
        phrasesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });
        await batch.commit();
        console.log(`Deleted ${count} phrase documents.`);
    }

    // Clear cache
    const cacheSnapshot = await db.collection('cache_top_phrases').get();
    if (cacheSnapshot.empty) {
        console.log("No cache documents to delete.");
    } else {
        const batch = db.batch();
        cacheSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("Deleted cache documents.");
    }
}

clearCollections().catch(console.error);
