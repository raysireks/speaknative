/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const API_KEY = "AIzaSyA8IoiieYoACtyDfpKP9RfS9lLd8JYp9tg";

// Initialize Firebase Admin
initializeApp({
    projectId: 'speaknative-8ce5c'
});
const db = getFirestore();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

async function updateUsageCount() {
    console.log('Adding usage_count to existing phrases...');
    const snapshot = await db.collection('phrases').get();

    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
        batch.update(doc.ref, { usage_count: 0 });
        count++;

        if (count >= 500) {
            await batch.commit();
            totalUpdated += count;
            console.log(`Updated ${totalUpdated} documents...`);
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        totalUpdated += count;
    }

    console.log(`Finished! Added usage_count: 0 to ${totalUpdated} documents.`);
}

updateUsageCount();
