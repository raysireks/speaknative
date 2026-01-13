import * as admin from 'firebase-admin';
import { rebuildGlobalCacheLogic } from '../rebuild_cache';
import * as dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'speaknative-8ce5c'
    });
}

const db = admin.firestore();

async function run() {
    console.log("--- STARTING UNIFIED CACHE REBUILD ---");
    // limit 20 for our test set
    await rebuildGlobalCacheLogic(db, undefined, 20);
    console.log("--- REBUILD COMPLETE ---");
}

run().catch(console.error);
