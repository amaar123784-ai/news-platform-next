const fs = require('fs');
const path = require('path');

const envPath = path.join('/var/www/voiceoftihama/server', '.env');
const newToken = 'EAAR25uf4NCYBQ8k6ZBHZCKJJHLz2SIjez6cOunPuWmbFHRSseUGJB1Loyr3h9tlUZCh5wDG1pywXZCNtJzizyZAwSndDEyxc0vN63YKBkFsiKrStu0NvAH6pZBIcqa79imZBTiZB8LakPVo0BpRCXfm08p35kByX9TihV2aVZA3hQhiRgf0xsqMHjWZC48XCYWndfHE309ooo5';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if the token line exists
    if (envContent.includes('FACEBOOK_PAGE_TOKEN=')) {
        // Replace existing token, handling potential multiline or weird formatting
        envContent = envContent.replace(/FACEBOOK_PAGE_TOKEN=.*(\r?\n|$)/g, `FACEBOOK_PAGE_TOKEN="${newToken}"$1`);
        console.log('✅ Replaced existing FACEBOOK_PAGE_TOKEN');
    } else {
        // Append if it doesn't exist
        envContent += `\nFACEBOOK_PAGE_TOKEN="${newToken}"\n`;
        console.log('✅ Added FACEBOOK_PAGE_TOKEN to the end of the file');
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Successfully updated .env file!');
    console.log('Now run: pm2 restart api');

} catch (err) {
    console.error('❌ Error updating .env file:', err.message);
}
