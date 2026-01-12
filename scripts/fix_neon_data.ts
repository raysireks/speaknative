
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

initializeApp();

const db = getFirestore();

async function run() {
    const phrasesRef = db.collection('phrases');
    const snapshot = await phrasesRef.where('text', '==', 'Neon rollerblades').where('locale', '==', 'en-US-CA').get();

    if (snapshot.empty) {
        console.log("Not found");
        return;
    }

    const doc = snapshot.docs[0];
    console.log(`Updating ${doc.id}...`);

    await doc.ref.update({
        translated: {
            'es-CO-CTG': true
        }
    });
    console.log("Updated translated map.");
}

run();
