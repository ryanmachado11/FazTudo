import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, DollarSign, Star, Clock, CheckCircle2, AlertCircle, MessageCircle, Wrench, TrendingUp } from 'lucide-react';

export default function ProviderDashboard() {
  const provider = {
    name: 'Carlos Silva',
    category: 'Eletricista',
    rating: 4.9,
    reviews: 127,
  };

  const stats = {
    earnings: 'R$ 3.450,00',
    monthlyEarnings: 'R$ 12.800,00',
    pendingRequests: 5,
    activeServices: 3,
    completedThisMonth: 18,
  };

  const requests = [
    {
      id: 1,
      client: 'Maria Oliveira',
      service: 'Instalação de ventilador de teto',
      date: 'Hoje, 20/05',
      time: '14:00',
      price: 'R$ 120,00',
      status: 'pending',
    },
    {
      id: 2,
      client: 'João Pedro',
      service: 'Troca de tomadas (6 unidades)',
      date: 'Amanhã, 21/05',
      time: '09:00',
      price: 'R$ 180,00',
      status: 'pending',
    },
    {
      id: 3,
      client: 'Ana Santos',
      service: 'Instalação de chuveiro elétrico',
      date: '22/05/2026',
      time: '15:30',
      price: 'R$ 150,00',
      status: 'pending',
    },
  ];

  const activeServices = [
    {
      id: 1,
      client: 'Roberto Lima',
      service: 'Manutenção elétrica geral',
      date: 'Hoje',
      time: '10:00',
      status: 'in_progress',
    },
    {
      id: 2,
      client: 'Paula Costa',
      service: 'Instalação de lustre',
      date: 'Hoje',
      time: '16:00',
      status: 'scheduled',
    },
  ];

  const recentReviews = [
    {
      id: 1,
      client: 'Lucas Ferreira',
      rating: 5,
      date: '18/05/2026',
      comment: 'Excelente profissional! Muito competente.',
    },
    {
      id: 2,
      client: 'Carla Mendes',
      rating: 5,
      date: '15/05/2026',
      comment: 'Pontual e eficiente. Recomendo!',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Wrench className="h-7 w-7 text-secondary" />
              <span className="text-xl font-semibold text-foreground">FazTudo+</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Mensagens</span>
                <Badge className="ml-2 bg-secondary">3</Badge>
              </Button>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {provider.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Summary */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-secondary/20 text-secondary text-xl">
                {provider.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground mb-1">{provider.name}</h1>
              <p className="text-muted-foreground mb-3">{provider.category}</p>
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                  <span className="font-semibold">{provider.rating}</span>
                  <span className="text-muted-foreground text-sm">({provider.reviews})</span>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">
                  Verificado
                </Badge>
              </div>
            </div>
            <Link to="/perfil/editar">
              <Button variant="outline">Editar Perfil</Button>
            </Link>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganhos desta semana</p>
                <p className="text-2xl font-bold text-foreground">{stats.earnings}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total do mês</p>
                <p className="text-2xl font-bold text-foreground">{stats.monthlyEarnings}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos pendentes</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos este mês</p>
                <p className="text-2xl font-bold text-foreground">{stats.completedThisMonth}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="requests">
              Pedidos
              {stats.pendingRequests > 0 && (
                <Badge className="ml-2 bg-secondary">{stats.pendingRequests}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Em Andamento</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Novos Pedidos</h2>
            </div>
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      {request.client.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{request.client}</h3>
                      <p className="text-muted-foreground">{request.service}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{request.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{request.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-secondary" />
                        <span className="font-semibold text-secondary">{request.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button variant="secondary" className="flex-1 sm:flex-none">
                      Aceitar
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      Recusar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Active Services Tab */}
          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Serviços em Andamento</h2>
            </div>
            {activeServices.map((service) => (
              <Card key={service.id} className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      {service.client.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{service.client}</h3>
                        {service.status === 'in_progress' ? (
                          <Badge className="bg-secondary/10 text-secondary">Em andamento</Badge>
                        ) : (
                          <Badge className="bg-muted">Agendado</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{service.service}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{service.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{service.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Link to={`/chat/${service.id}`} className="flex-1 sm:flex-none">
                      <Button variant="outline" className="w-full">
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    </Link>
                    {service.status === 'in_progress' && (
                      <Button variant="success" className="flex-1 sm:flex-none">
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Avaliações Recentes</h2>
            </div>
            {recentReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      {review.client.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{review.client}</h3>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{review.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
