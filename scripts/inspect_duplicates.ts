
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();
initializeApp();
const db = getFirestore();

async function run() {
    console.log("Searching for 'Neon rollerblades'...");
    const phrasesRef = db.collection('phrases');
    const snapshot = await phrasesRef.where('text', '==', 'Neon rollerblades').get();

    if (snapshot.empty) {
        console.log("No docs found.");
        return;
    }

    console.log(`Found ${snapshot.size} docs:`);
    snapshot.forEach(doc => {
        const d = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Locale: ${d.locale}`);
        console.log(`Created: ${d.createdAt?.toDate?.() || d.createdAt}`);
        console.log(`Translated Map:`, d.translated);
        console.log(`Usage: ${d.usage_count}`);
        // Log other fields to spot diffs
    });
}

run();
