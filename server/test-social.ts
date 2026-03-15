import { PrismaClient } from '@prisma/client';
import { publishToSocialChannels } from './src/services/socialPublisher.service.js';

const prisma = new PrismaClient();

async function testSocial() {
    console.log('Fetching latest published article...');
    
    // Get the most recent published article
    const article = await prisma.article.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' }
    });

    if (!article) {
        console.error('No published articles found in the database to test with.');
        process.exit(1);
    }

    console.log(`\nFound article to test:`);
    console.log(`Title: ${article.title}`);
    console.log(`URL: https://voiceoftihama.com/article/${article.slug}`);
    console.log(`Image: ${article.imageUrl || 'None'}`);
    
    console.log('\n=========================================');
    console.log('🚀 DONT WORRY, THIS WILL POST TO REAL CHANNELS! 🚀');
    console.log('=========================================\n');
    console.log('Attempting to publish to social channels (Facebook & WhatsApp)...');

    try {
        const results = await publishToSocialChannels(article);
        
        console.log('\n✅ Publish Results:');
        results.forEach(result => {
            console.log(`- ${result.platform}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            if (result.error) {
                console.log(`  Error Details: ${result.error}`);
            }
        });
    } catch (error) {
        console.error('\n❌ Fatal Error during test:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

testSocial();
