
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({ projectId: 'speaknative-8ce5c' });
}
const db = getFirestore();

async function inspect() {
    const localeArg = process.argv[2] || 'en-US-CA';
    console.log(`Fetching cache for ${localeArg}...`);
    const docRef = await db.collection('cache_top_phrases').doc(localeArg).get();

    if (!docRef.exists) {
        console.log('Cache doc not found!');
        return;
    }

    const data = docRef.data();
    console.log(`Total phrases: ${data?.phrases?.length}`);

    if (data?.phrases?.length > 0) {
        data.phrases.forEach((sample: unknown, i: number) => {
            console.log(`[${i}] "${sample.text}"`);
            const variantLocales = Object.keys(sample.variants || {});
            if (variantLocales.length > 0) {
                variantLocales.forEach(loc => {
                    console.log(`    -> ${loc}: ${sample.variants[loc].length} variants`);
                });
            } else {
                console.log(`    -> No variants found.`);
            }
        });
    }
}


inspect().catch(console.error);
