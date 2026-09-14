import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { seedPassword } from '../src/lib/seed-password.js';

const prisma = new PrismaClient();

const categoriesData = [
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
  console.log('Seeding categories...');
  const legacyCategories = [
    { oldSlug: 'eletricista', name: 'Elétrica', slug: 'eletrica', iconUrl: '/icons/eletrica.svg' },
    { oldSlug: 'encanador', name: 'Hidráulica', slug: 'hidraulica', iconUrl: '/icons/hidraulica.svg' },
    { oldSlug: 'montador-de-moveis', name: 'Montagem e Instalação', slug: 'montagem-instalacao', iconUrl: '/icons/montagem-instalacao.svg' },
    { oldSlug: 'chaveiro', name: 'Estrutura e Reparos Gerais', slug: 'estrutura-reparos', iconUrl: '/icons/estrutura-reparos.svg' },
  ];
  for (const category of legacyCategories) {
    const legacy = await prisma.category.findUnique({ where: { slug: category.oldSlug } });
    const canonical = await prisma.category.findUnique({ where: { slug: category.slug } });
    if (legacy && !canonical) {
      await prisma.category.update({
        where: { id: legacy.id },
        data: { name: category.name, slug: category.slug, iconUrl: category.iconUrl },
      });
    }
  }

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }

  for (const legacySlug of ['eletricista', 'encanador', 'montador-de-moveis', 'chaveiro']) {
    const legacy = await prisma.category.findUnique({ where: { slug: legacySlug } });
    if (!legacy) continue;
    const targetSlug = legacySlug === 'eletricista'
      ? 'eletrica'
      : legacySlug === 'encanador'
        ? 'hidraulica'
        : legacySlug === 'montador-de-moveis'
          ? 'montagem-instalacao'
          : 'estrutura-reparos';
    const canonicalId = categoryMap[targetSlug];
    if (!canonicalId) continue;
    const links = await prisma.providerCategory.findMany({ where: { categoryId: legacy.id } });
    for (const link of links) {
      await prisma.providerCategory.upsert({
        where: { providerProfileId_categoryId: { providerProfileId: link.providerProfileId, categoryId: canonicalId } },
        update: {},
        create: { providerProfileId: link.providerProfileId, categoryId: canonicalId },
      });
    }
    await prisma.providerCategory.deleteMany({ where: { categoryId: legacy.id } });
    await prisma.serviceRequest.updateMany({ where: { categoryId: legacy.id }, data: { categoryId: canonicalId } });
    await prisma.category.update({ where: { id: legacy.id }, data: { isActive: false } });
  }

  const commonPasswordHash = await argon2.hash(seedPassword());

  // Create clients for reviews
  console.log('Seeding client users...');
  const clientsData = [
    { name: 'Maria Oliveira', email: 'maria@example.com', phone: '+5511988880001' },
    { name: 'João Pedro', email: 'joao@example.com', phone: '+5511988880002' },
    { name: 'Ana Santos', email: 'ana@example.com', phone: '+5511988880003' },
    { name: 'Lucas Mendes', email: 'lucas@example.com', phone: '+5511988880004' },
    { name: 'Camila Lima', email: 'camila@example.com', phone: '+5511988880005' },
    { name: 'Felipe Albuquerque', email: 'felipe@example.com', phone: '+5511988880006' },
    { name: 'Juliana Vieira', email: 'juliana@example.com', phone: '+5511988880007' },
    { name: 'Rodrigo Rocha', email: 'rodrigo@example.com', phone: '+5511988880008' },
    { name: 'Mariana Duarte', email: 'mariana@example.com', phone: '+5511988880009' },
  ];

  const clientMap: Record<string, string> = {};
  for (const client of clientsData) {
    const existing = await prisma.user.findUnique({ where: { email: client.email } });
    if (existing) {
      clientMap[client.name] = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          passwordHash: commonPasswordHash,
          role: 'CLIENT',
        },
      });
      clientMap[client.name] = created.id;
    }
  }

  // Create providers
  console.log('Seeding providers...');
  const providersData = [
    {
      name: 'Carlos Silva',
      email: 'carlos@example.com',
      phone: '+5511977770001',
      categorySlug: 'eletrica',
      bio: 'Profissional com mais de 10 anos de experiência em instalações elétricas residenciais e comerciais. Atendimento rápido, seguro e com preço justo.',
      hourlyRate: 80.0,
      averageRating: 4.9,
      totalReviews: 3,
      isUrgentAvailable: true,
      specialties: ['Instalação elétrica', 'Manutenção', 'Emergências', 'Automação residencial'],
      reviews: [
        { clientName: 'Maria Oliveira', rating: 5, comment: 'Excelente profissional! Resolveu o problema da minha instalação elétrica rapidamente. Muito competente e educado.' },
        { clientName: 'João Pedro', rating: 5, comment: 'Recomendo! Pontual, caprichoso e preço justo. Instalou tomadas e trocou disjuntores com muita eficiência.' },
        { clientName: 'Ana Santos', rating: 4, comment: 'Bom atendimento. Resolveu o problema, mas demorou um pouco mais do que o esperado.' },
      ],
    },
    {
      name: 'Roberto Santos',
      email: 'roberto@example.com',
      phone: '+5511977770002',
      categorySlug: 'hidraulica',
      bio: 'Especialista em detecção de vazamentos e desentupimentos em geral. Equipamentos modernos e atendimento limpo para sua residência ou empresa.',
      hourlyRate: 70.0,
      averageRating: 4.8,
      totalReviews: 2,
      isUrgentAvailable: true,
      specialties: ['Vazamentos', 'Desentupimento', 'Instalações de louças', 'Limpeza de caixas d\'água'],
      reviews: [
        { clientName: 'Lucas Mendes', rating: 5, comment: 'Muito rápido no diagnóstico e resolveu o vazamento do banheiro sem quebra-quebra desnecessário. Excelente!' },
        { clientName: 'Camila Lima', rating: 4, comment: 'Fez a limpeza da caixa d\'água de forma bem organizada. Preço justo e muito atencioso.' },
      ],
    },
    {
      name: 'Paulo Costa',
      email: 'paulo@example.com',
      phone: '+5511977770003',
      categorySlug: 'montagem-instalacao',
      bio: 'Montagem e desmontagem de móveis convencionais e planejados de todas as marcas. Trabalho detalhista para garantir a durabilidade dos seus móveis.',
      hourlyRate: 60.0,
      averageRating: 5.0,
      totalReviews: 2,
      isUrgentAvailable: false,
      specialties: ['Móveis planejados', 'Estantes', 'Guarda-roupas', 'Instalação de suportes de TV'],
      reviews: [
        { clientName: 'Felipe Albuquerque', rating: 5, comment: 'Montou o guarda-roupa de casal perfeitamente. Alinhou todas as portas e gavetas. Trabalho impecável!' },
        { clientName: 'Juliana Vieira', rating: 5, comment: 'Excelente montador. Muito cuidadoso e rápido. Instalou também o suporte da TV na parede.' },
      ],
    },
    {
      name: 'Fernando Lima',
      email: 'fernando@example.com',
      phone: '+5511977770004',
      categorySlug: 'eletrica',
      bio: 'Especializado em projetos de iluminação, instalação de lustres, fitas LED e sistemas de automação de ambientes (Alexa/Google Home).',
      hourlyRate: 75.0,
      averageRating: 4.7,
      totalReviews: 2,
      isUrgentAvailable: true,
      specialties: ['Automação residencial', 'Iluminação LED', 'Quadros elétricos', 'Manutenção preventiva'],
      reviews: [
        { clientName: 'Rodrigo Rocha', rating: 5, comment: 'Automatizou a iluminação da minha sala. Ficou sensacional! Muito profissional e prestativo.' },
        { clientName: 'Mariana Duarte', rating: 4, comment: 'Trocou toda a iluminação do meu apartamento para LED. Serviço limpo e bem executado.' },
      ],
    },
  ];

  for (const prov of providersData) {
    const existing = await prisma.user.findUnique({ where: { email: prov.email } });
    let userId = '';

    if (existing) {
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          name: prov.name,
          email: prov.email,
          phone: prov.phone,
          passwordHash: commonPasswordHash,
          role: 'PROVIDER',
        },
      });
      userId = created.id;
    }

    const profile = await prisma.providerProfile.upsert({
      where: { userId },
      update: {
        bio: prov.bio,
        specialties: prov.specialties,
        hourlyRate: prov.hourlyRate,
        averageRating: prov.averageRating,
        totalReviews: prov.totalReviews,
        isUrgentAvailable: prov.isUrgentAvailable,
        isVerified: true,
        city: 'São Paulo',
        state: 'SP',
      },
      create: {
        userId,
        bio: prov.bio,
        specialties: prov.specialties,
        hourlyRate: prov.hourlyRate,
        averageRating: prov.averageRating,
        totalReviews: prov.totalReviews,
        isUrgentAvailable: prov.isUrgentAvailable,
        isVerified: true,
        city: 'São Paulo',
        state: 'SP',
      },
    });

    // Link category
    const catId = categoryMap[prov.categorySlug];
    if (catId) {
      await prisma.providerCategory.upsert({
        where: {
          providerProfileId_categoryId: {
            providerProfileId: profile.id,
            categoryId: catId,
          },
        },
        update: {},
        create: {
          providerProfileId: profile.id,
          categoryId: catId,
        },
      });
    }

    // Seed reviews
    for (const rev of prov.reviews) {
      const clientId = clientMap[rev.clientName];
      if (!clientId) continue;

      // Find or create a completed mock service request to connect to the review
      let serviceReq = await prisma.serviceRequest.findFirst({
        where: { clientId, providerId: userId },
      });

      if (!serviceReq) {
        serviceReq = await prisma.serviceRequest.create({
          data: {
            clientId,
            providerId: userId,
            categoryId: catId,
            status: 'COMPLETED',
            description: 'Serviço de teste completado e avaliado.',
          },
        });
      }

      await prisma.review.upsert({
        where: { id: `mock-review-${userId}-${clientId}` },
        update: {
          rating: rev.rating,
          comment: rev.comment,
          status: 'APPROVED',
        },
        create: {
          id: `mock-review-${userId}-${clientId}`,
          serviceRequestId: serviceReq.id,
          clientId,
          providerId: userId,
          rating: rev.rating,
          comment: rev.comment,
          status: 'APPROVED',
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

