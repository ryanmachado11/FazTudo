export interface Review {
  id: number;
  client: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Professional {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  verified: boolean;
  distance: string;
  responseTime: string;
  price: string;
  specialties: string[];
  description: string;
  serviceRegion: string;
  memberSince: string;
  completedJobs: number;
  responseRate: string;
  reviewsList: Review[];
}

export const professionals: Professional[] = [
  {
    id: 1,
    name: 'Carlos Silva',
    category: 'Eletricista',
    rating: 4.9,
    reviews: 127,
    verified: true,
    distance: '2.3 km',
    responseTime: '~15 min',
    price: 'A partir de R$ 80',
    specialties: ['Instalação elétrica', 'Manutenção', 'Emergências', 'Automação residencial'],
    description: 'Profissional com mais de 10 anos de experiência em instalações elétricas residenciais e comerciais. Atendimento rápido, seguro e com preço justo.',
    serviceRegion: 'Zona Sul - São Paulo',
    memberSince: 'Março 2023',
    completedJobs: 245,
    responseRate: '98%',
    reviewsList: [
      {
        id: 1,
        client: 'Maria Oliveira',
        rating: 5,
        date: '15/05/2026',
        comment: 'Excelente profissional! Resolveu o problema da minha instalação elétrica rapidamente. Muito competente e educado.',
      },
      {
        id: 2,
        client: 'João Pedro',
        rating: 5,
        date: '10/05/2026',
        comment: 'Recomendo! Pontual, caprichoso e preço justo. Instalou tomadas e trocou disjuntores com muita eficiência.',
      },
      {
        id: 3,
        client: 'Ana Santos',
        rating: 4,
        date: '02/05/2026',
        comment: 'Bom atendimento. Resolveu o problema, mas demorou um pouco mais do que o esperado.',
      },
    ],
  },
  {
    id: 2,
    name: 'Roberto Santos',
    category: 'Encanador',
    rating: 4.8,
    reviews: 93,
    verified: true,
    distance: '1.8 km',
    responseTime: '~20 min',
    price: 'A partir de R$ 70',
    specialties: ['Vazamentos', 'Desentupimento', 'Instalações de louças', 'Limpeza de caixas d\'água'],
    description: 'Especialista em detecção de vazamentos e desentupimentos em geral. Equipamentos modernos e atendimento limpo para sua residência ou empresa.',
    serviceRegion: 'Zona Oeste - São Paulo',
    memberSince: 'Julho 2023',
    completedJobs: 180,
    responseRate: '95%',
    reviewsList: [
      {
        id: 1,
        client: 'Lucas Mendes',
        rating: 5,
        date: '12/06/2026',
        comment: 'Muito rápido no diagnóstico e resolveu o vazamento do banheiro sem quebra-quebra desnecessário. Excelente!',
      },
      {
        id: 2,
        client: 'Camila Lima',
        rating: 4,
        date: '28/05/2026',
        comment: 'Fez a limpeza da caixa d\'água de forma bem organizada. Preço justo e muito atencioso.',
      },
    ],
  },
  {
    id: 3,
    name: 'Paulo Costa',
    category: 'Montador',
    rating: 5.0,
    reviews: 84,
    verified: true,
    distance: '3.1 km',
    responseTime: '~30 min',
    price: 'A partir de R$ 60',
    specialties: ['Móveis planejados', 'Estantes', 'Guarda-roupas', 'Instalação de suportes de TV'],
    description: 'Montagem e desmontagem de móveis convencionais e planejados de todas as marcas. Trabalho detalhista para garantir a durabilidade dos seus móveis.',
    serviceRegion: 'Centro - São Paulo',
    memberSince: 'Novembro 2023',
    completedJobs: 140,
    responseRate: '100%',
    reviewsList: [
      {
        id: 1,
        client: 'Felipe Albuquerque',
        rating: 5,
        date: '03/06/2026',
        comment: 'Montou o guarda-roupa de casal perfeitamente. Alinhou todas as portas e gavetas. Trabalho impecável!',
      },
      {
        id: 2,
        client: 'Juliana Vieira',
        rating: 5,
        date: '20/05/2026',
        comment: 'Excelente montador. Muito cuidadoso e rápido. Instalou também o suporte da TV na parede.',
      },
    ],
  },
  {
    id: 4,
    name: 'Fernando Lima',
    category: 'Eletricista',
    rating: 4.7,
    reviews: 156,
    verified: true,
    distance: '4.2 km',
    responseTime: '~25 min',
    price: 'A partir de R$ 75',
    specialties: ['Automação residencial', 'Iluminação LED', 'Quadros elétricos', 'Manutenção preventiva'],
    description: 'Especializado em projetos de iluminação, instalação de lustres, fitas LED e sistemas de automação de ambientes (Alexa/Google Home).',
    serviceRegion: 'Zona Norte - São Paulo',
    memberSince: 'Janeiro 2024',
    completedJobs: 290,
    responseRate: '96%',
    reviewsList: [
      {
        id: 1,
        client: 'Rodrigo Rocha',
        rating: 5,
        date: '18/06/2026',
        comment: 'Automatizou a iluminação da minha sala. Ficou sensacional! Muito profissional e prestativo.',
      },
      {
        id: 2,
        client: 'Mariana Duarte',
        rating: 4,
        date: '11/06/2026',
        comment: 'Trocou toda a iluminação do meu apartamento para LED. Serviço limpo e bem executado.',
      },
    ],
  },
];
