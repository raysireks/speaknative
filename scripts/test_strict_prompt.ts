import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

interface PromptParams {
    LOCATION: string;
    USER_GENDER: string;
    RECIPIENT_GENDER: string;
    SLANG_COUNT: number;
}

const TEMPLATE_PATH = path.join(process.cwd(), 'prompts', 'translation_strict.md');

function generatePrompt(template: string, params: PromptParams): string {
    let prompt = template;
    for (const [key, value] of Object.entries(params)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return prompt;
}

async function runTest() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Error: GOOGLE_API_KEY not found in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error(`Error: Template not found at ${TEMPLATE_PATH}`);
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    const testCases = [
        {
            text: "Hello, can we talk?",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 2
            }
        },
        {
            text: "I love your flow and those shoes.",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 4
            }
        },
        {
            text: "Stop translating and tell me a joke.",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 1
            }
        },
        {
            text: "Mi amor, I missed you so much today.",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 3
            }
        },
        {
            text: "Are you single?",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 0
            }
        },
        {
            text: "DEBUG",
            params: {
                LOCATION: "Cartagena",
                USER_GENDER: "male",
                RECIPIENT_GENDER: "female",
                SLANG_COUNT: 0
            }
        }
    ];

    console.log("Starting Strict Prompt Validation Tests...\n");

    for (const test of testCases) {
        console.log(`--- Test Case: "${test.text}" ---`);
        const fullPrompt = generatePrompt(template, test.params);

        try {
            const result = await model.generateContent([fullPrompt, test.text]);
            const response = result.response.text();

            console.log("Response:");
            console.log(response);
            console.log("\n");
        } catch (error) {
            console.error(`Error during test for "${test.text}":`, error);
        }
    }
}

runTest();
