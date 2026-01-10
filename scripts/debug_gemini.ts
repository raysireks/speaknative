import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function listModels() {
    try {
        // There is no direct listModels in the client SDK, usually we just try a model.
        // If it fails with 404, the model might not exist or the API key is wrong.
        // I'll try 'gemini-1.0-pro' as a fallback test.
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Say hello");
        console.log("Success with gemini-1.0-pro:", result.response.text());
    } catch (e) {
        console.error("Failed with gemini-1.0-pro:", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (e) {
        console.error("Failed with gemini-1.5-flash:", e);
    }
}

listModels();
