import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
    initializeApp({ projectId: "speaknative-8ce5c" });
}
const db = getFirestore();

async function deletePhrase(text: string) {
    console.log(`Deleting phrase: "${text}"...`);
    const snapshot = await db.collection('phrases').where('text', '==', text).get();

    if (snapshot.empty) {
        console.log("Phrase not found.");
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Deleted ${snapshot.size} documents.`);
}

deletePhrase("Pienso yo").catch(console.error);
