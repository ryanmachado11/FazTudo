import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { ChevronLeft, Wrench, AlertTriangle, MapPin, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../lib/api';

export default function Urgente() {
  const navigate = useNavigate();
  
  const [urgencyType, setUrgencyType] = useState('vazamento');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [foundProvider, setFoundProvider] = useState<any>(null);
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return;
    if (!description.trim() || !address.trim()) {
      toast.error('Preencha todos os campos para continuar.');
      return;
    }

    setIsSearching(true);
    
    try {
      // 1. Fetch categories to find target categoryId
      const categories = await apiGet<any[]>('/api/categories');
      const slugMap: Record<string, string> = {
        vazamento: 'hidraulica',
        energia: 'eletrica',
        chaveiro: 'estrutura-reparos',
      };
      const targetSlug = slugMap[urgencyType] || 'hidraulica';
      const category = categories.find(c => c.slug === targetSlug);

      if (!category) {
        throw new Error('Nenhuma categoria de emergência correspondente foi encontrada.');
      }

      // 2. Fetch providers in this category
      const providers = await apiGet<any[]>(`/api/providers?category=${encodeURIComponent(category.slug)}&urgent=true`);
      const selectedProvider = providers[0];

      if (!selectedProvider) {
        throw new Error('Nenhum profissional disponível para essa especialidade no momento.');
      }

      // 3. Create service request
      const created = await apiPost<{ service: { id: string } }>('/api/services', {
        categoryId: category.id,
        providerId: selectedProvider.id,
        description: `ATENDIMENTO DE EMERGÊNCIA: ${description.trim()} | Local: ${address.trim()}`,
        urgencyFlag: true,
      });

      setFoundProvider(selectedProvider);
      setServiceRequestId(created.service.id);
      setIsSearching(false);
      setSearchComplete(true);
      toast.success('Solicitação urgente enviada.');

    } catch (error: any) {
      setIsSearching(false);
      toast.error(error?.message || 'Falha ao acionar profissional.');
    }
  };

  const emergencyOptions = [
    { id: 'vazamento', label: 'Vazamento Incontrolável', desc: 'Canos estourados, alagamentos' },
    { id: 'energia', label: 'Curto-Circuito / Sem Luz', desc: 'Falta de energia total, faíscas no quadro' },
    { id: 'chaveiro', label: 'Porta Trancada', desc: 'Perda de chaves, fechadura quebrada' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer text-sm font-medium"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-secondary" />
              <span className="text-lg font-semibold text-foreground">FazTudo+</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Warning Banner */}
          <Alert className="bg-accent/10 border-accent/30 text-foreground rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="h-6 w-6 text-accent flex-shrink-0" />
            <div>
              <AlertTitle className="font-bold text-foreground text-sm">Serviço de Emergência Urgente</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                A solicitação será enviada a um prestador da categoria selecionada que informou disponibilidade para urgências. A confirmação do atendimento depende da resposta do profissional.
              </AlertDescription>
            </div>
          </Alert>

          {!isSearching && !searchComplete ? (
            <Card className="p-6 sm:p-10 border border-border shadow-sm">
              <h1 className="text-2xl font-bold text-foreground mb-6">Solicitar Atendimento Urgente</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Type of Emergency */}
                <div className="space-y-3">
                  <Label>Qual é a sua emergência?</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {emergencyOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUrgencyType(opt.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between bg-card cursor-pointer h-24 ${
                          urgencyType === opt.id
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground leading-tight mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descreva brevemente o problema</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Ex: Cano de entrada da cozinha estourou e está vazando muita água. Preciso fechar/reparar urgente."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={4000}
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço de Atendimento</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Informe o endereço onde precisa do atendimento"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      maxLength={500}
                      required
                      className="pl-10 bg-input-background"
                    />
                  </div>
                </div>

                {/* Call Action Button */}
                <Button type="submit" variant="secondary" className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 text-foreground">
                  <AlertTriangle className="h-5 w-5 mr-2 animate-bounce" />
                  Enviar Solicitação Urgente
                </Button>
              </form>
            </Card>
          ) : isSearching ? (
            /* Searching Interface */
            <Card className="p-8 sm:p-12 text-center border border-border shadow-sm space-y-6">
              <div className="relative flex justify-center py-6">
                <div className="absolute h-24 w-24 rounded-full bg-accent/20 animate-ping" />
                <div className="relative bg-accent p-6 rounded-full text-foreground shadow-lg">
                  <Search className="h-12 w-12 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Procurando Prestador Disponível...</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Estamos procurando um prestador da categoria selecionada com disponibilidade para urgências e enviaremos a solicitação em seguida.
                </p>
              </div>

            </Card>
          ) : (
            /* Search Complete/Success Interface */
            <Card className="p-8 sm:p-12 text-center border border-border shadow-sm space-y-6">
              <div className="flex justify-center">
                <div className="bg-success/15 p-4 rounded-full text-success">
                  <CheckCircle className="h-16 w-16" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Solicitação Enviada</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Sua solicitação foi enviada para {foundProvider?.name}, profissional de {foundProvider?.category}. Aguarde a resposta pelo chat.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-muted/40 p-4 rounded-xl border border-border text-left space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-foreground">{foundProvider?.name}</p>
                    <p className="text-xs text-muted-foreground">{foundProvider?.category} - ⭐ {foundProvider?.rating} ({foundProvider?.reviews} avaliações)</p>
                  </div>
                  <Badge className="bg-accent/15 text-accent border-accent/20">Aguardando resposta</Badge>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/home')}>
                  Ir para a Home
                </Button>
                <Link to={serviceRequestId ? `/chat/servico/${serviceRequestId}` : '/mensagens'} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Abrir Chat com {foundProvider?.name?.split(' ')[0]}
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
