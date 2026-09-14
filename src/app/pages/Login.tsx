import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, apiPost } from '../lib/api';
import { saveSession } from '../lib/session';
import { useAuth } from '../hooks/useAuth';

type LoginResponse = {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
};

export function safeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }

  return value;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: sessionLoading } = useAuth();

  useEffect(() => {
    if (sessionLoading || !user) return;
    navigate(user.role === 'PROVIDER' ? '/dashboard' : '/home', { replace: true });
  }, [navigate, sessionLoading, user]);

  if (sessionLoading || user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await apiPost<LoginResponse>('/api/auth/login', {
        email,
        password,
      });

      saveSession(data);
      toast.success('Login realizado com sucesso!');
      const params = new URLSearchParams(location.search);
      const redirectTo = safeRedirectPath(params.get('redirectTo'));
      navigate(redirectTo || (data.user.role === 'PROVIDER' ? '/dashboard' : '/home'), { replace: true });
    } catch (error: any) {
      toast.error(error instanceof ApiError && error.status === 429
        ? 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
        : error?.message || 'Falha ao entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Wrench className="h-10 w-10 text-secondary" />
          <span className="text-3xl font-bold text-foreground">FazTudo+</span>
        </Link>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                autoComplete="email"
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/recuperar-senha" className="text-sm text-secondary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="current-password"
                className="bg-input-background"
              />
            </div>

            <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
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
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link to="/cadastro" className="text-secondary font-semibold hover:underline">
                Cadastre-se
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
