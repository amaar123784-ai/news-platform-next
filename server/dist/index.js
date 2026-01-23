"use strict";
/**
 * Server Entry Point
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        const app = (0, app_js_1.createApp)();
        app.listen(Number(env_js_1.env.PORT), () => {
            console.log(`🚀 Server running on http://localhost:${env_js_1.env.PORT}`);
            console.log(`📝 Environment: ${env_js_1.env.NODE_ENV}`);
        });
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map