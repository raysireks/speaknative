
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (getApps().length === 0) {
    initializeApp({ projectId: 'speaknative-8ce5c' });
}
const db = getFirestore();

async function list() {
    const locale = process.argv[2] || 'es-CO-CTG';
    console.log(`Listing phrases for ${locale}...`);
    const snap = await db.collection('phrases').where('locale', '==', locale).limit(20).get();

    snap.docs.forEach(d => {
        const data = d.data();
        console.log(`- ${data.text} (Usage: ${data.usage_count}, Slang: ${data.is_slang})`);
    });
    console.log(`Total found: ${snap.size}`);
}

list().catch(console.error);
