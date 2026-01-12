/* eslint-disable @typescript-eslint/no-explicit-any */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({ projectId: 'speaknative-8ce5c' });
}
const db = getFirestore();

async function inspect() {
    console.log('Fetching cache for es-CO-CTG...');
    const docRef = await db.collection('cache_top_phrases').doc('es-CO-CTG').get();

    if (!docRef.exists) {
        console.log('Cache doc not found!');
        return;
    }

    const data = docRef.data();
    console.log(`Total phrases: ${data?.phrases?.length}`);

    // Find "Delicioso"
    const target = data?.phrases.find((p: unknown) => p.text === 'Delicioso');

    if (target) {
        console.log(`\nFound target: "${target.text}"`);
        const keys = Object.keys(target.variants || {});
        console.log(`Variant Keys: ${keys.join(', ')}`);

        if (target.variants?.['en-US-CA']) {
            console.log(`English Variants: ${JSON.stringify(target.variants['en-US-CA'], null, 2)}`);
        } else {
            console.log('!!! NO ENGLISH VARIANTS for Delicioso !!!');
        }
    } else {
        console.log('Could not find phrase "Delicioso" in cache.');
    }
}

inspect().catch(console.error);
