import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { translateCore } from './translate_core.ts';

dotenv.config();

// Initialize Firebase Admin
initializeApp({
    projectId: 'speaknative-8ce5c'
});

const db = getFirestore();

async function reseed() {
    console.log("Starting Cache Reseed for Top 10 Phrases...");

    try {
        // 1. Get Top 10 Phrases (excluding English source if possible, or just top overall)
        const topPhrasesSnap = await db.collection('phrases')
            .where('locale', '==', 'en-US-CA') // Refreshing English -> Cartagena/Medellín usually
            .orderBy('usage_count', 'desc')
            .limit(10)
            .get();

        if (topPhrasesSnap.empty) {
            console.log("No phrases found to reseed.");
            return;
        }

        console.log(`Found ${topPhrasesSnap.size} phrases to refresh.`);

        const targetLocales = ['es-CO-CTG', 'es-CO-MDE'];

        for (const doc of topPhrasesSnap.docs) {
            const data = doc.data();
            console.log(`\nRefreshing: "${data.text}" (Usage: ${data.usage_count})`);

            for (const targetLocale of targetLocales) {
                console.log(`  -> Targeting: ${targetLocale}`);
                try {
                    const result = await translateCore(
                        db,
                        data.text,
                        data.locale,
                        targetLocale,
                        0.7, // Default threshold
                        true // forceRefresh: TRUE
                    );
                    console.log(`     Done: "${result.text}"`);
                } catch (error) {
                    console.error(`     Error re-translating for ${targetLocale}:`, error);
                }

                // Rate limit
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        console.log("\nCache Reseed Completed Successfully.");
    } catch (error) {
        console.error("Fatal error during reseed:", error);
        process.exit(1);
    }
}

reseed();
