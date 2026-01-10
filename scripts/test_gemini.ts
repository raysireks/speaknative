import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Say hello");
        console.log(result.response.text());
    } catch (e) {
        console.error(e);
    }
}

test();
