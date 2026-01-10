
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({
        projectId: 'speaknative-8ce5c'
    });
}
const db = getFirestore();

import * as fs from 'fs';

async function count() {
    const snapshot = await db.collection('phrases').count().get();
    const count = snapshot.data().count;
    console.log(`Total Phrases: ${count}`);
    fs.writeFileSync('count.txt', `Total Phrases: ${count}`);
    process.exit(0);
}

count().catch(console.error);
