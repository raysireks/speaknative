
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

    const checks = [
        ["Te quiero mucho", "I love you very much"],
        ["Thank you", "Gracias"],
        ["How's it going?", "¿Cómo estás?"],
        ["I need some help.", "¿Me das una mano?"],
        ["Morning!", "¡Buen día!"],
        ["Later, dude", "¡Bien, llave!"]
    ];

    for (const [p1, p2] of checks) {
        const r1 = await model.embedContent(p1);
        const r2 = await model.embedContent(p2);
        const score = cosineSimilarity(r1.embedding.values, r2.embedding.values);
        console.log(`Similarity "${p1}" <-> "${p2}": ${score.toFixed(4)}`);
    }
}


check().catch(console.error);
