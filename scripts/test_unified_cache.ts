
import * as admin from 'firebase-admin';
console.log("Admin initialized:", !!admin);
import * as dotenv from 'dotenv';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';

dotenv.config();

// Client-side config (needed for callable functions)
const firebaseConfig = {
    apiKey: process.env.GOOGLE_API_KEY, // Note: Client usually needs distinct key, but for script we try checking env
    projectId: 'speaknative-8ce5c', // Hardcoded for now based on deploy logs
};

// We use Admin for DB checks, Client for Function calls? 
// Actually, `firebase-admin` can't call https callables easily like client SDK.
// We'll use the Client SDK for the function call.
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
// Connect to emulator if needed? No, production test requested.

/*
 * Test Scenario:
 * 1. Ensure "Pienso yo" (or similar) exists and has translated: true (or map).
 * 2. Call getUnifiedPhraseCache with threshold = 1.0 (Force miss).
 * 3. Expect it to return fallback variants (not error).
 */

async function runTest() {
    const TEST_PHRASE = "Neon rollerblades";
    const USER_LOCALE = "en-US-CA";

    console.log(`Testing Unified Cache for "${TEST_PHRASE}"...`);

    const getUnifiedPhraseCache = httpsCallable(functions, 'getUnifiedPhraseCache');

    try {
        const result = await getUnifiedPhraseCache({
            text: TEST_PHRASE,
            userLocale: USER_LOCALE,
            limit: 100,
            threshold: 1.0 // STRICT! Should trigger fallback if translated:true
        });

        console.log("Result:", JSON.stringify(result.data, null, 2));

    } catch (error) {
        console.error("Error calling function:", error);
    }
}

runTest();
