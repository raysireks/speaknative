
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({ projectId: 'speaknative-8ce5c' });
}
const db = getFirestore();

async function inspect() {
    console.log('Fetching cache for en-US-CA...');
    const docRef = await db.collection('cache_top_phrases').doc('en-US-CA').get();

    if (!docRef.exists) {
        console.log('Cache doc not found!');
        return;
    }

    const data = docRef.data();
    console.log(`Total phrases: ${data?.phrases?.length}`);

    if (data?.phrases?.length > 0) {
        const sample = data.phrases[0];
        console.log(`Sample: "${sample.text}"`);
        const keys = Object.keys(sample.variants || {});
        console.log(`Variant Keys: ${keys.join(', ')}`);

        if (sample.variants?.['es-CO-CTG']) {
            console.log(`Cartagena Variants: ${JSON.stringify(sample.variants['es-CO-CTG'], null, 2)}`);
        } else {
            console.log('No Cartagena variants for sample.');
        }
    }
}

inspect().catch(console.error);
