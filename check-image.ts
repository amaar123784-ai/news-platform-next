
import fs from 'fs';
import path from 'path';

const imagePath = path.join(process.cwd(), 'public', 'images', 'placeholder.jpg');

if (fs.existsSync(imagePath)) {
    console.log('✅ Placeholder image exists at:', imagePath);
} else {
    console.log('❌ Placeholder image missing at:', imagePath);
    // Create a dummy file if missing just to stop 404s for now? No, better to copy the generated one.
}
