
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ No API key found in .env');
    process.exit(1);
}

console.log(`🔑 Testing API key with NEW SDK (@google/genai): ${apiKey.substring(0, 10)}...`);

const ai = new GoogleGenAI({ apiKey: apiKey });

async function test() {
    try {
        // Try generation with gemini-1.5-flash
        console.log('\n🤖 Testing gemini-1.5-flash...');
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts: [{ text: 'Hello, are you working?' }] }],
            });
            console.log('✅ gemini-1.5-flash is WORKING!');
            console.log('Response:', response?.text || 'No response text');
        } catch (e: any) {
            console.error('❌ gemini-1.5-flash FAILED:', e.message);
            console.error(JSON.stringify(e, null, 2));
        }

    } catch (error: any) {
        console.error('❌ specific test failed:', error.message);
    }
}

test();
