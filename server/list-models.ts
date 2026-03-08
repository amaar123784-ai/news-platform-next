
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ No API key found in .env');
    process.exit(1);
}

const genAI = new GoogleGenAI(apiKey);

async function listModels() {
    try {
        const result = await genAI.listModels();
        console.log('Available Gemini Models:');
        result.models.forEach(model => {
            console.log(`- ${model.name} (${model.displayName})`);
        });
    } catch (error: any) {
        console.error('❌ Error listing models:', error.message);
    }
}

listModels();
