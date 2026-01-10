
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

async function verify() {
    console.log('Verifying Phrase Documents...');
    const snapshot = await db.collection('phrases').limit(10).get();

    if (snapshot.empty) {
        console.log('No documents found yet.');
        return;
    }

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Text: "${data.text}"`);
        console.log(`Is Slang: ${data.is_slang}`);
        console.log(`Has Embedding: ${!!data.embedding}`);
        console.log(`Has Intent Embedding: ${!!data.intent_embedding}`);

        const emb = data.embedding?.toArray ? data.embedding.toArray() : data.embedding;
        const intent = data.intent_embedding?.toArray ? data.intent_embedding.toArray() : data.intent_embedding;

        if (emb && intent) {
            const isSame = emb.every((val: number, i: number) => Math.abs(val - intent[i]) < 0.000001);
            console.log(`Embedding == Intent? ${isSame}`);
        }
    });
}

verify().catch(console.error);
