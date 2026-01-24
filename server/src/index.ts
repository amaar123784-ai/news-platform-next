/**
 * Server Entry Point
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { PrismaClient } from '@prisma/client';
import { initializeScheduler } from './services/scheduler.js';

const prisma = new PrismaClient();

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        const app = createApp();

        const server = app.listen(Number(env.PORT), () => {
            console.log(`🚀 Server running on http://localhost:${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);

            // Initialize RSS scheduler after server starts
            initializeScheduler();
        });

        // Increase server timeout to 5 minutes for AI processing
        server.timeout = 300000;
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('👋 Server shutting down...');
    process.exit(0);
});

main();

export { prisma };
