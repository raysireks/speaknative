
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({ projectId: 'speaknative-8ce5c' });
}
const db = getFirestore();

async function dropCache() {
    console.log('Dropping cache_top_phrases collection...');
    const snapshot = await db.collection('cache_top_phrases').get();

    if (snapshot.empty) {
        console.log('Cache is already empty.');
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Dropped ${snapshot.size} cache documents.`);
}

dropCache().catch(console.error);
