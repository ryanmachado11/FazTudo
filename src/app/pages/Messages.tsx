import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { apiGet } from '../lib/api';
import { getCurrentUser } from '../lib/session';

type ChatRoomItem = {
  id: string;
  serviceRequestId?: string | null;
  clientId?: string;
  clientName?: string;
  providerId?: string;
  providerName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

function initials(name?: string) {
  return (name || 'Contato')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function formatDate(value?: string) {
  if (!value) return 'Agora';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Messages() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'CLIENT' && currentUser.role !== 'PROVIDER')) {
      toast.error('Faça login para acessar suas mensagens.');
      navigate('/login?redirectTo=/mensagens', { replace: true });
      return;
    }

    let isMounted = true;
    let timeoutId: number | undefined;
    let hasReportedError = false;
    setLoading(true);
    setLoadError('');

    const loadRooms = async () => {
      try {
        const data = await apiGet<ChatRoomItem[]>('/api/chat/rooms');
        if (isMounted) {
          setRooms(data);
          setLoadError('');
          hasReportedError = false;
        }
      } catch (error: any) {
        if (isMounted) setLoadError(error?.message || 'Não foi possível carregar suas mensagens.');
        if (!hasReportedError) {
          toast.error(error?.message || 'Não foi possível carregar suas mensagens.');
          hasReportedError = true;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          timeoutId = window.setTimeout(loadRooms, 5000);
        }
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [currentUser?.id, currentUser?.role, navigate, retryKey]);

  const backPath = currentUser?.role === 'PROVIDER' ? '/dashboard' : '/home';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={backPath} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
          <p className="text-sm text-muted-foreground">Conversas ligadas aos serviços contratados.</p>
        </div>

        {loading ? (
          <Card className="p-6 text-muted-foreground">Carregando conversas...</Card>
        ) : loadError ? (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar suas mensagens</h2>
            <p className="mt-2 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            <Button className="mt-4" variant="secondary" onClick={() => setRetryKey((current) => current + 1)}>
              Tentar novamente
            </Button>
          </Card>
        ) : rooms.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Nenhuma conversa ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As mensagens aparecem aqui assim que um cliente contratar um prestador e abrir o chat.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const otherName =
                currentUser?.role === 'PROVIDER'
                  ? room.clientName || 'Cliente'
                  : room.providerName || 'Prestador';
              const chatPath = `/chat/room/${room.id}`;

              return (
                <Card key={room.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-secondary/20 text-secondary">
                          {initials(otherName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-foreground">{otherName}</h2>
                        <p className="text-sm text-muted-foreground">
                          {room.lastMessage || 'Conversa aberta'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(room.lastMessageAt)}</p>
                      </div>
                      {!!room.unreadCount && (
                        <span className="min-w-5 rounded-full bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold text-secondary-foreground">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    {chatPath ? (
                      <Link to={chatPath}>
                        <Button variant="secondary">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" disabled title="Conversa sem participante vinculado">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
