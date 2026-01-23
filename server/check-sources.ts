
import { prisma } from './src/index.js';

async function checkSources() {
    const sources = await prisma.rSSSource.findMany();
    console.log('Checking sources for Logo URL issues...');

    let foundIssues = false;
    for (const source of sources) {
        if (source.logoUrl === source.feedUrl) {
            console.log(`⚠️  Source "${source.name}" has Logo URL same as Feed URL!`);
            console.log(`   Feed: ${source.feedUrl}`);
            foundIssues = true;
        } else if (source.logoUrl && !source.logoUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            console.log(`ℹ️  Source "${source.name}" has a Logo URL that doesn't look like an image (might be okay):`);
            console.log(`   Logo: ${source.logoUrl}`);
        }
    }

    if (!foundIssues) {
        console.log('✅ No obvious configuration issues found.');
    }
}

checkSources()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
