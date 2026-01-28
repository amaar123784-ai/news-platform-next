
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Generate a random timestamp for the test article
const timestamp = new Date().toISOString();

async function testWebhook() {
    const webhookUrl = 'https://n8n.voiceoftihama.com/webhook/new-article';

    const testPayload = {
        id: `test-article-${Date.now()}`,
        title: 'خبر تجريبي: اختبار النشر التلقائي',
        slug: `test-article-${Date.now()}`,
        excerpt: 'هذا مجرد خبر تجريبي للتحقق من أن نظام النشر التلقائي يعمل بشكل صحيح على فيسبوك وتليجرام.',
        content: '<p>هذا هو محتوى الخبر التجريبي. نأمل أن يعمل النظام بنجاح!</p>',
        imageUrl: 'https://via.placeholder.com/800x600.png?text=Test+News+Image',
        category: 'breaking', // Set to 'breaking' to test that flow, or 'general' for normal
        publishedAt: timestamp,
        sourceUrl: 'https://voiceoftihama.com',
        isBreaking: true
    };

    console.log('🚀 Sending test payload to n8n:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

    try {
        const response = await axios.post(webhookUrl, testPayload);
        console.log('✅ Success! n8n received the webhook.');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('❌ Error sending webhook:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        } else {
            console.error('❌ Unexpected error:', error);
        }
    }
}

testWebhook();
