
import { Ollama } from 'ollama';

const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const model = process.env.OLLAMA_MODEL || 'gemma2';

console.log(`🤖 Testing Ollama connection...`);
console.log(`Host: ${host}`);
console.log(`Model: ${model}`);

const ollama = new Ollama({ host });

async function test() {
    try {
        console.log('📡 Generating test content...');
        const response = await ollama.generate({
            model: model,
            prompt: 'Say "Hello, Ollama is working!" in Arabic if possible.',
            stream: false
        });

        console.log('✅ Success!');
        console.log('Response:', response.response);
    } catch (error: any) {
        console.error('❌ Failed:', error.message);
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.error('\n⚠️  Make sure existing Ollama app is running!');
            console.error('   Run "ollama serve" in a separate terminal if needed.');
        }
    }
}

test();
