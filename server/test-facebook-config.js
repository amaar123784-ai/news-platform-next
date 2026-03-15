require('dotenv').config();

const facebookEnable = process.env.FACEBOOK_ENABLE;
const pageId = process.env.FACEBOOK_PAGE_ID;
const pageToken = process.env.FACEBOOK_PAGE_TOKEN;

console.log('--- Facebook Configuration Check ---');
console.log(`FACEBOOK_ENABLE: ${facebookEnable}`);
console.log(`FACEBOOK_PAGE_ID: ${pageId ? 'Set (Hidden length: ' + pageId.length + ')' : 'Not Set'}`);
console.log(`FACEBOOK_PAGE_TOKEN: ${pageToken ? 'Set (Hidden length: ' + pageToken.length + ')' : 'Not Set'}`);

// Also check if there's any weird whitespace
if (pageId && pageId !== pageId.trim()) {
    console.log('WARNING: FACEBOOK_PAGE_ID has leading or trailing whitespace!');
}
if (pageToken && pageToken !== pageToken.trim()) {
    console.log('WARNING: FACEBOOK_PAGE_TOKEN has leading or trailing whitespace!');
}

if (!facebookEnable || facebookEnable !== 'true') {
    console.log('ERROR: FACEBOOK_ENABLE is not true');
}

if (!pageId || !pageToken) {
    console.log('ERROR: Missing credentials');
} else {
    console.log('Credentials appear to be present in .env');
}
