import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

async function run() {
    console.log('Connecting to WhatsApp...');
    const { state } = await useMultiFileAuthState('./whatsapp-auth');
    
    // Using default export pattern for ES modules compatibility
    const sock = (makeWASocket.default || makeWASocket)({ 
        auth: state,
        printQRInTerminal: true 
    });
    
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        
        if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
            try {
                // The invite code from: https://whatsapp.com/channel/0029VbCPmHj1HspqfKinlk16
                const inviteCode = '0029VbCPmHj1HspqfKinlk16';
                console.log('🔍 Fetching metadata for invite code:', inviteCode);
                
                // Robust method discovery for Baileys
                let metadata;
                
                // 1. Try direct call (if typings match)
                if (typeof sock.newsletterMetadata === 'function') {
                    metadata = await sock.newsletterMetadata('invite', inviteCode);
                } 
                // 2. Try searching for the function (Baileys sometimes hides it or renames during builds)
                else {
                    const foundFn = Object.values(sock).find(fn => 
                        fn && typeof fn === 'function' && 
                        (fn.name === 'newsletterMetadata' || fn.toString().includes('newsletter'))
                    );
                    
                    if (foundFn) {
                        console.log('Found internal newsletter function, executing...');
                        metadata = await foundFn('invite', inviteCode);
                    }
                }

                if (metadata) {
                    console.log('\n=========================================');
                    console.log('✅ CHANNEL JID FOUND:');
                    console.log(`Name: ${metadata.name || 'Unknown'}`);
                    console.log(`JID:  ${metadata.id}`);
                    console.log('=========================================\n');
                    console.log('📋 INSTRUCTION:');
                    console.log(`Update your server/.env file with:`);
                    console.log(`WHATSAPP_CHANNEL_ID=${metadata.id}`);
                } else {
                    console.error('❌ Failed to find the metadata function. Your Baileys version might be incompatible.');
                }
            } catch (err) {
                console.error('❌ Error details:', err.message);
                
                // Fallback attempt: List all subscriptions to see if it's there
                console.log('Trying fallback: Listing all subscribed channels...');
                try {
                    const subs = await sock.newsletterSubscribed();
                    if (subs && subs.length > 0) {
                        console.log('Subscribed channels:');
                        console.table(subs.map(s => ({ Name: s.name, ID: s.id })));
                    } else {
                        console.log('No subscribed channels found. Try joining the channel on your phone first.');
                    }
                } catch (subErr) {
                    console.error('Fallback failed:', subErr.message);
                }
            }
            process.exit(0);
        }
        
        if (connection === 'close') {
            console.log('Connection closed. If this was a crash, check your session.');
        }
    });

    sock.ev.on('creds.update', () => {});
}

run().catch(err => console.error('Fatal error:', err));
