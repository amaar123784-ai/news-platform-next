
import { PrismaClient } from '@prisma/client';
import { processScrapeQueue, scrapeArticle } from './src/services/scraper.service.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting manual scrape trigger...');

    // 1. Reset any failed scrapes to allow retry
    const resetCount = await prisma.rSSArticle.updateMany({
        where: {
            status: 'PENDING',
            contentScraped: false,
            scrapeError: { not: null } // Retry failed ones too
        },
        data: {
            scrapeError: null
        }
    });

    if (resetCount.count > 0) {
        console.log(`🔄 Reset ${resetCount.count} failed articles for retry.`);
    }

    // 2. Count pending articles
    const count = await prisma.rSSArticle.count({
        where: {
            status: 'PENDING',
            contentScraped: false,
            sourceUrl: { not: '' }
        }
    });

    console.log(`📦 Found ${count} pending articles to scrape.`);

    if (count === 0) {
        console.log('✅ No articles needing scraping.');
        return;
    }

    // 3. Process in batches
    // We'll process 50 articles max for this manual run to avoid timeout/bans
    const LIMIT = 50;
    console.log(`⚡ Processing batch of ${LIMIT} articles...`);

    // We call processScrapeQueue logic manually here for better logging
    const articles = await prisma.rSSArticle.findMany({
        where: {
            status: 'PENDING',
            contentScraped: false,
            scrapeError: null,
            sourceUrl: { not: '' },
        },
        orderBy: { fetchedAt: 'desc' },
        take: LIMIT,
        select: { id: true, title: true, sourceUrl: true },
    });

    let success = 0;
    let failed = 0;

    for (const [i, article] of articles.entries()) {
        console.log(`\n[${i + 1}/${articles.length}] Scraping: ${article.title.substring(0, 40)}...`);
        console.log(`   URL: ${article.sourceUrl}`);

        const result = await scrapeArticle(article.id);

        if (result.success) {
            console.log(`   ✅ Success! Content length: ${result.content?.length} chars`);
            success++;
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
            failed++;
        }

        // Small delay
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n==========================================');
    console.log(`🎉 Finished!`);
    console.log(`✅ Successful: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('==========================================');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
