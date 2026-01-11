
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { rebuildGlobalCacheLogic } from '../functions/src/rebuild_cache.ts';

dotenv.config();

// Init Firebase
if (getApps().length === 0) {
    initializeApp({
        projectId: 'speaknative-8ce5c'
    });
}
const db = getFirestore();

// Parse args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const localesArg = args.find(a => a.startsWith('--locales='));

const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
const locales = localesArg ? localesArg.split('=')[1].split(',') : undefined;

console.log(`Running Local Cache Rebuild. Limit: ${limit}, Locales: ${locales?.join(',') || 'ALL'}`);

rebuildGlobalCacheLogic(db, locales, limit)
    .then(() => {
        console.log("Local Rebuild Success.");
        process.exit(0);
    })
    .catch(err => {
        console.error("Local Rebuild Failed:", err);
        process.exit(1);
    });
