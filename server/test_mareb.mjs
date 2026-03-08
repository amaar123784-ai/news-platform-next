import axios from 'axios';
import * as iconv from 'iconv-lite';

async function test() {
    const url = 'https://marebpress.net/news_rss.php?lang=arabic&top=3';
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const buffer = Buffer.from(response.data);
        console.log('--- HEADERS ---');
        console.log('Content-Type:', response.headers['content-type']);
        
        console.log('\n--- UTF8 DECODE ---');
        console.log(buffer.toString('utf8').substring(0, 300));
        
        console.log('\n--- WINDOWS-1256 DECODE ---');
        console.log(iconv.decode(buffer, 'windows-1256').substring(0, 300));
        
    } catch(e) {
        console.log('ERROR:', e.message);
    }
}
test();
