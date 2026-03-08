import axios from 'axios';
import * as iconv from 'iconv-lite';

async function test() {
    const url = 'https://marebpress.net/rss.php';
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buf = Buffer.from(res.data);
    console.log('Content-Type:', res.headers['content-type']);
    
    const strRaw = buf.toString('utf8');
    const str1256 = iconv.decode(buf, 'windows-1256');
    
    console.log('RAW UTF8 (first 150 chars):', strRaw.substring(0, 150));
    console.log('DECODED 1256 (first 150 chars):', str1256.substring(0, 150));
}
test();
