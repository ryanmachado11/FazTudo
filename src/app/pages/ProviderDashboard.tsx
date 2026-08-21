import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { apiGet, apiPatch } from '../lib/api';
import { getCurrentUser } from '../lib/session';
import { toast } from 'sonner';

type DashboardPayload = {
  verification: {
    status: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
  };
  setup: {
    profileReady: boolean;
    verificationReady: boolean;
  };
  provider: {
    verified: boolean;
    hourlyRate: number | null;
    averageRating: number;
    totalReviews: number;
    category: string;
  } | null;
  stats: {
    pendingRequests: number;
    activeServices: number;
    completedThisMonth: number;
    totalEarnings: string;
  };
  requests: Array<{
    id: string;
    clientId: string;
    clientName: string;
    description: string;
    status: string;
    scheduledFor: string | null;
  }>;
  reviews: Array<{
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
};

type ProviderProfilePayload = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  hourlyRate?: number | null;
  isUrgentAvailable?: boolean;
  isVerified?: boolean;
  category?: string;
};

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function formatActivityDate(value: string | null) {
  if (!value) return 'A combinar';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'REQUESTED':
      return 'Solicitado';
    case 'ACCEPTED':
      return 'Aceito';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluído';
    default:
      return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'REQUESTED':
      return 'bg-orange-100 text-orange-700';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-700';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-900';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function ProviderDashboard() {
  const currentUser = getCurrentUser();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [profile, setProfile] = useState<ProviderProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardData, profileData] = await Promise.all([
          apiGet<DashboardPayload>('/api/provider/dashboard'),
          apiGet<ProviderProfilePayload>('/api/provider/profile/me').catch(() => null),
        ]);

        setDashboard(dashboardData);
        setProfile(profileData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const providerName = profile?.name || currentUser?.name || 'Prestador';
  const providerCategory = profile?.category || dashboard?.provider?.category || 'Prestador';
  const averageRating = dashboard?.provider?.averageRating ?? 0;
  const totalReviews = dashboard?.provider?.totalReviews ?? 0;
  const providerVerified = dashboard?.provider?.verified ?? profile?.isVerified ?? false;
  const profileReady = dashboard?.setup?.profileReady ?? Boolean(profile);
  const needsOnboarding = !profileReady;
  const shouldShowSetupBanner = needsOnboarding;

  const requests = dashboard?.requests ?? [];
  const pendingRequests = requests.filter((request) => request.status === 'REQUESTED');
  const activeRequests = requests.filter(
    (request) => request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS',
  );
  const recentReviews = dashboard?.reviews ?? [];

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      await apiPatch(`/api/services/${requestId}/status`, { status });
      setDashboard((current) => {
        if (!current) return current;

        return {
          ...current,
          requests: current.requests.map((request) =>
            request.id === requestId ? { ...request, status } : request,
          ),
          stats: {
            ...current.stats,
            pendingRequests: current.requests.filter((request) =>
              request.id === requestId ? status === 'REQUESTED' : request.status === 'REQUESTED',
            ).length,
            activeServices: current.requests.filter((request) => {
              const requestStatus = request.id === requestId ? status : request.status;
              return requestStatus === 'ACCEPTED' || requestStatus === 'IN_PROGRESS';
            }).length,
            completedThisMonth:
              status === 'COMPLETED' ? current.stats.completedThisMonth + 1 : current.stats.completedThisMonth,
          },
        };
      });
      toast.success('Status do serviço atualizado.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o serviço.');
    }
  };

  const stats = useMemo(() => {
    if (!dashboard) {
      return {
        pending: 0,
        active: 0,
        completed: 0,
        earnings: 0,
      };
    }

    const totalEarnings = dashboard.stats.totalEarnings
      ? Number(dashboard.stats.totalEarnings.replace(/[^\d,.-]/g, '').replace(',', '.'))
      : 0;

    return {
      pending: dashboard.stats.pendingRequests,
      active: dashboard.stats.activeServices,
      completed: dashboard.stats.completedThisMonth,
      earnings: totalEarnings,
    };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 text-muted-foreground">
        Carregando painel do prestador...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Wrench className="h-7 w-7 text-secondary" />
              <span className="text-xl font-semibold text-foreground">FazTudo+</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/mensagens">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Mensagens
                </Button>
              </Link>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                  {providerName
                    .split(' ')
                    .map((part: string) => part[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-secondary/20 text-secondary text-xl font-bold">
                  {providerName
                    .split(' ')
                    .map((part: string) => part[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{providerName}</h1>
                  {providerVerified && (
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{providerCategory}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-secondary fill-secondary" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({totalReviews} avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {pendingRequests.length + activeRequests.length} solicitações no painel
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to={profileReady ? '/perfil/editar' : '/cadastro-prestador'}>
                <Button variant="outline">
                  {profileReady ? 'Editar perfil' : 'Completar cadastro'}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {shouldShowSetupBanner && (
          <Card className="mb-8 border-dashed border-secondary/30 bg-secondary/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-secondary" />
                  <h2 className="text-lg font-semibold text-foreground">Finalize seu cadastro de prestador</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete os dados do perfil para liberar seu painel e receber solicitações.
                </p>
              </div>

              <div className="flex gap-3">
                <Link to={profileReady ? '/perfil/editar' : '/cadastro-prestador'}>
                  <Button variant="secondary">
                    {profileReady ? 'Completar perfil' : 'Completar cadastro'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary/10 p-3 text-secondary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita total</p>
                <p className="text-2xl font-bold text-foreground">{currency(stats.earnings)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos pendentes</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-3 text-green-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="requests">
              Solicitações
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-secondary">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Em andamento</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                Nenhuma solicitação pendente no momento.
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {request.clientName
                            .split(' ')
                            .map((part: string) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{request.clientName}</h3>
                        <p className="text-muted-foreground">{request.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatActivityDate(request.scheduledFor)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusTone(request.status)}>
                        {statusLabel(request.status)}
                      </Badge>
                      {request.status === 'REQUESTED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'ACCEPTED')}
                        >
                          Aceitar
                        </Button>
                      )}
                      <Link to={`/chat/${request.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeRequests.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                Nenhum serviço em andamento neste momento.
              </Card>
            ) : (
              activeRequests.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {request.clientName
                            .split(' ')
                            .map((part: string) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{request.clientName}</h3>
                        <p className="text-muted-foreground">{request.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatActivityDate(request.scheduledFor)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusTone(request.status)}>
                        {statusLabel(request.status)}
                      </Badge>
                      {request.status === 'ACCEPTED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}
                        >
                          Iniciar
                        </Button>
                      )}
                      {(request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
                        >
                          Finalizar
                        </Button>
                      )}
                      <Link to={`/chat/${request.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {recentReviews.length === 0 ? (
              <Card className="p-6 text-muted-foreground">Ainda não há avaliações registradas.</Card>
            ) : (
              recentReviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {review.clientName
                          .split(' ')
                          .map((part: string) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{review.clientName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatActivityDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, index) => (
                            <Star key={index} className="h-4 w-4 fill-secondary text-secondary" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
