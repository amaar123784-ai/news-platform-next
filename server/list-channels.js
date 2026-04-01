/**
 * WhatsApp Channel & Group ID Discovery Script
 * 
 * Run this to find the JID (ID) of the groups or channels you want to post to.
 * Usage: npx tsx list-channels.js
 */

/// <reference types="node" />
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

async function listWhatsAppEntities() {
    console.log('\n--- 📱 WhatsApp ID Discovery Utility ---\n');

    try {
        // Use the same auth folder as the main service
        const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-auth');
        const { version } = await fetchLatestBaileysVersion();

        console.log('[Info] Initializing connection to WhatsApp...');
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true, // Only needed if session expired
            browser: ['VoiceOfTihama Discovery', 'Chrome', '120.0'],
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('[Warning] Session expired. Please scan this QR code to continue:');
            }

            if (connection === 'open') {
                console.log('\n✅ Connected successfully!\n');

                // 1. Fetch Groups
                console.log('--- 👥 WHATSAPP GROUPS ---');
                try {
                    const groups = await sock.groupFetchAllParticipating();
                    const groupList = Object.values(groups).map(g => ({
                        'Name': g.subject,
                        'JID (Copy this to .env)': g.id
                    }));

                    if (groupList.length > 0) {
                        console.table(groupList);
                    } else {
                        console.log('No groups found.');
                    }
                } catch (err) {
                    console.error('Failed to fetch groups:', err.message);
                }

                // 2. Fetch Newsletters (Channels)
                console.log('\n--- 📢 WHATSAPP CHANNELS (Newsletters) ---');
                try {
                    // Try different Baileys versions methods for newsletters
                    let newsletters = [];
                    
                    if (typeof sock.newsletterSubscribed === 'function') {
                        newsletters = await sock.newsletterSubscribed();
                    } else if (typeof sock.newsletterSubscriptions === 'function') {
                        newsletters = await sock.newsletterSubscriptions();
                    } else {
                        // Brute force method finding
                        const subFn = Object.values(sock).find(fn => fn && typeof fn === 'function' && fn.name.includes('newsletterSubscribed'));
                        if (subFn) newsletters = await subFn();
                    }

                    const channelList = newsletters.map(nl => ({
                        'Name': nl.name || 'Unnamed Channel',
                        'JID (Copy this to .env)': nl.id,
                        'Role': nl.role || 'viewer'
                    }));

                    if (channelList.length > 0) {
                        console.table(channelList);
                    } else {
                        console.log('No subscribed channels found. Note: You MUST join the channel on your phone first.');
                    }
                } catch (err) {
                    console.warn('Could not fetch channels automatically:', err.message);
                    console.log('💡 Tip: Use get-channel-id.js for targeted discovery of a specific link.');
                }

                console.log('\n--- 🏁 Discovery Complete ---\n');
                console.log('Instructions: Copy the relevant JID above and paste it into your .env as WHATSAPP_CHANNEL_ID');
                
                // Graceful Exit
                sock.ws.close();
                process.exit(0);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (!shouldReconnect) {
                    console.error('❌ Authentication failed. Please delete the ./whatsapp-auth folder and scan again.');
                    process.exit(1);
                }
            }
        });

    } catch (error) {
        console.error('❌ Fatal error during discovery:', error.message);
        process.exit(1);
    }
}

listWhatsAppEntities();
