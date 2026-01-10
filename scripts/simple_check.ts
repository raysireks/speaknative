import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = "AIzaSyA8IoiieYoACtyDfpKP9RfS9lLd8JYp9tg";

initializeApp({ projectId: 'speaknative-8ce5c' });
const db = getFirestore();
const genAI = new GoogleGenerativeAI(API_KEY);

async function check() {
    try {
        console.log('Checking database...');
        const countSnapshot = await db.collection('phrases').count().get();
        console.log(`Total documents: ${countSnapshot.data().count}`);

        // Replicate the query
        const text = "travel greeting food";
        const targetLocale = "es-CO-CTG";

        console.log(`Embedding text: "${text}"`);
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        const searchEmbedding = result.embedding.values;

        console.log(`Running vector search for locale: ${targetLocale}`);
        const phrasesRef = db.collection('phrases');
        const query = phrasesRef.where('locale', '==', targetLocale);
        const vectorQuery = query.findNearest('embedding', searchEmbedding, {
            limit: 5,
            distanceMeasure: 'COSINE'
        });

        const snapshot = await vectorQuery.get();
        const docs = await db.collection('phrases').limit(10).get();
        docs.forEach(doc => {
            const data = doc.data();
            console.log(`[${doc.id}] Locale: ${data.locale} | Slang: ${data.is_slang} | Usage: ${data.usage_count} | Text: "${data.text}"`);
        });
        console.log(`Found ${snapshot.size} matches.`);
        snapshot.forEach(doc => {
            console.log(doc.id, doc.data().text, doc.data().is_slang);
        });

    } catch (error) {
        console.error('Error checking database:', error);
    }
}

check();
