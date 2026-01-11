import fetch from 'node-fetch';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
    initializeApp({ projectId: "speaknative-8ce5c" });
}

async function invokeTranslate(text: string) {
    // URL for the deployed function
    const url = 'https://us-central1-speaknative-8ce5c.cloudfunctions.net/translateAndStore';

    // Payload to prompt a "fresh" translation
    const payload = {
        data: {
            text: text,
            userLocale: 'en-US-CA',
            targetLocale: 'es-CO-CTG'
        }
    };

    console.log(`\n--- Requesting translation for "${text}" ---`);
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${await response.text()}`);
    }

    const json = await response.json();
    if (json.result) {
        delete json.result.embedding;
        delete json.result.intent_embedding;
    }
    console.log("Response:", JSON.stringify(json, null, 2));
    return json;
}

async function runTest() {
    const TEST_PHRASE = "Neon rollerblades";

    try {
        console.log("1. First Request (Should generate)...");
        const res1 = await invokeTranslate(TEST_PHRASE);

        console.log("Waiting 3 seconds for async slang storage...");
        await new Promise(r => setTimeout(r, 3000));

        // Verify Slang Variants in DB
        const db = getFirestore();
        const slangSnapshot = await db.collection('phrases')
            .where('locale', '==', 'es-CO-CTG')
            .where('is_slang', '==', true)
            .limit(5)
            .get();

        console.log("\n--- Checking Slang Variants in DB ---");
        if (slangSnapshot.empty) {
            console.log("No slang variants found.");
        } else {
            slangSnapshot.docs.forEach(doc => {
                console.log(`FOUND SLANG: "${doc.data().text}" (is_slang: ${doc.data().is_slang})`);
            });
        }

        console.log("\n2. Second Request (Should retrieve cache/existing)...");
        const res2 = await invokeTranslate(TEST_PHRASE);

        console.log("\nDone.");
    } catch (e) {
        console.error("Test failed:", e);
    }
}


runTest();
