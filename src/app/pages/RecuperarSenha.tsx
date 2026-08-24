import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Wrench, ChevronLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('A recuperação por e-mail ainda não está configurada.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Wrench className="h-10 w-10 text-secondary" />
          <span className="text-3xl font-bold text-foreground">FazTudo+</span>
        </Link>

        <Card className="p-8 border border-border">
          <div className="mb-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold mb-4 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para o login
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-2">Recuperar senha</h1>
            <p className="text-muted-foreground text-sm">
              A recuperação por e-mail ainda não está disponível. Não enviaremos um link até que o serviço de e-mail seja configurado.
            </p>
          </div>

          {!isSent ? (
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
                  className="bg-input-background"
                />
              </div>

              <Button type="submit" variant="secondary" size="lg" className="w-full" disabled>
                Recuperação indisponível
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex bg-success/15 p-3 rounded-full text-success">
                <CheckCircle className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Verifique seu e-mail</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Enviamos um link de redefinição de senha para <strong className="text-foreground">{email}</strong>.
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  Ir para a página de Login
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
