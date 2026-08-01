import { prisma } from '../config/prisma.js';
export async function categoriesRoutes(app) {
    app.get('/', async () => {
        const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            iconUrl: category.iconUrl,
        }));
    });
}
