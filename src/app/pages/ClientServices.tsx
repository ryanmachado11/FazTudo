import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Star, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { apiGet, apiPost } from '../lib/api';
import { getCurrentUser } from '../lib/session';

type ServiceItem = {
  id: string;
  providerId: string | null;
  providerName: string;
  categoryName: string;
  status: string;
  description: string;
  hasReview: boolean;
};

function statusLabel(status: string) {
  switch (status) {
    case 'REQUESTED':
      return 'Solicitado';
    case 'ACCEPTED':
      return 'Aceito';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluido';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-900';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-700';
    case 'REQUESTED':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function ClientServices() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'CLIENT') {
      toast.error('Faça login como cliente para ver seus serviços.');
      navigate('/login?redirectTo=/servicos');
      return;
    }

    apiGet<ServiceItem[]>('/api/services')
      .then(setServices)
      .catch((error: any) => toast.error(error?.message || 'Não foi possível carregar seus serviços.'))
      .finally(() => setLoading(false));
  }, [currentUser?.id, currentUser?.role, navigate]);

  const submitReview = async (service: ServiceItem) => {
    if (!service.providerId) {
      toast.error('Este serviço não tem prestador vinculado.');
      return;
    }

    try {
      await apiPost('/api/reviews', {
        serviceRequestId: service.id,
        providerId: service.providerId,
        rating,
        comment: comment.trim(),
      });
      setServices((current) =>
        current.map((item) => (item.id === service.id ? { ...item, hasReview: true } : item)),
      );
      setReviewingId(null);
      setComment('');
      setRating(5);
      toast.success('Avaliação enviada com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível avaliar este serviço.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Meus serviços</h1>
          <p className="text-sm text-muted-foreground">Acompanhe contratações, converse e avalie trabalhos concluídos.</p>
        </div>

        {loading ? (
          <Card className="p-6 text-muted-foreground">Carregando serviços...</Card>
        ) : services.length === 0 ? (
          <Card className="p-6 text-muted-foreground">Você ainda não contratou nenhum serviço.</Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-secondary/20 text-secondary">
                        {service.providerName.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-lg">{service.providerName}</h2>
                      <p className="text-sm text-muted-foreground">{service.categoryName}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusTone(service.status)}>{statusLabel(service.status)}</Badge>
                    {service.providerId && (
                      <Link to={`/chat/servico/${service.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    )}
                    {service.status === 'COMPLETED' && !service.hasReview && (
                      <Button variant="secondary" size="sm" onClick={() => setReviewingId(service.id)}>
                        Avaliar
                      </Button>
                    )}
                    {service.hasReview && (
                      <Badge className="bg-green-100 text-green-700">Avaliado</Badge>
                    )}
                  </div>
                </div>

                {reviewingId === service.id && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className="border-0 bg-transparent p-1 text-secondary cursor-pointer"
                        >
                          <Star className={`h-5 w-5 ${value <= rating ? 'fill-secondary' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      maxLength={2000}
                      placeholder="Conte como foi o atendimento"
                      className="bg-input-background"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setReviewingId(null)}>
                        Cancelar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => submitReview(service)}>
                        Enviar avaliação
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
