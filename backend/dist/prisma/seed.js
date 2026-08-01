import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();
const categories = [
    { name: 'Eletricista', slug: 'eletricista', iconUrl: '/icons/eletricista.svg' },
    { name: 'Encanador', slug: 'encanador', iconUrl: '/icons/encanador.svg' },
    { name: 'Montador de Móveis', slug: 'montador-de-moveis', iconUrl: '/icons/montador.svg' },
];
async function main() {
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
    }
    const existing = await prisma.user.findUnique({ where: { email: 'admin@faztudo.com' } });
    if (!existing) {
        const passwordHash = await argon2.hash('Admin123!');
        await prisma.user.create({
            data: {
                name: 'Admin FazTudo',
                email: 'admin@faztudo.com',
                phone: '+5511999999999',
                passwordHash,
                role: 'ADMIN',
            },
        });
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
