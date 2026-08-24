import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ChevronLeft, Wrench, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPut } from '../lib/api';
import { getCurrentUser } from '../lib/session';

export default function PerfilEditar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [name, setName] = useState(currentUser?.name || '');
  const [category, setCategory] = useState('Eletricista');
  const [price, setPrice] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    setSpecialties(specialties.filter((spec) => spec !== specToRemove));
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await apiGet<any[]>('/api/categories');
        setAvailableCategories(categories);
      } catch (error) {
        console.error(error);
      }
    };

    const loadProfile = async () => {
      try {
        const profile = await apiGet<any>('/api/provider/profile/me');
        setName(profile.name || currentUser?.name || '');
        setDescription(profile.bio || '');
        setSpecialties(Array.isArray(profile.specialties) ? profile.specialties : []);
        setRegion([profile.city, profile.neighborhood, profile.state].filter(Boolean).join(' - '));
        setPrice(profile.hourlyRate ? `A partir de R$ ${Number(profile.hourlyRate).toFixed(2)}` : '');
        setCategory(profile.category || 'Eletricista');
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
    loadProfile();
  }, [currentUser?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const categoryMatch = availableCategories.find((cat) => cat.name === category);
      const categoryIds = categoryMatch ? [categoryMatch.id] : [];
      const regionParts = region.split(' - ').map((part) => part.trim()).filter(Boolean);
      const state = regionParts.length > 1 ? regionParts.at(-1) : undefined;
      const neighborhood = regionParts.length > 2 ? regionParts.slice(1, -1).join(' - ') : '';

      await apiPut('/api/provider/profile/me', {
        name: name.trim(),
        bio: description,
        specialties,
        city: regionParts[0] || '',
        neighborhood,
        state,
        hourlyRate: Number(price.replace(/[^0-9,]/g, '').replace(',', '.')) || 0,
        isUrgentAvailable: true,
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
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-secondary/20 text-secondary text-xl font-bold">
                  {name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-semibold text-foreground text-sm">Foto de Perfil</h4>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline">
                    Alterar Foto
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                    Remover
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
                      <option value="Eletricista">Eletricista</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="region">Região de Atendimento</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    placeholder="Ex: Zona Sul - São Paulo"
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
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-4 border-t border-border justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="px-6">
                Cancelar
              </Button>
              <Button type="submit" variant="secondary" className="px-6" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
