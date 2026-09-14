import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { ChevronLeft, Wrench, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, apiGet, apiPut } from '../lib/api';
import { getCurrentUser } from '../lib/session';

function parseHourlyRate(value: string) {
  const numericValue = value.replace(/[^0-9,.-]/g, '');
  if (!numericValue) return 0;

  const commaIndex = numericValue.lastIndexOf(',');
  const dotIndex = numericValue.lastIndexOf('.');
  let normalizedValue = numericValue;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalizedValue = numericValue
      .split(thousandsSeparator).join('')
      .replace(decimalSeparator, '.');
  } else if (commaIndex >= 0) {
    normalizedValue = numericValue.replace(',', '.');
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function PerfilEditar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [name, setName] = useState(currentUser?.name || '');
  const [category, setCategory] = useState('Elétrica');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatarUrl || null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isUrgentAvailable, setIsUrgentAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const handleAddSpecialty = () => {
    const specialty = newSpecialty.trim();
    if (specialty.length > 100) {
      toast.error('Cada especialidade deve ter no máximo 100 caracteres.');
      return;
    }
    if (specialties.length >= 20) {
      toast.error('Adicione no máximo 20 especialidades.');
      return;
    }
    if (specialty && !specialties.some((item) => item.toLowerCase() === specialty.toLowerCase())) {
      setSpecialties([...specialties, specialty]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    setSpecialties(specialties.filter((spec) => spec !== specToRemove));
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProfile(true);
    setProfileLoaded(false);
    setLoadError('');
    setCategoriesLoaded(false);

    const loadCategories = async () => {
      try {
        const categories = await apiGet<any[]>('/api/categories');
        if (isMounted) {
          setAvailableCategories(categories);
          setCategoriesLoaded(true);
          setCategory((current) => categories.some((item) => item.name === current) ? current : categories[0]?.name || '');
        }
      } catch (error) {
        console.error(error);
        if (isMounted) setLoadError('Não foi possível carregar as categorias do perfil.');
      }
    };

    const loadProfile = async () => {
      try {
        const profile = await apiGet<any>('/api/provider/profile/me');
        if (isMounted) {
          setName(profile.name || currentUser?.name || '');
          setAvatarUrl(profile.avatarUrl || null);
          setDescription(profile.bio || '');
          setSpecialties(Array.isArray(profile.specialties) ? profile.specialties : []);
          setCity(profile.city || '');
          setNeighborhood(profile.neighborhood || '');
          setState(profile.state || '');
          setPrice(profile.hourlyRate ? `A partir de R$ ${Number(profile.hourlyRate).toFixed(2)}` : '');
          setCategory(profile.category || 'Elétrica');
          setIsUrgentAvailable(Boolean(profile.isUrgentAvailable));
          setProfileLoaded(true);
        }
      } catch (error) {
        if (isMounted && error instanceof ApiError && error.status === 404) {
          setName(currentUser?.name || '');
          setAvatarUrl(currentUser?.avatarUrl || null);
          setDescription('');
          setSpecialties([]);
          setCity('');
          setNeighborhood('');
          setState('');
          setPrice('');
          setIsUrgentAvailable(false);
          setProfileLoaded(true);
        } else if (isMounted) {
          console.error(error);
          setLoadError('Não foi possível carregar seu perfil.');
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    loadCategories();
    loadProfile();

    return () => { isMounted = false; };
  }, [currentUser?.name, retryKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const categoryMatch = availableCategories.find((cat) => cat.name === category);
      const categoryIds = categoriesLoaded && categoryMatch ? [categoryMatch.id] : undefined;
      const hourlyRate = parseHourlyRate(price);
      if (hourlyRate < 0 || hourlyRate > 100_000) {
        toast.error('Informe um valor entre R$ 0 e R$ 100.000.');
        return;
      }

      await apiPut('/api/provider/profile/me', {
        name: name.trim(),
        bio: description,
        specialties,
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        state: state.trim().toUpperCase(),
        hourlyRate,
        isUrgentAvailable,
        categoryIds,
      });
      toast.success('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
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
        <Card className="p-6 sm:p-10 border border-border shadow-sm">
          {isLoadingProfile && (
            <div className="mb-6 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Carregando dados do perfil...
            </div>
          )}
          {!isLoadingProfile && loadError && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p>{loadError}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setRetryKey((current) => current + 1)}>
                Tentar novamente
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Editar Perfil</h1>
              <p className="text-muted-foreground text-sm">
                Mantenha suas informações atualizadas para atrair mais clientes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Profile Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-muted/20 p-4 rounded-xl">
              <ProfilePhoto
                name={name}
                avatarUrl={avatarUrl}
                className="h-20 w-20"
                onUploaded={setAvatarUrl}
                onRemoved={() => setAvatarUrl(null)}
                allowRemove
              />
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-semibold text-foreground text-sm">Foto de Perfil</h4>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                    Alterar Foto
                  </Button>
                </div>
              </div>
            </div>

            {/* Input Details */}
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria do Serviço</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {availableCategories.length > 0 ? availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    )) : (
                      <option value="Elétrica">Elétrica</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Médio / Base</Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="Ex: A partir de R$ 80"
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="Ex: São Paulo"
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    maxLength={120}
                    placeholder="Ex: Bela Vista"
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    required
                    minLength={2}
                    maxLength={2}
                    placeholder="SP"
                    className="bg-input-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Sobre Você (Descrição do Perfil)</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={5000}
                  placeholder="Escreva um pouco sobre sua experiência e serviços oferecidos..."
                  className="bg-input-background"
                />
              </div>

              {/* Specialties / tags Section */}
              <div className="space-y-3 pt-2">
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {specialties.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20 px-2.5 py-1 rounded-full"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(spec)}
                        className="bg-transparent border-0 p-0 text-secondary hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar nova especialidade..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="bg-input-background flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecialty();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddSpecialty}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isUrgentAvailable}
                  onChange={(event) => setIsUrgentAvailable(event.target.checked)}
                />
                Disponível para atendimentos urgentes
              </label>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-4 border-t border-border justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="px-6">
                Cancelar
              </Button>
              <Button type="submit" variant="secondary" className="px-6" disabled={isSaving || isLoadingProfile || !profileLoaded || Boolean(loadError)}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : isLoadingProfile ? 'Carregando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
