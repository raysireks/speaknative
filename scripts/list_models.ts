
import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API Key found in .env");
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.displayName}): ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Failed to list models:", e);
    }
}

listModels();
