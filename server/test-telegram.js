require('dotenv').config();

const TELEGRAM_API = 'https://api.telegram.org';
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const isEnabled = process.env.TELEGRAM_ENABLE === 'true';

async function testTelegram() {
    console.log('--- Telegram Publishing Test ---');
    console.log(`Enabled: ${isEnabled}`);
    console.log(`Bot Token: ${botToken ? 'Set (Hidden)' : 'Not Set'}`);
    console.log(`Channel ID: ${channelId || 'Not Set'}`);

    if (!isEnabled || !botToken || !channelId) {
        console.error('❌ Cannot test: Telegram is not fully configured in .env');
        return;
    }

    try {
        console.log('1. Verifying Bot...');
        const resMe = await fetch(`${TELEGRAM_API}/bot${botToken}/getMe`);
        const dataMe = await resMe.json();
        
        if (dataMe.ok) {
            console.log(`✅ Bot verified: @${dataMe.result.username}`);
        } else {
            console.error('❌ Bot verification failed:', dataMe.description);
            return;
        }

        console.log('2. Sending Test Message...');
        const text = `<b>تجربة النشر الآلي</b>\n\nهذه رسالة اختبار من نظام (صوت تهامة) للتأكد من ربط قناة تليجرام بشكل صحيح.\nالوقت: ${new Date().toLocaleString('ar-YE')}`;
        
        const resMsg = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: channelId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
            }),
        });

        const dataMsg = await resMsg.json();
        if (dataMsg.ok) {
            console.log('✅ Test message sent successfully to the channel!');
        } else {
            console.error('❌ Failed to send message:', dataMsg.description);
        }

    } catch (error) {
        console.error('❌ Error testing Telegram:', error.message);
    }
}

testTelegram();
