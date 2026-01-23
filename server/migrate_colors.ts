import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colorMap: Record<string, string> = {
    '#DC2626': 'red',
    '#059669': 'green',
    '#2563EB': 'blue',
    '#7C3AED': 'purple',
    '#F59E0B': 'orange',
};

async function migrate() {
    try {
        const categories = await prisma.category.findMany();
        for (const cat of categories) {
            const newColor = colorMap[cat.color] || (cat.color.startsWith('#') ? 'blue' : cat.color);
            await prisma.category.update({
                where: { id: cat.id },
                data: { color: newColor }
            });
            console.log(`Updated ${cat.name}: ${cat.color} -> ${newColor}`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
