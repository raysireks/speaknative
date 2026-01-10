
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (magA && magB) ? dot / (magA * magB) : 0;
}

async function check() {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const p1 = "Te quiero mucho";
    const p2 = "I love you very much"; // Expected match

    console.log(`Embedding "${p1}"...`);
    const r1 = await model.embedContent(p1);

    console.log(`Embedding "${p2}"...`);
    const r2 = await model.embedContent(p2);

    const score = cosineSimilarity(r1.embedding.values, r2.embedding.values);
    console.log(`\nSimilarity Score: ${score.toFixed(4)}`);

    if (score < 0.8) {
        console.log("Verdict: 0.8 Threshold is TOO HIGH");
    } else {
        console.log("Verdict: 0.8 Should have worked...");
    }
}

check().catch(console.error);
