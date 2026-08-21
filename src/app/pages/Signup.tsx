import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, apiPost } from '../lib/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const getFieldError = (field: string) => fieldErrors[field]?.[0];
  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError('');

    try {
      await apiPost('/api/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'CLIENT',
      });

      toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (error: any) {
      if (error instanceof ApiError && error.payload?.issues?.fieldErrors) {
        setFieldErrors(error.payload.issues.fieldErrors);
        setFormError(error.message);
        toast.error(error.message);
        return;
      }

      toast.error(error?.message || 'Falha ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Wrench className="h-10 w-10 text-secondary" />
          <span className="text-3xl font-bold text-foreground">FazTudo+</span>
        </Link>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Crie sua conta</h1>
            <p className="text-muted-foreground">Cadastre-se para contratar profissionais</p>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
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

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
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
                placeholder="(11) 99999-9999"
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
                placeholder="Mínimo 8 caracteres"
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
              {getFieldError('password') && (
                <p className="text-xs text-destructive">{getFieldError('password')}</p>
              )}
            </div>

            <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link to="/login" className="text-secondary font-semibold hover:underline">
                Entrar
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <Link to="/cadastro-prestador" className="text-secondary hover:underline">
                Quero me cadastrar como prestador
              </Link>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{' '}
          <Link to="/termos" className="underline">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link to="/privacidade" className="underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
