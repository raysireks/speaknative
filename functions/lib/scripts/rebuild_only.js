"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const rebuild_cache_1 = require("../rebuild_cache");
const dotenv = require("dotenv");
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
    await (0, rebuild_cache_1.rebuildGlobalCacheLogic)(db, undefined, 20);
    console.log("--- REBUILD COMPLETE ---");
}
run().catch(console.error);
//# sourceMappingURL=rebuild_only.js.map