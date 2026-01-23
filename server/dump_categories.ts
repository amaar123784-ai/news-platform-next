import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { articles: true }
                }
            }
        });
        console.log(JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
