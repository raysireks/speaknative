
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

async function cleanupDuplicates() {
    console.log("Starting cleanup...");
    const phrasesRef = db.collection('phrases');
    // We need to scan all phrases or specific locales.
    // For efficiency, let's scan by locale.
    const LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];

    for (const locale of LOCALES) {
        console.log(`Scanning ${locale}...`);
        const snapshot = await phrasesRef.where('locale', '==', locale).get();

        const phrasesByText: Record<string, admin.firestore.QueryDocumentSnapshot[]> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const text = data.text;
            if (!phrasesByText[text]) {
                phrasesByText[text] = [];
            }
            phrasesByText[text].push(doc);
        });

        let deletedCount = 0;
        const batch = db.batch();
        let opCount = 0;

        for (const [text, docs] of Object.entries(phrasesByText)) {
            if (docs.length > 1) {
                // Sort by creation time (keep oldest), or by usage_count (keep highest)
                // Let's keep the one with highest usage count, tie-break with creation time (oldest first)
                // Assuming createdAt exists. If not, use insertion order (snapshot is usually consistent).

                docs.sort((a, b) => {
                    const dataA = a.data();
                    const dataB = b.data();
                    // Diff usage count
                    const usageDiff = (dataB.usage_count || 0) - (dataA.usage_count || 0);
                    if (usageDiff !== 0) return usageDiff; // Higher usage first

                    // Diff creation time (if available)
                    const timeA = dataA.createdAt ? dataA.createdAt.toMillis() : 0;
                    const timeB = dataB.createdAt ? dataB.createdAt.toMillis() : 0;
                    return timeA - timeB; // Older first
                });

                // Keep index 0, delete others
                const toKeep = docs[0];
                const toDelete = docs.slice(1);

                console.log(`Found ${docs.length} copies of "${text}". Keeping ${toKeep.id} (usage: ${toKeep.data().usage_count}). Deleting ${toDelete.length}.`);

                for (const d of toDelete) {
                    batch.delete(d.ref);
                    opCount++;
                    deletedCount++;
                }
            }
        }

        if (opCount > 0) {
            await batch.commit();
            console.log(`Deleted ${deletedCount} duplicates in ${locale}.`);
        } else {
            console.log(`No duplicates found in ${locale}.`);
        }
    }
    console.log("Cleanup complete.");
}

cleanupDuplicates().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
