
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();
initializeApp();
const db = getFirestore();

async function run() {
    const DUPLICATE_ID = 'wWEHWs3HJH9xwt1HoJdZ';
    const MAIN_ID = '2nwn21Gf9U8L5DaPevLU';

    console.log(`Deleting duplicate doc: ${DUPLICATE_ID}`);
    await db.collection('phrases').doc(DUPLICATE_ID).delete();

    console.log(`Verifying main doc: ${MAIN_ID}`);
    const doc = await db.collection('phrases').doc(MAIN_ID).get();
    if (doc.exists) {
        console.log(`Main doc intact. Translated:`, doc.data()?.translated);
    } else {
        console.error("Main doc missing! Restore required.");
    }
}

run();
