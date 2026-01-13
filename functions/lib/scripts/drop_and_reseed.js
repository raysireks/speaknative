"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const translate_core_1 = require("../translate_core");
const rebuild_cache_1 = require("../rebuild_cache");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'speaknative-8ce5c'
    });
}
const db = admin.firestore();
async function deleteCollection(collectionPath, batchSize = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);
    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}
async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}
async function run() {
    console.log("--- STARTING FULL DROP AND RESEED ---");
    // 1. Delete existing data
    console.log("Deleting 'phrases' collection...");
    await deleteCollection('phrases');
    console.log("Deleting 'cache_top_phrases' collection...");
    await deleteCollection('cache_top_phrases');
    // 2. Load seed phrases
    const seedPath = path.join(__dirname, 'seed_phrases.json');
    const seedPhrases = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    console.log(`Loaded ${seedPhrases.length} concepts to seed.`);
    const ALL_LOCALES = ['en-US-CA', 'es-CO-CTG', 'es-CO-MDE'];
    // 3. Matrix Seeding (Bootstrap)
    for (let i = 0; i < seedPhrases.length; i++) {
        const seed = seedPhrases[i];
        console.log(`\n[Concept ${i + 1}/${seedPhrases.length}] Matrix Seeding: "${seed.text}" (${seed.locale})`);
        const nodeMaps = {};
        const targetLocales = ALL_LOCALES.filter(loc => loc !== seed.locale);
        // Step A: Translate Source -> Targets (Creates all needed documents)
        for (const targetLocale of targetLocales) {
            console.log(`  Generating: ${seed.locale} -> ${targetLocale}`);
            try {
                // translateCore will create the source if needed, and the target.
                // It returns the Target's ID and text.
                const res = await (0, translate_core_1.translateCore)(db, seed.text, seed.locale, targetLocale, 0.8, true);
                if (res) {
                    nodeMaps[targetLocale] = { id: res.id, text: res.text };
                    // We also need the source ID if we don't have it
                    if (!nodeMaps[seed.locale]) {
                        // We can't easily get the source ID from translateCore's result (it returns target)
                        // So let's find it once
                        const sourceSnap = await db.collection('phrases')
                            .where('locale', '==', seed.locale)
                            .where('text', '==', seed.text.trim())
                            .limit(1).get();
                        if (!sourceSnap.empty) {
                            nodeMaps[seed.locale] = { id: sourceSnap.docs[0].id, text: seed.text };
                        }
                    }
                    console.log(`     Done: "${res.text}"`);
                }
            }
            catch (error) {
                console.error(`     Error:`, error);
            }
            await new Promise(res => setTimeout(res, 800));
        }
        // Step B: Manual Matrix Link (Bypasses Vector Search Lag)
        // Now for every pair (A, B), (B, C), (A, C) we manually set the translated flag
        const locales = Object.keys(nodeMaps);
        console.log(`  Manually linking matrix for: ${locales.join(', ')}`);
        for (const fromLoc of locales) {
            const fromNode = nodeMaps[fromLoc];
            if (!fromNode)
                continue;
            const otherLocales = locales.filter(loc => loc !== fromLoc);
            const updates = {};
            for (const toLoc of otherLocales) {
                updates[`translated.${toLoc}`] = true;
            }
            if (Object.keys(updates).length > 0) {
                await db.collection('phrases').doc(fromNode.id).update(updates);
            }
        }
    }
    // 4. Wait for Indexing (Safety for the final Rebuild which uses vector search)
    console.log("\n--- SEEDING PHASE COMPLETE ---");
    console.log("Waiting 90 seconds for Firestore Vector Indexing to catch up...");
    await new Promise(res => setTimeout(res, 90000));
    // 5. Final Global Rebuild (This will now correctly find the variants)
    console.log("\nStarting final global cache rebuild...");
    await (0, rebuild_cache_1.rebuildGlobalCacheLogic)(db, undefined, seedPhrases.length);
    console.log("\n--- FULL DROP AND RESEED COMPLETE ---");
}
run().catch(console.error);
//# sourceMappingURL=drop_and_reseed.js.map