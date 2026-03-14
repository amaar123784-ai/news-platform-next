import baileys from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState } = baileys;

async function run() {
    const { state } = await useMultiFileAuthState('./whatsapp-auth');
    const sock = makeWASocket({ auth: state });
    
    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            try {
                // The invite code is the part after whatsapp.com/channel/
                const inviteCode = '0029VbCPmHj1HspqfKinlk16';
                console.log('Fetching metadata for invite code:', inviteCode);
                const res = await Object.values(sock).find(fn => fn && fn.name === 'newsletterMetadata')('invite', inviteCode);
                console.log('\n=========================================');
                console.log('✅ CHANNEL ID FOUND:');
                console.log(`Name: ${res.name}`);
                console.log(`ID:   ${res.id}`);
                console.log('=========================================\n');
            } catch (err) {
                console.error('Error fetching channel metadata:', err.message);
            }
            process.exit(0);
        }
    });

    sock.ev.on('creds.update', () => {});
}
run();
