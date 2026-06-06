/**
 * Server Entry Point
 */
import { PrismaClient } from '@prisma/client';
import './services/whatsapp.service.js';
declare const prisma: PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
//# sourceMappingURL=index.d.ts.map