"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const dotenv = require("dotenv");
const translate_core_1 = require("./translate_core");
dotenv.config();
// Initialize Firebase Admin
if (process.env.FIREBASE_CONFIG || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    (0, app_1.initializeApp)();
}
else {
    (0, app_1.initializeApp)({
        projectId: 'speaknative-8ce5c'
    });
}
const db = (0, firestore_1.getFirestore)();
async function reseed() {
    console.log("Starting Cache Reseed for Top 10 Phrases...");
    try {
        // 1. Get Top 10 Phrases regardless of locale
        const topPhrasesSnap = await db.collection('phrases')
            .orderBy('usage_count', 'desc')
            .limit(10)
            .get();
        if (topPhrasesSnap.empty) {
            console.log("No phrases found to reseed.");
            return;
        }
        console.log(`Found ${topPhrasesSnap.size} phrases to refresh.`);
        const ALL_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
        for (const doc of topPhrasesSnap.docs) {
            const data = doc.data();
            const sourceLocale = data.locale;
            console.log(`\nRefreshing: "${data.text}" (Source: ${sourceLocale}, Usage: ${data.usage_count})`);
            const targetLocales = ALL_LOCALES.filter(loc => loc !== sourceLocale);
            for (const targetLocale of targetLocales) {
                console.log(`  -> Targeting: ${targetLocale}`);
                try {
                    const result = await (0, translate_core_1.translateCore)(db, data.text, sourceLocale, targetLocale, 0.7, // Default threshold
                    true // forceRefresh: TRUE
                    );
                    console.log(`     Done: "${result.text}"`);
                }
                catch (error) {
                    console.error(`     Error re-translating for ${targetLocale}:`, error);
                }
                // Rate limit to avoid triggering Gemini safety/quota too fast
                await new Promise(res => setTimeout(res, 800));
            }
        }
        console.log("\nSource Translations Refreshed. Now rebuilding optimized cache collection...");
        // 2. Call Rebuild Logic for the top phrases cache
        const { rebuildGlobalCacheLogic } = await Promise.resolve().then(() => require('./rebuild_cache'));
        await rebuildGlobalCacheLogic(db, undefined, 10);
        console.log("\nCache Reseed and Rebuild Completed Successfully.");
    }
    catch (error) {
        console.error("Fatal error during reseed:", error);
        process.exit(1);
    }
}
reseed();
//# sourceMappingURL=reseed_cache.js.map