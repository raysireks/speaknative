import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
    initializeApp({ projectId: "speaknative-8ce5c" });
}
const db = getFirestore();

async function checkSource() {
    const TEST_PHRASE = "What's up buddy?";
    console.log(`Checking phrase: "${TEST_PHRASE}"`);

    const snapshot = await db.collection('phrases')
        .where('text', '==', TEST_PHRASE)
        .where('locale', '==', 'en-US-CA')
        .get();

    if (snapshot.empty) {
        console.log("Not found.");
    } else {
        const data = snapshot.docs[0].data();
        console.log("Found:", JSON.stringify(data, null, 2));
    }
}

checkSource();
