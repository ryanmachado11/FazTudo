import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ChevronLeft, Send, Image as ImageIcon, Mic, FileText, CheckCheck, Wrench } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { getCurrentUser } from '../lib/session';
import { toast } from 'sonner';

type ChatContact = {
  id?: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER';
};

type ServiceChatContext = {
  serviceRequestId: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
};

function initials(name?: string) {
  return (name || 'Contato')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function formatTime(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { id, serviceRequestId } = useParams();
  const targetId = serviceRequestId || id;
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState<ChatContact | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceContext, setServiceContext] = useState<ServiceChatContext | null>(null);

  const resolveServiceContext = async (targetServiceRequestId: string) => {
    const services = await apiGet<any[]>('/api/services');
    const service = services.find((item) => item.id === targetServiceRequestId);

    if (!service || !service.clientId || !service.providerId) {
      throw new Error('Servico da conversa nao encontrado.');
    }

    const context = {
      serviceRequestId: service.id,
      clientId: service.clientId,
      clientName: service.clientName || 'Cliente',
      providerId: service.providerId,
      providerName: service.providerName || 'Prestador',
    };

    setServiceContext(context);
    return context;
  };

  const tryResolveServiceContext = async (targetServiceRequestId?: string) => {
    if (!targetServiceRequestId) return null;

    try {
      return await resolveServiceContext(targetServiceRequestId);
    } catch {
      return null;
    }
  };

  const openRoom = async (context?: ServiceChatContext) => {
    if (context) {
      try {
        return await apiPost<any>('/api/chat/rooms', { serviceRequestId: context.serviceRequestId });
      } catch (error: any) {
        const legacyPayload =
          currentUser?.role === 'CLIENT'
            ? { providerId: context.providerId }
            : { clientId: context.clientId };

        return apiPost<any>('/api/chat/rooms', legacyPayload);
      }
    }

    const roomPayload = currentUser?.role === 'CLIENT' ? { providerId: targetId } : { clientId: targetId };
    return apiPost<any>('/api/chat/rooms', roomPayload);
  };

  useEffect(() => {
    const loadConversation = async () => {
      if (!targetId) {
        setLoading(false);
        return;
      }

      const currentPath = `/chat/${targetId}`;

      if (!currentUser || (currentUser.role !== 'CLIENT' && currentUser.role !== 'PROVIDER')) {
        toast.error('Faca login para abrir suas mensagens.');
        navigate(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
        return;
      }

      try {
        const context = await tryResolveServiceContext(targetId);

        if (currentUser.role === 'CLIENT' && !context) {
          const providerData = await apiGet<any>(`/api/providers/${targetId}`);
          setContact({ id: providerData.id, name: providerData.name || 'Prestador', role: 'PROVIDER' });
        } else if (context) {
          setContact(
            currentUser.role === 'PROVIDER'
              ? { id: context.clientId, name: context.clientName, role: 'CLIENT' }
              : { id: context.providerId, name: context.providerName, role: 'PROVIDER' },
          );
        } else if (currentUser.role === 'PROVIDER') {
          setContact({ id: targetId, name: 'Cliente', role: 'CLIENT' });
        }

        const room = await openRoom(context || undefined);
        setRoomId(room.room.id);

        if (currentUser.role === 'PROVIDER') {
          setContact({
            id: room.room.clientId || targetId,
            name: room.room.clientName || 'Cliente',
            role: 'CLIENT',
          });
        } else {
          setContact({
            id: room.room.providerId || targetId,
            name: room.room.providerName || 'Prestador',
            role: 'PROVIDER',
          });
        }

        const roomMessages = await apiGet<any[]>(`/api/chat/rooms/${room.room.id}/messages`);
        setMessages(roomMessages);
      } catch (error: any) {
        setRoomId(null);
        toast.error(error?.message || 'Nao foi possivel abrir a conversa.');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [currentUser?.id, currentUser?.role, navigate, targetId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let isMounted = true;

    const refreshMessages = async () => {
      try {
        const roomMessages = await apiGet<any[]>(`/api/chat/rooms/${roomId}/messages`);
        if (isMounted) {
          setMessages(roomMessages);
        }
      } catch {
        // Polling stays quiet; explicit send/open actions surface errors to the user.
      }
    };

    const intervalId = window.setInterval(refreshMessages, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [roomId]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const activeRoomId = roomId;
      const fallbackContext = serviceContext || (await tryResolveServiceContext(targetId));
      const messagePayload: Record<string, string> = {
        content: message.trim(),
      };

      if (activeRoomId) {
        messagePayload.roomId = activeRoomId;
      }

      if (fallbackContext?.serviceRequestId) {
        messagePayload.serviceRequestId = fallbackContext.serviceRequestId;
      }

      if (currentUser?.role === 'CLIENT') {
        const providerId = fallbackContext?.providerId || targetId;
        if (providerId) {
          messagePayload.providerId = providerId;
        }
      }

      if (currentUser?.role === 'PROVIDER') {
        const clientId = fallbackContext?.clientId || targetId;
        if (clientId) {
          messagePayload.clientId = clientId;
        }
      }

      const created = await apiPost<any>('/api/chat/messages', messagePayload);
      if (created.room?.id) {
        setRoomId(created.room.id);
      }
      setMessages((prev) => [...prev, created.message]);
      setMessage('');
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel enviar a mensagem.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              to={currentUser?.role === 'PROVIDER' ? '/dashboard' : '/home'}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-secondary/20 text-secondary">
                {initials(contact?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {currentUser?.role === 'CLIENT' ? (
                <Link to={`/prestador/${contact?.id || targetId}`} className="hover:underline">
                  <h2 className="font-semibold text-foreground">{contact?.name || 'Prestador'}</h2>
                </Link>
              ) : (
                <h2 className="font-semibold text-foreground">{contact?.name || 'Cliente'}</h2>
              )}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Link to="/">
              <Wrench className="h-6 w-6 text-secondary" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && <p className="text-muted-foreground">Carregando conversa...</p>}

          <div className="flex items-center justify-center mb-6">
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Hoje
            </Badge>
          </div>

          <div className="space-y-4">
            {messages.map((msg: any) => {
              const isMine = msg.senderId === currentUser?.id;

              if (msg.messageType === 'PROPOSAL') {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-md">
                      <Card className="p-4 bg-secondary/5 border-secondary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-secondary" />
                          <p className="font-semibold text-foreground">Proposta de Servico</p>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Servico</p>
                            <p className="text-sm font-medium">{msg.content}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="flex-1">
                            Aceitar
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Recusar
                          </Button>
                        </div>
                      </Card>
                      <p className="text-xs text-muted-foreground mt-1 ml-2">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md ${isMine ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? 'bg-secondary text-secondary-foreground rounded-tr-sm'
                          : 'bg-card border border-border rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</p>
                      {isMine && (
                        <CheckCheck className={`h-4 w-4 ${msg.isRead ? 'text-success' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                className="pr-12 min-h-[44px] bg-input-background"
              />
              <Button variant="ghost" size="icon" className="absolute right-1 bottom-1" onClick={() => {}}>
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="flex-shrink-0 h-11 w-11"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
