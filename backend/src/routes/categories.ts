import { FastifyInstance } from 'fastify';
import { prisma } from '../config/prisma.js';

export async function categoriesRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return categories.map((category: { id: string; name: string; slug: string; iconUrl: string | null }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl,
    }));
  });
}
