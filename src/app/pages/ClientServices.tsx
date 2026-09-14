import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Star, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ApiError, apiGet, apiPatch, apiPost } from '../lib/api';
import { getCurrentUser } from '../lib/session';

type ServiceItem = {
  id: string;
  providerId: string | null;
  categoryId: string;
  providerName: string;
  categoryName: string;
  status: string;
  description: string;
  urgencyFlag: boolean;
  scheduledFor: string | null;
  hasReview: boolean;
};

type CategoryItem = { id: string; name: string };

function formatDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [cancellingServiceId, setCancellingServiceId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editScheduledFor, setEditScheduledFor] = useState('');
  const [editUrgencyFlag, setEditUrgencyFlag] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'CLIENT') {
      toast.error('Faça login como cliente para ver seus serviços.');
      navigate('/login?redirectTo=/servicos', { replace: true });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setLoadError('');

    apiGet<ServiceItem[]>('/api/services')
      .then((data) => {
        if (isMounted) setServices(data);
      })
      .catch((error: any) => {
        if (isMounted) setLoadError(error?.message || 'Não foi possível carregar seus serviços.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?.role, navigate, retryKey]);

  const submitReview = async (service: ServiceItem) => {
    if (isSubmittingReview) return;
    if (!service.providerId) {
      toast.error('Este serviço não tem prestador vinculado.');
      return;
    }

    try {
      setIsSubmittingReview(true);
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
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const cancelService = async (service: ServiceItem) => {
    if (cancellingServiceId || isSavingEdit || !window.confirm('Deseja cancelar este serviço?')) return;

    try {
      setCancellingServiceId(service.id);
      await apiPatch(`/api/services/${service.id}/status`, { status: 'CANCELLED' });
      setServices((current) =>
        current.map((item) => (item.id === service.id ? { ...item, status: 'CANCELLED' } : item)),
      );
      setEditingId((current) => current === service.id ? null : current);
      toast.success('Serviço cancelado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível cancelar o serviço.');
      if (error instanceof ApiError && error.status === 409) setRetryKey((current) => current + 1);
    } finally {
      setCancellingServiceId(null);
    }
  };

  const startEditing = async (service: ServiceItem) => {
    setEditingId(service.id);
    setEditDescription(service.description);
    setEditCategoryId(service.categoryId);
    setEditScheduledFor(formatDateTimeLocal(service.scheduledFor));
    setEditUrgencyFlag(service.urgencyFlag);

    if (categories.length > 0 || isLoadingCategories) return;
    try {
      setIsLoadingCategories(true);
      setCategories(await apiGet<CategoryItem[]>('/api/categories'));
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível carregar as categorias.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const saveEdit = async (service: ServiceItem) => {
    if (isSavingEdit || cancellingServiceId || service.status !== 'REQUESTED') return;
    if (editDescription.trim().length < 10) {
      toast.error('A descrição deve ter pelo menos 10 caracteres.');
      return;
    }
    if (!editCategoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    try {
      setIsSavingEdit(true);
      const updated = await apiPatch<{ service: { description: string; categoryId: string; urgencyFlag: boolean; scheduledFor: string | null } }>(
        `/api/services/${service.id}`,
        {
          categoryId: editCategoryId,
          description: editDescription.trim(),
          urgencyFlag: editUrgencyFlag,
          scheduledFor: editScheduledFor ? new Date(editScheduledFor).toISOString() : null,
        },
      );
      const categoryName = categories.find((category) => category.id === editCategoryId)?.name || service.categoryName;
      setServices((current) => current.map((item) => item.id === service.id
        ? { ...item, ...updated.service, categoryName }
        : item));
      setEditingId(null);
      toast.success('Serviço atualizado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o serviço.');
      if (error instanceof ApiError && error.status === 409) setRetryKey((current) => current + 1);
    } finally {
      setIsSavingEdit(false);
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
        ) : loadError ? (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar seus serviços</h2>
            <p className="mt-2 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            <Button className="mt-4" variant="secondary" onClick={() => setRetryKey((current) => current + 1)}>
              Tentar novamente
            </Button>
          </Card>
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
                    {['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(service.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Boolean(cancellingServiceId) || isSavingEdit}
                        onClick={() => cancelService(service)}
                      >
                        {cancellingServiceId === service.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    )}
                    {service.status === 'REQUESTED' && (
                      <Button variant="outline" size="sm" onClick={() => startEditing(service)} disabled={isSavingEdit || Boolean(cancellingServiceId)}>
                        Editar
                      </Button>
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

                {editingId === service.id && service.status === 'REQUESTED' && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    <Textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      minLength={10}
                      maxLength={5000}
                      placeholder="Descreva o serviço"
                      className="bg-input-background"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={editCategoryId}
                        onChange={(event) => setEditCategoryId(event.target.value)}
                        disabled={isLoadingCategories || isSavingEdit}
                        className="h-10 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground"
                      >
                        {categories.length === 0 && <option value={editCategoryId}>{service.categoryName}</option>}
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                      </select>
                      <input
                        type="datetime-local"
                        value={editScheduledFor}
                        onChange={(event) => setEditScheduledFor(event.target.value)}
                        disabled={isSavingEdit}
                        className="h-10 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={editUrgencyFlag}
                        onChange={(event) => setEditUrgencyFlag(event.target.checked)}
                        disabled={isSavingEdit}
                      />
                      Atendimento urgente
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={isSavingEdit}>
                        Fechar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => saveEdit(service)} disabled={isSavingEdit || isLoadingCategories || Boolean(cancellingServiceId)}>
                        {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                    </div>
                  </div>
                )}

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
                      <Button variant="secondary" size="sm" disabled={isSubmittingReview} onClick={() => submitReview(service)}>
                        {isSubmittingReview ? 'Enviando...' : 'Enviar avaliação'}
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
