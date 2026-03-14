const { useMultiFileAuthState, default: makeWASocket } = require('@whiskeysockets/baileys');

async function test() {
    const { state } = await useMultiFileAuthState('./whatsapp-auth');
    const sock = makeWASocket({ auth: state });
    
    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            console.log('Connected to WhatsApp via test script.');
            const methods = Object.keys(sock).filter(k => k.toLowerCase().includes('newsletter'));
            console.log('Newsletter methods found:', methods);
            
            try {
                const channels = await sock.newsletterSubscribed();
                console.log('Channels (Subscribed):', JSON.stringify(channels, null, 2));
            } catch (e) { console.log('Err1:', e.message); }
            
            try {
                const channels = await sock.newsletterSubscriptions();
                console.log('Channels (Subscriptions):', JSON.stringify(channels, null, 2));
            } catch (e) { console.log('Err2:', e.message); }

            process.exit(0);
        }
    });

    sock.ev.on('creds.update', () => {});
}
test();
