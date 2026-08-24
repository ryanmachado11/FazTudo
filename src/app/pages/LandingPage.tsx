import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Shield, Star, Wrench, Zap, Droplet, Box, ArrowRight, CheckCircle, Wind, ShieldCheck, Sparkles, Truck, Flame, Wifi, Layers } from 'lucide-react';
import { serviceCategories } from '../lib/categoriesData';
import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function LandingPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiGet<any[]>('/api/categories')
      .then((data) => { if (isMounted) setCategories(data); })
      .catch(() => { /* Static fallback categories remain visible. */ });
    return () => { isMounted = false; };
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Wrench className="h-7 w-7 text-secondary" />
              <span className="text-xl font-semibold text-foreground">FazTudo+</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">
                Como funciona
              </a>
              <a href="#categorias" className="text-muted-foreground hover:text-foreground transition-colors">
                Serviços
              </a>
              <a href="#confianca" className="text-muted-foreground hover:text-foreground transition-colors">
                Confiança
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/cadastro">
                <Button variant="secondary">Cadastrar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 flex items-center gap-1.5 w-fit px-3 py-1 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Profissionais verificados
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Contrate profissionais de confiança
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Eletricistas, encanadores e montadores verificados prontos para te atender.
                Rápido, seguro e sem complicação.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/home" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                    Encontrar Profissionais
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/cadastro-prestador" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary/80 hover:border-primary text-foreground hover:bg-primary/5 font-semibold">
                    Quero ser Prestador
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Sem taxa de cadastro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Pagamento seguro</span>
                </div>
              </div>
            </div>
            <div className="relative w-full h-[400px] sm:h-[450px] flex items-center justify-center">
              {/* Quadrado de fundo (warm sand/cream) */}
              <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-[#f4e6d4] rounded-[2rem] relative shadow-sm">
                
                {/* Card de Profissional (Ricardo M.) */}
                <Card className="absolute -top-6 -left-6 sm:-top-8 sm:-left-12 w-[240px] sm:w-[280px] p-4 bg-card rounded-2xl border border-border/60 shadow-lg hover:scale-105 transition-all duration-300 z-20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#f4e6d4]/70 text-[#a77320] font-bold flex items-center justify-center text-base sm:text-lg shrink-0">
                      RM
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm sm:text-base truncate">Ricardo M.</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Eletricista • 4,2 km</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs sm:text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                    <span className="text-secondary font-bold">4.9</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">128 avaliações</span>
                  </div>
                </Card>

                {/* Badge de Destaque (+10.000 serviços) */}
                <div className="absolute top-[90px] sm:top-[110px] -left-2 sm:-left-6 z-30 bg-[#1c1c1c] text-[#fafaf8] px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-md hover:scale-105 transition-all duration-300 flex items-center justify-center whitespace-nowrap">
                  + 10.000 serviços realizados
                </div>

                {/* Selo Documentos Verificados */}
                <Card className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-12 w-[210px] sm:w-[250px] p-4 bg-card rounded-2xl border border-border/60 shadow-lg hover:scale-105 transition-all duration-300 z-20">
                  <div className="flex items-start gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-[2.5] text-[#2d9f5e]" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#2d9f5e] text-xs sm:text-sm">Documentos verificados</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">CPF, RG e comprovante validados</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Serviços disponíveis
            </h2>
            <p className="text-lg text-muted-foreground">
              Profissionais qualificados para o que você precisa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(categories.length > 0 ? categories : serviceCategories.slice(0, 3)).map((cat) => {
              // Find matching details from static data to retain description/subcategories if matched
              const matchedStatic = serviceCategories.find(
                (sc) =>
                  sc.name.toLowerCase() === cat.name.toLowerCase() ||
                  sc.id === cat.slug ||
                  (cat.slug && sc.id.includes(cat.slug))
              );

              const description = matchedStatic?.description ?? 'Serviços especializados locais.';
              const subcategories = matchedStatic?.subcategories ?? [cat.name];

              return (
                <Card key={cat.id} className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {subcategories.slice(0, 4).map((sub) => (
                        <span key={sub} className="text-xs bg-secondary/10 text-secondary font-medium px-2 py-0.5 rounded-full">
                          {sub}
                        </span>
                      ))}
                      {subcategories.length > 4 && (
                        <span className="text-xs text-muted-foreground font-medium px-1 py-0.5">
                          +{subcategories.length - 4} mais
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={`/home?categoria=${cat.slug || cat.id}`}>
                    <Button variant="ghost" className="p-0 h-auto font-semibold text-secondary hover:text-secondary/80">
                      Ver profissionais <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link to="/home">
              <Button size="lg" variant="outline" className="border-2 font-semibold">
                Explorar todas as {categories.length || serviceCategories.length} categorias e subcategorias
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Simples, rápido e seguro
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-secondary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Encontre o profissional</h3>
              <p className="text-muted-foreground">
                Busque por categoria ou veja profissionais próximos a você
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Converse e combine</h3>
              <p className="text-muted-foreground">
                Chat direto para tirar dúvidas e combinar o serviço
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-secondary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Contrate com confiança</h3>
              <p className="text-muted-foreground">
                Profissional verificado realiza o serviço e você avalia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Confiança */}
      <section id="confianca" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sua segurança em primeiro lugar
            </h2>
            <p className="text-lg text-muted-foreground">
              Todos os profissionais são verificados
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Shield className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Documentos verificados</h3>
              <p className="text-muted-foreground text-sm">
                CPF, RG e comprovante de residência validados
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sistema de avaliações</h3>
              <p className="text-muted-foreground text-sm">
                Notas e comentários reais de clientes
              </p>
            </Card>
            <Card className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selo de qualidade</h3>
              <p className="text-muted-foreground text-sm">
                Profissionais com histórico comprovado
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Avaliações */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que nossos clientes dizem
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Maria Silva', rating: 5, comment: 'Eletricista muito competente! Resolveu o problema rapidamente e com preço justo.' },
              { name: 'João Santos', rating: 5, comment: 'Encanador pontual e eficiente. Recomendo!' },
              { name: 'Ana Costa', rating: 5, comment: 'Excelente montador, montou meu guarda-roupa com muito capricho.' }
            ].map((review, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">{review.comment}</p>
                <p className="font-semibold text-sm">{review.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-secondary" />
                <span className="text-lg font-semibold">FazTudo+</span>
              </div>
              <p className="text-sm text-primary-foreground/80">
                Conectando você a profissionais de confiança
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Serviços</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Eletricistas</li>
                <li>Encanadores</li>
                <li>Montadores</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Empresa</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Sobre nós</li>
                <li>Como funciona</li>
                <li>Seja um prestador</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Central de ajuda</li>
                <li>Termos de uso</li>
                <li>Privacidade</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
            © 2026 FazTudo+. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
