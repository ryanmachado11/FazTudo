import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ChevronLeft, Wrench, FileText } from 'lucide-react';

export default function Termos() {
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
              <FileText className="h-6 w-6 text-secondary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
          </div>

          <p className="text-xs text-muted-foreground mb-8">Última atualização: 20 de maio de 2026</p>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar ou utilizar a plataforma FazTudo+, você concorda expressamente em cumprir e ser regido por estes Termos de Uso. Se você não concordar com qualquer termo ou condição, recomendamos que não utilize nossos serviços.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">2. Descrição dos Serviços</h2>
              <p>
                O FazTudo+ é um marketplace de tecnologia que conecta clientes que necessitam de serviços urbanos e de reparos residenciais (como eletricistas, encanadores e montadores de móveis) com profissionais autônomos devidamente cadastrados. Nós não somos empregadores, representantes ou agentes de nenhum prestador de serviço, tampouco garantimos ou assumimos responsabilidade direta pela execução dos serviços.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">3. Cadastro e Segurança</h2>
              <p>
                Para utilizar determinadas funcionalidades, você deve criar uma conta fornecendo informações exatas, atualizadas e completas. Você é o único responsável pela guarda e confidencialidade de suas credenciais de acesso, bem como por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">4. Conduta do Usuário e Segurança</h2>
              <p>
                Os usuários concordam em agir com respeito e decoro mútuos durante o uso do chat interno e durante a prestação dos serviços presencias. É estritamente proibido o uso de linguagem ofensiva, assédio, spam, compartilhamento de vírus ou qualquer atividade ilegal na plataforma.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">5. Tarifas e Pagamentos</h2>
              <p>
                A contratação e negociação dos valores são realizadas diretamente entre o cliente e o prestador de serviços por meio do chat. O FazTudo+ poderá cobrar taxas de serviço pela intermediação e uso da tecnologia, as quais serão apresentadas de forma transparente antes de qualquer transação financeira.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">6. Limitação de Responsabilidade</h2>
              <p>
                O FazTudo+ empenha-se em verificar os documentos dos prestadores de serviço cadastrados para oferecer maior segurança aos clientes. No entanto, não nos responsabilizamos por danos indiretos, lucros cessantes, acidentes de trabalho ou perda de dados decorrentes da contratação de prestadores ou uso dos serviços.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">7. Alterações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Modificações significativas serão notificadas através de nossa plataforma ou por e-mail. O uso contínuo após as alterações constitui sua aceitação tácita.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <Button variant="secondary" onClick={() => navigate(-1)} className="px-6">
              Entendi e Aceito
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
