import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();
const categories = [
    { name: 'Elétrica', slug: 'eletrica', iconUrl: '/icons/eletrica.svg' },
    { name: 'Hidráulica', slug: 'hidraulica', iconUrl: '/icons/hidraulica.svg' },
    { name: 'Reforma e Acabamento', slug: 'reforma-acabamento', iconUrl: '/icons/reforma-acabamento.svg' },
    { name: 'Montagem e Instalação', slug: 'montagem-instalacao', iconUrl: '/icons/montagem-instalacao.svg' },
    { name: 'Estrutura e Reparos Gerais', slug: 'estrutura-reparos', iconUrl: '/icons/estrutura-reparos.svg' },
    { name: 'Área Externa', slug: 'area-externa', iconUrl: '/icons/area-externa.svg' },
    { name: 'Serviços Faz-Tudo', slug: 'servicos-faz-tudo', iconUrl: '/icons/servicos-faz-tudo.svg' },
    { name: 'Climatização e Refrigeração', slug: 'climatizacao-refrigeracao', iconUrl: '/icons/climatizacao-refrigeracao.svg' },
    { name: 'Segurança Residencial e CFTV', slug: 'seguranca-cftv', iconUrl: '/icons/seguranca-cftv.svg' },
    { name: 'Limpeza e Higienização', slug: 'limpeza-higienizacao', iconUrl: '/icons/limpeza-higienizacao.svg' },
    { name: 'Vidraçaria e Esquadrias', slug: 'vidracaria-esquadrias', iconUrl: '/icons/vidracaria-esquadrias.svg' },
    { name: 'Marcenaria e Carpintaria', slug: 'marcenaria-carpintaria', iconUrl: '/icons/marcenaria-carpintaria.svg' },
    { name: 'Eletrodomésticos e Linha Branca', slug: 'eletrodomesticos-linha-branca', iconUrl: '/icons/eletrodomesticos-linha-branca.svg' },
    { name: 'Gás e Aquecimento', slug: 'gas-aquecimento', iconUrl: '/icons/gas-aquecimento.svg' },
    { name: 'Tecnologia, Redes e Smart Home', slug: 'tecnologia-smart-home', iconUrl: '/icons/tecnologia-smart-home.svg' },
    { name: 'Pisos e Revestimentos', slug: 'pisos-revestimentos', iconUrl: '/icons/pisos-revestimentos.svg' },
    { name: 'Fretes e Mudanças Leves', slug: 'fretes-mudancas', iconUrl: '/icons/fretes-mudancas.svg' },
    { name: 'Redes de Proteção e Segurança Infantil', slug: 'redes-protecao', iconUrl: '/icons/redes-protecao.svg' },
    { name: 'Piscinas e Área de Lazer', slug: 'piscinas-lazer', iconUrl: '/icons/piscinas-lazer.svg' },
    { name: 'Serralharia e Estruturas Metálicas', slug: 'serralharia-estruturas', iconUrl: '/icons/serralharia-estruturas.svg' },
    { name: 'Controle de Pragas e Sanitização', slug: 'controle-pragas', iconUrl: '/icons/controle-pragas.svg' },
    { name: 'Organização e Decoração', slug: 'organizacao-decoracao', iconUrl: '/icons/organizacao-decoracao.svg' },
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
