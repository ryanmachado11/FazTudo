import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ChevronLeft, Wrench, Shield } from 'lucide-react';

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-8 sm:p-10 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-secondary/15 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          </div>

          <p className="text-xs text-muted-foreground mb-8">Última atualização: 20 de maio de 2026</p>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">1. Informações que Coletamos</h2>
              <p>
                Coletamos informações cadastrais fornecidas diretamente por você ao criar uma conta, tais como nome completo, endereço de e-mail, número de telefone e dados de perfil. Para prestadores de serviço, coletamos também documentos de identificação (RG, CPF e comprovante de residência) e fotos (selfie) necessários para a verificação de segurança.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">2. Uso das Informações</h2>
              <p>
                Utilizamos suas informações para operar, manter, melhorar e personalizar os serviços do FazTudo+. Isso inclui:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Facilitar a comunicação entre clientes e prestadores no chat;</li>
                <li>Validar a identidade de prestadores (selo de verificação);</li>
                <li>Garantir a segurança e integridade de nossa comunidade;</li>
                <li>Enviar avisos administrativos, alertas de serviços e suporte técnico.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento de Dados</h2>
              <p>
                Os seus dados de contato (como número de telefone e nome) e informações de serviço podem ser compartilhados com o profissional ou cliente correspondente com o qual você iniciou uma negociação. O FazTudo+ **não vende** suas informações pessoais para anunciantes ou terceiros.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">4. Segurança dos Dados</h2>
              <p>
                Adotamos medidas técnicas e administrativas compatíveis com os padrões do mercado para proteger seus dados pessoais contra perda, roubo, acesso não autorizado, alteração ou destruição. Seus dados de documentos enviados para validação são armazenados de forma criptografada.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">5. Direitos dos Usuários (LGPD)</h2>
              <p>
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você possui o direito de confirmar a existência de tratamento de seus dados, acessar, corrigir dados incompletos ou inexatos, ou solicitar a exclusão de sua conta e dados pessoais a qualquer momento através de nosso suporte.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">6. Cookies e Tecnologias Semelhantes</h2>
              <p>
                Utilizamos cookies essenciais para manter sua sessão ativa e salvar suas preferências de navegação. Você pode gerenciar os cookies diretamente nas configurações de seu navegador de internet.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <Button variant="secondary" onClick={() => navigate(-1)} className="px-6">
              Aceito a Política
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
