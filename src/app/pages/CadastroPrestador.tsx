import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ChevronLeft, CheckCircle2, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ApiError, apiGet, apiPost, apiPut } from '../lib/api';
import { serviceCategories } from '../lib/categoriesData';
import { saveSession } from '../lib/session';

export default function CadastroPrestador() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(serviceCategories[0].id);
  const [subcategory, setSubcategory] = useState(serviceCategories[0].subcategories[0]);
  const [experience, setExperience] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');

  const getFieldError = (field: string) => fieldErrors[field]?.[0];
  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !experience.trim()) {
      toast.error('Preencha os dados basicos antes de continuar.');
      return;
    }

    setStep(2);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      return;
    }

    navigate(-1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast.error('Preencha nome, e-mail, telefone e senha antes de enviar o cadastro.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost('/api/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'PROVIDER',
      });

      const loginRes: any = await apiPost('/api/auth/login', {
        email,
        password,
      });

      saveSession({
        accessToken: loginRes.accessToken,
        refreshToken: loginRes.refreshToken,
        user: loginRes.user,
      });

      const dbCategories = await apiGet<any[]>('/api/categories');
      const categorySlugMap: Record<string, string> = {
        eletrica: 'eletricista',
        hidraulica: 'encanador',
        'montagem-instalacao': 'montador-de-moveis',
      };
      const targetSlug = categorySlugMap[category] || 'eletricista';
      const matchedDbCategory = dbCategories.find((entry) => entry.slug === targetSlug) || dbCategories[0];

      await apiPut('/api/provider/profile/me', {
        bio: `Profissional especializado em ${subcategory}. Experiencia: ${experience}.`,
        city: 'Sao Paulo',
        neighborhood: '',
        state: 'SP',
        hourlyRate: 0,
        isUrgentAvailable: true,
        categoryIds: matchedDbCategory ? [matchedDbCategory.id] : [],
      });

      toast.success('Cadastro concluido com sucesso!');
      setStep(3);
    } catch (error: any) {
      if (error instanceof ApiError && error.payload?.issues?.fieldErrors) {
        setFieldErrors(error.payload.issues.fieldErrors);
        setFormError(error.message);
        setStep(1);
        toast.error(error.message);
        return;
      }

      toast.error(error?.message || 'Falha ao enviar cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleGoToProfileEdit = () => {
    navigate('/perfil/editar', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-10 px-4">
      <div className="w-full max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-secondary" />
            <span className="text-2xl font-bold text-foreground">FazTudo+</span>
          </Link>
        </div>

        {step < 3 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
              <span className={step >= 1 ? 'text-secondary font-semibold' : ''}>1. Dados basicos</span>
              <span className={step >= 2 ? 'text-secondary font-semibold' : ''}>2. Confirmacao</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
            </div>
          </div>
        )}

        <Card className="p-6 sm:p-10 border border-border shadow-sm">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Seja um prestador FazTudo+</h1>
                <p className="text-muted-foreground text-sm">
                  Crie sua conta e comece a receber trabalhos sem envio de imagem ou verificacao manual.
                </p>
              </div>

              {formError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError('name');
                    }}
                    required
                    className="bg-input-background"
                    aria-invalid={Boolean(getFieldError('name'))}
                  />
                  {getFieldError('name') && <p className="text-xs text-destructive">{getFieldError('name')}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de contato</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      required
                      className="bg-input-background"
                      aria-invalid={Boolean(getFieldError('email'))}
                    />
                    {getFieldError('email') && <p className="text-xs text-destructive">{getFieldError('email')}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      required
                      className="bg-input-background"
                      aria-invalid={Boolean(getFieldError('phone'))}
                    />
                    {getFieldError('phone') && <p className="text-xs text-destructive">{getFieldError('phone')}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      required
                      minLength={8}
                      className="bg-input-background"
                      aria-invalid={Boolean(getFieldError('password'))}
                    />
                    {getFieldError('password') && <p className="text-xs text-destructive">{getFieldError('password')}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria principal</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        setCategory(newCatId);
                        const selectedCat = serviceCategories.find((entry) => entry.id === newCatId);
                        if (selectedCat?.subcategories?.length) {
                          setSubcategory(selectedCat.subcategories[0]);
                        }
                      }}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {serviceCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Especialidade / Subcategoria</Label>
                  <select
                    id="subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {serviceCategories.find((entry) => entry.id === category)?.subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Tempo de experiencia profissional</Label>
                  <Input
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    className="bg-input-background"
                    placeholder="Ex: 5 anos de experiencia"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Proxima etapa
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Revise seu cadastro</h1>
                <p className="text-muted-foreground text-sm">
                  Seu perfil sera criado direto, sem documento ou selfie.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Categoria</span>
                  <span className="font-medium text-foreground">{serviceCategories.find((entry) => entry.id === category)?.name || 'Prestador'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Especialidade</span>
                  <span className="font-medium text-foreground">{subcategory}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Experiencia</span>
                  <span className="font-medium text-foreground">{experience}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 p-4">
                <User className="mt-0.5 h-5 w-5 text-secondary" />
                <p className="text-sm text-muted-foreground">
                  Depois de concluir, voce ja podera aceitar trabalhos e editar o perfil quando quiser.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handlePrevStep}>
                  Voltar
                </Button>
                <Button type="submit" variant="secondary" size="lg" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar conta'}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex bg-secondary/15 p-4 rounded-full text-secondary">
                <CheckCircle2 className="h-14 w-14" />
              </div>

              <div className="space-y-2">
                <Badge className="bg-secondary/15 text-secondary border-secondary/20 text-sm py-1 px-3">
                  Perfil ativo
                </Badge>
                <h1 className="text-2xl font-bold text-foreground">Cadastro concluido</h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Sua conta de prestador foi criada e o perfil ja esta pronto para receber solicitacoes.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/', { replace: true })}>
                  Voltar para o inicio
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={handleGoToProfileEdit}>
                  Completar perfil
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={handleGoToDashboard}>
                  Acessar painel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Ao prosseguir, voce declara que as informacoes enviadas sao verdadeiras e concorda com a nossa{' '}
        <Link to="/privacidade" className="underline">
          Politica de Privacidade
        </Link>.
      </p>
    </div>
  );
}
