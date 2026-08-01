import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Star, MapPin, Clock, ShieldCheck, MessageCircle, Wrench, ChevronLeft, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { apiGet, apiPost } from '../lib/api';
import { toast } from 'sonner';
import { getCurrentUser } from '../lib/session';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [description, setDescription] = useState('');
  const [bookingError, setBookingError] = useState('');
  const currentUser = getCurrentUser();

  const requireClientSession = () => {
    if (currentUser?.role === 'CLIENT') {
      return true;
    }

    if (currentUser?.role === 'PROVIDER') {
      toast.error('Entre com uma conta de cliente para contratar ou conversar com prestadores.');
      return false;
    }

    toast.error('Faça login para contratar ou conversar com este prestador.');
    navigate(`/login?redirectTo=${encodeURIComponent(`/prestador/${id}`)}`);
    return false;
  };

  const handleStartChat = () => {
    if (requireClientSession()) {
      navigate(`/chat/${provider.id}`);
    }
  };

  const resolveCategoryId = async () => {
    if (provider?.categoryId) {
      return provider.categoryId;
    }

    const categories = await apiGet<any[]>('/api/categories');
    const category = categories.find((entry) => entry.name === provider?.category);
    return category?.id ?? categories[0]?.id;
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchProvider = async () => {
      try {
        const result = await apiGet<any>(`/api/providers/${id}`);
        setProvider(result);
      } catch {
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">Carregando perfil do prestador...</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span>Voltar</span>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-secondary" />
                <span className="text-lg font-semibold text-foreground">FazTudo+</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="bg-secondary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <Wrench className="h-10 w-10 text-secondary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Prestador não encontrado</h1>
              <p className="text-muted-foreground">
                O profissional que você está procurando não existe ou foi removido da plataforma.
              </p>
            </div>
            <Link to="/home" className="inline-block">
              <Button variant="secondary">
                Voltar para a Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
              <span>Voltar</span>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-secondary" />
              <span className="text-lg font-semibold text-foreground">FazTudo+</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <Avatar className="h-28 w-28">
                <AvatarFallback className="bg-secondary/20 text-secondary text-2xl">
                  {provider.name?.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center sm:justify-start">
                  <h1 className="text-3xl font-bold text-foreground">{provider.name}</h1>
                  {provider.verified && (
                    <Badge className="bg-success/10 text-success border-success/20 w-fit mx-auto sm:mx-0">
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{provider.category}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                  <span className="font-bold text-lg">{provider.rating}</span>
                  <span className="text-muted-foreground">({provider.reviews} avaliações)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {provider.distance}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {provider.responseTime}
                </div>
              </div>

              {isBooking ? (
                <div className="space-y-3 w-full bg-muted/30 p-4 rounded-xl border border-border text-left">
                  <h4 className="text-sm font-semibold text-foreground">Descreva o serviço para contratação:</h4>
                  <textarea
                    className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Ex: Preciso instalar 3 tomadas na sala e reparar um disjuntor queimado."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setBookingError('');
                    }}
                  />
                  {bookingError && (
                    <p className="text-sm font-medium text-destructive">{bookingError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" disabled={isSubmittingBooking} onClick={async () => {
                      if (!description.trim()) {
                        const message = 'Por favor, descreva o serviço desejado.';
                        setBookingError(message);
                        toast.error(message);
                        return;
                      }

                      if (!requireClientSession()) {
                        return;
                      }
                      
                      try {
                        setIsSubmittingBooking(true);
                        setBookingError('');
                        const categoryId = await resolveCategoryId();
                        if (!categoryId) {
                          throw new Error('Categoria do prestador não encontrada.');
                        }

                        const payload = {
                          categoryId,
                          providerId: provider.id,
                          description: description.trim(),
                        };
                        
                        const createdService = await apiPost<any>('/api/services', payload);
                        await apiPost('/api/chat/rooms', { serviceRequestId: createdService.service.id });
                        toast.success('Solicitação de serviço enviada com sucesso!');
                        setIsBooking(false);
                        setDescription('');
                        
                        navigate(`/chat/${createdService.service.id}`);
                      } catch (error: any) {
                        const message = error?.message || 'Falha ao contratar.';
                        setBookingError(message);
                        toast.error(message);
                      } finally {
                        setIsSubmittingBooking(false);
                      }
                    }}>
                      {isSubmittingBooking ? 'Enviando...' : 'Confirmar Contratação'}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setIsBooking(false); setDescription(''); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Button size="lg" variant="secondary" className="w-full" onClick={handleStartChat}>
                      <MessageCircle className="h-5 w-5" />
                      Conversar
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (requireClientSession()) {
                        setIsBooking(true);
                      }
                    }}
                  >
                    Contratar Agora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sobre</h2>
              <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
            </Card>

            {/* Specialties */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Especializações</h2>
              <div className="flex flex-wrap gap-2">
                {(provider.specialties || []).map((spec: string, idx: number) => (
                  <Badge key={idx} className="bg-secondary/10 text-secondary border-secondary/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {spec}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Avaliações</h2>
              <div className="space-y-6">
                {provider.reviewsList.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {review.client.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.client}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                    {review.id !== provider.reviewsList[provider.reviewsList.length - 1].id && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Price */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Preço</h3>
              <p className="text-2xl font-bold text-foreground">{provider.price}</p>
              <p className="text-xs text-muted-foreground mt-1">Valor pode variar conforme o serviço</p>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serviços concluídos</p>
                    <p className="font-semibold">{provider.completedJobs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="font-semibold">{provider.memberSince}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de resposta</p>
                    <p className="font-semibold">{provider.responseRate}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Region */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Região de atendimento</h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{provider.serviceRegion}</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
