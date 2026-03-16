import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

async function listChannels() {
    console.log('Loading WhatsApp session...');
    const { state } = await useMultiFileAuthState('./whatsapp-auth');
    
    // @ts-ignore
    const sock = makeWASocket.default({
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        
        if (connection === 'open') {
            console.log('\n✅ Connected to WhatsApp!');
            console.log('\n--- Fetching your Channels/Newsletters ---');
            
            try {
                // @ts-ignore
                const newsletters = await sock.newsletterMetadata('all');
                
                if (!newsletters || newsletters.length === 0) {
                    console.log('❌ No channels found. You might need to create one first.');
                } else {
                    console.log(`Found ${newsletters.length} channel(s): \n`);
                    // @ts-ignore
                    newsletters.forEach((channel, index) => {
                        console.log(`[${index + 1}] Name: ${channel.name}`);
                        console.log(`    JID (Channel ID): ${channel.id}`);
                        console.log(`    Link:    https://whatsapp.com/channel/${channel.inviteCode}`);
                        console.log('--------------------------------------------------');
                    });
                    
                    console.log('\n👉 Copy the "JID" of your target channel and paste it in your .env file as WHATSAPP_CHANNEL_ID.');
                }
            } catch (error) {
                console.error('Error fetching channels:', error.message);
                console.log('Note: Channel fetching sometimes requires the account to be fully synced or have admin rights to the channel.');
            }
            
            console.log('\nClosing connection. You can now press Ctrl+C to exit.');
            process.exit(0);
        }
    });
}

listChannels().catch(console.error);
