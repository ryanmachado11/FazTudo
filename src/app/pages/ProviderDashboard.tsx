import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock3,
  MessageCircle,
  LogOut,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ApiError, apiGet, apiPatch } from '../lib/api';
import { clearSession, getCurrentUser } from '../lib/session';
import { toast } from 'sonner';

type DashboardPayload = {
  setup: {
    profileReady: boolean;
  };
  provider: {
    avatarUrl?: string | null;
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
  avatarUrl?: string | null;
  bio?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  hourlyRate?: number | null;
  isUrgentAvailable?: boolean;
  category?: string;
};

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
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [profile, setProfile] = useState<ProviderProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [dashboardData, profileData] = await Promise.all([
          apiGet<DashboardPayload>('/api/provider/dashboard'),
          apiGet<ProviderProfilePayload>('/api/provider/profile/me').catch((error) => {
            if (error instanceof ApiError && error.status === 404) return null;
            throw error;
          }),
        ]);

        setDashboard(dashboardData);
        setProfile(profileData);
      } catch (error) {
        console.error(error);
        setLoadError('Não foi possível carregar o painel do prestador.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [retryKey]);

  const providerName = profile?.name || currentUser?.name || 'Prestador';
  const providerAvatarUrl = profile?.avatarUrl || dashboard?.provider?.avatarUrl || currentUser?.avatarUrl;
  const providerCategory = profile?.category || dashboard?.provider?.category || 'Prestador';
  const averageRating = dashboard?.provider?.averageRating ?? 0;
  const totalReviews = dashboard?.provider?.totalReviews ?? 0;
  const profileReady = dashboard?.setup?.profileReady ?? Boolean(profile);
  const needsOnboarding = !profileReady;
  const shouldShowSetupBanner = needsOnboarding;

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const requests = dashboard?.requests ?? [];
  const pendingRequests = requests.filter((request) => request.status === 'REQUESTED');
  const activeRequests = requests.filter(
    (request) => request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS' || request.status === 'COMPLETED',
  );
  const recentReviews = dashboard?.reviews ?? [];

  const updateRequestStatus = async (requestId: string, status: string) => {
    if (updatingRequestId) return;
    if (status === 'CANCELLED' && !window.confirm('Deseja cancelar este serviço?')) return;

    try {
      setUpdatingRequestId(requestId);
      await apiPatch(`/api/services/${requestId}/status`, { status });
      setDashboard((current) => {
        if (!current) return current;

        const nextRequests = status === 'CANCELLED'
          ? current.requests.filter((request) => request.id !== requestId)
          : current.requests.map((request) =>
              request.id === requestId ? { ...request, status } : request,
            );

        return {
          ...current,
          requests: nextRequests,
          stats: {
            ...current.stats,
            pendingRequests: nextRequests.filter((request) => request.status === 'REQUESTED').length,
            activeServices: nextRequests.filter((request) =>
              request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS',
            ).length,
            completedThisMonth:
              status === 'COMPLETED' ? current.stats.completedThisMonth + 1 : current.stats.completedThisMonth,
          },
        };
      });
      toast.success('Status do serviço atualizado.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o serviço.');
      if (error instanceof ApiError && error.status === 409) setRetryKey((current) => current + 1);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const stats = useMemo(() => {
    if (!dashboard) {
      return {
        pending: 0,
        active: 0,
        completed: 0,
      };
    }

    return {
      pending: dashboard.stats.pendingRequests,
      active: dashboard.stats.activeServices,
      completed: dashboard.stats.completedThisMonth,
    };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 text-muted-foreground">
        Carregando painel do prestador...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Não foi possível carregar o painel</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
          <Button className="mt-6" variant="secondary" onClick={() => setRetryKey((current) => current + 1)}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/home" className="flex items-center gap-2">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
              <Link to="/perfil/editar" aria-label="Abrir meu perfil">
                <Avatar className="h-9 w-9 border border-border">
                  {providerAvatarUrl && <AvatarImage src={providerAvatarUrl} alt={`Foto de ${providerName}`} />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                    {providerName
                      .split(' ')
                      .map((part: string) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/perfil/editar" aria-label="Abrir meu perfil">
                <Avatar className="h-20 w-20">
                  {providerAvatarUrl && <AvatarImage src={providerAvatarUrl} alt={`Foto de ${providerName}`} />}
                  <AvatarFallback className="bg-secondary/20 text-secondary text-xl font-bold">
                    {providerName
                      .split(' ')
                      .map((part: string) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{providerName}</h1>
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
                    {pendingRequests.length} solicitações no painel
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/perfil/editar">
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
                <Link to="/perfil/editar">
                  <Button variant="secondary">
                    {profileReady ? 'Completar perfil' : 'Completar cadastro'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <TabsTrigger value="active">Serviços aceitos e concluídos</TabsTrigger>
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
                          disabled={Boolean(updatingRequestId)}
                          onClick={() => updateRequestStatus(request.id, 'ACCEPTED')}
                        >
                          {updatingRequestId === request.id ? 'Salvando...' : 'Aceitar'}
                        </Button>
                      )}
                      {['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(request.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={Boolean(updatingRequestId)}
                          onClick={() => updateRequestStatus(request.id, 'CANCELLED')}
                        >
                          {updatingRequestId === request.id ? 'Salvando...' : 'Cancelar'}
                        </Button>
                      )}
                      <Link to={`/chat/servico/${request.id}`}>
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
                Nenhum serviço aceito, em andamento ou concluído neste momento.
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
                          disabled={Boolean(updatingRequestId)}
                          onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}
                        >
                          {updatingRequestId === request.id ? 'Salvando...' : 'Iniciar'}
                        </Button>
                      )}
                      {(request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={Boolean(updatingRequestId)}
                          onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
                        >
                          {updatingRequestId === request.id ? 'Salvando...' : 'Finalizar'}
                        </Button>
                      )}
                      {['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(request.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={Boolean(updatingRequestId)}
                          onClick={() => updateRequestStatus(request.id, 'CANCELLED')}
                        >
                          {updatingRequestId === request.id ? 'Salvando...' : 'Cancelar'}
                        </Button>
                      )}
                      <Link to={`/chat/servico/${request.id}`}>
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
