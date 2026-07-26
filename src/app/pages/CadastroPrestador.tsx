import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Wrench, ChevronLeft, ShieldCheck, Upload, User, FileText, Camera, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { serviceCategories } from '../lib/categoriesData';

export default function CadastroPrestador() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(serviceCategories[0].id);
  const [subcategory, setSubcategory] = useState(serviceCategories[0].subcategories[0]);
  const [experience, setExperience] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate validation and submit
    toast.success('Cadastro enviado com sucesso para análise!');
    setStep(4); // Verification Status Step
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-10 px-4">
      <div className="w-full max-w-xl mx-auto">
        {/* Header/Logo */}
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

        {/* Progress Indicator */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
              <span className={step >= 1 ? 'text-secondary font-semibold' : ''}>1. Dados Básicos</span>
              <span className={step >= 2 ? 'text-secondary font-semibold' : ''}>2. Documentos</span>
              <span className={step >= 3 ? 'text-secondary font-semibold' : ''}>3. Selfie</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="p-6 sm:p-10 border border-border shadow-sm">
          {/* STEP 1: Basic details */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Seja um Prestador FazTudo+</h1>
                <p className="text-muted-foreground text-sm">
                  Junte-se à maior rede de eletricistas, encanadores e montadores de confiança.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Como no seu documento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-input-background"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de contato</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="phone">Celular (WhatsApp)</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-input-background"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria Principal</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        setCategory(newCatId);
                        const selectedCat = serviceCategories.find((c) => c.id === newCatId);
                        if (selectedCat && selectedCat.subcategories.length > 0) {
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

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Especialidade / Subcategoria</Label>
                    <select
                      id="subcategory"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {serviceCategories
                        .find((c) => c.id === category)
                        ?.subcategories.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Tempo de experiência profissional</Label>
                  <Input
                    id="experience"
                    placeholder="Ex: 5 anos de experiência"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    className="bg-input-background"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Próxima Etapa
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Document verification */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Envio do Documento de Identidade</h1>
                <p className="text-muted-foreground text-sm">
                  Envie uma foto legível do seu RG ou CNH (Frente e Verso). Isso ajuda a construir a confiança com os clientes.
                </p>
              </div>

              {/* Security info card */}
              <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl flex gap-3">
                <ShieldCheck className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Sua privacidade é prioridade</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Seus dados de documentos são protegidos por criptografia de ponta a ponta e serão utilizados exclusivamente para análise cadastral e emissão do selo de verificação.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-input-background hover:bg-muted/30 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setDocumentFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm text-foreground">
                    {documentFile ? documentFile.name : 'Selecionar foto do documento'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou PDF de até 5MB</p>
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground">
                  <FileText className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>Dica: certifique-se de que todas as informações (nome, foto, número do registro) estejam visíveis e legíveis.</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handlePrevStep}>
                  Voltar
                </Button>
                <Button type="submit" variant="secondary" size="lg" className="flex-1" disabled={!documentFile}>
                  Continuar
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Selfie Verification */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Foto de Verificação (Selfie)</h1>
                <p className="text-muted-foreground text-sm">
                  Tire uma selfie segurando o documento ao lado do seu rosto ou apenas uma selfie bem iluminada do seu rosto.
                </p>
              </div>

              <div className="flex justify-center py-4">
                <div className="relative border border-border rounded-full p-1 bg-muted">
                  <div className="h-32 w-32 rounded-full overflow-hidden flex items-center justify-center bg-input-background border-2 border-dashed border-muted-foreground/30">
                    {selfieFile ? (
                      <img src={URL.createObjectURL(selfieFile)} alt="Selfie" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelfieFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Rosto centralizado, sem óculos escuros ou boné.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Ambiente bem iluminado.</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handlePrevStep}>
                  Voltar
                </Button>
                <Button type="submit" variant="secondary" size="lg" className="flex-1" disabled={!selfieFile}>
                  Enviar Cadastro
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4: Verification Status Dashboard */}
          {step === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex bg-secondary/15 p-4 rounded-full text-secondary">
                <Clock className="h-14 w-14 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <Badge className="bg-secondary/15 text-secondary border-secondary/20 text-sm py-1 px-3">
                  Aguardando Análise
                </Badge>
                <h1 className="text-2xl font-bold text-foreground">Documentos em Análise</h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Nossa equipe de segurança já recebeu suas informações e fotos de verificação. O prazo médio de análise é de **24 horas úteis**.
                </p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 max-w-sm mx-auto text-left bg-muted/30 p-4 rounded-xl border border-border">
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-secondary" />
                  Status da Validação
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dados Cadastrais</span>
                    <span className="text-success font-semibold">Recebido</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documento de Identidade</span>
                    <span className="text-success font-semibold">Recebido</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selfie Comparativa</span>
                    <span className="text-success font-semibold">Recebido</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                  Voltar para o Início
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard')}>
                  Acessar Painel (Provisório)
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">
        Ao prosseguir, você declara que as informações enviadas são verídicas e concorda com a nossa{' '}
        <Link to="/privacidade" className="underline">
          Política de Privacidade
        </Link>.
      </p>
    </div>
  );
}
