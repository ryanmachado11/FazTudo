import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ChevronLeft, Send, Image as ImageIcon, Mic, FileText, CheckCheck, Wrench } from 'lucide-react';

export default function Chat() {
  const { id } = useParams();
  const [message, setMessage] = useState('');

  const provider = {
    name: 'Carlos Silva',
    category: 'Eletricista',
    online: true,
  };

  const messages = [
    {
      id: 1,
      sender: 'provider',
      content: 'Olá! Vi que você precisa de um eletricista. Em que posso ajudar?',
      time: '14:23',
      read: true,
    },
    {
      id: 2,
      sender: 'client',
      content: 'Oi! Preciso trocar algumas tomadas e instalar um ventilador de teto.',
      time: '14:25',
      read: true,
    },
    {
      id: 3,
      sender: 'provider',
      content: 'Entendi! Quantas tomadas precisa trocar?',
      time: '14:26',
      read: true,
    },
    {
      id: 4,
      sender: 'client',
      content: 'Umas 4 tomadas no total. Você teria disponibilidade para amanhã de manhã?',
      time: '14:27',
      read: true,
    },
    {
      id: 5,
      sender: 'provider',
      content: 'Sim, tenho! Posso ir às 9h. O valor seria R$ 150 pelo serviço completo.',
      time: '14:28',
      read: true,
    },
    {
      id: 6,
      sender: 'provider',
      type: 'proposal',
      content: {
        service: 'Troca de 4 tomadas + Instalação de ventilador de teto',
        price: 'R$ 150,00',
        date: 'Amanhã, 20/05/2026',
        time: '09:00',
      },
      time: '14:29',
      read: false,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-secondary/20 text-secondary">
                {provider.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link to={`/prestador/${id}`} className="hover:underline">
                <h2 className="font-semibold text-foreground">{provider.name}</h2>
              </Link>
              <div className="flex items-center gap-2">
                {provider.online && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <p className="text-xs text-muted-foreground">Online</p>
                  </>
                )}
              </div>
            </div>
            <Link to="/">
              <Wrench className="h-6 w-6 text-secondary" />
            </Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Date divider */}
          <div className="flex items-center justify-center mb-6">
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Hoje
            </Badge>
          </div>

          {/* Messages list */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isClient = msg.sender === 'client';

              if (msg.type === 'proposal') {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-md">
                      <Card className="p-4 bg-secondary/5 border-secondary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-secondary" />
                          <p className="font-semibold text-foreground">Proposta de Serviço</p>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Serviço</p>
                            <p className="text-sm font-medium">{msg.content.service}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Data</p>
                              <p className="text-sm font-medium">{msg.content.date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Horário</p>
                              <p className="text-sm font-medium">{msg.content.time}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Valor</p>
                            <p className="text-lg font-bold text-secondary">{msg.content.price}</p>
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
                      <p className="text-xs text-muted-foreground mt-1 ml-2">{msg.time}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md ${isClient ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isClient
                          ? 'bg-secondary text-secondary-foreground rounded-tr-sm'
                          : 'bg-card border border-border rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-muted-foreground">{msg.time}</p>
                      {isClient && (
                        <CheckCheck className={`h-4 w-4 ${msg.read ? 'text-success' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input */}
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
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="pr-12 min-h-[44px] bg-input-background"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1"
                onClick={() => {}}
              >
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
