import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, BarChart3, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Edit3,
  Eye, Home, LayoutDashboard, Menu, MessageCircle, MoreHorizontal, Plus, Search,
  Trash2, TrendingUp, UserRound, Users, WalletCards, Wrench, X,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';

type Client = {
  id: string; name: string; phone: string; address: string; neighborhood: string; notes: string;
};
type ServiceStatus = 'solicitado' | 'confirmado' | 'em andamento' | 'concluído' | 'cancelado';
type Service = {
  id: string; clientId: string; category: string; description: string; date: string; time: string;
  address: string; value: number; notes: string; status: ServiceStatus;
};
type FinanceStatus = 'recebido' | 'pendente' | 'atrasado' | 'cancelado';
type Movement = {
  id: string; description: string; type: 'receita' | 'despesa'; value: number; date: string;
  status: FinanceStatus; payment: 'Pix' | 'Dinheiro' | 'Cartão' | 'Transferência' | 'Outro';
};
type DemoData = { available: boolean; clients: Client[]; services: Service[]; movements: Movement[] };
type Section = 'dashboard' | 'clientes' | 'financas' | 'servicos';

const today = new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const initialData: DemoData = {
  available: true,
  clients: [
    { id: 'c1', name: 'Maria Oliveira', phone: '11987654321', address: 'Rua das Flores, 120', neighborhood: 'Vila Mariana', notes: 'Prefere atendimento pela manhã.' },
    { id: 'c2', name: 'João Pedro', phone: '11976543210', address: 'Av. Paulista, 900', neighborhood: 'Bela Vista', notes: 'Portaria exige identificação.' },
    { id: 'c3', name: 'Ana Santos', phone: '11965432109', address: 'Rua Augusta, 456', neighborhood: 'Consolação', notes: '' },
    { id: 'c4', name: 'Roberto Lima', phone: '11954321098', address: 'Rua Vergueiro, 712', neighborhood: 'Aclimação', notes: 'Cliente recorrente.' },
  ],
  services: [
    { id: 's1', clientId: 'c1', category: 'Elétrica', description: 'Instalação de ventilador de teto', date: today, time: '14:00', address: 'Rua das Flores, 120', value: 180, notes: 'Levar escada.', status: 'confirmado' },
    { id: 's2', clientId: 'c2', category: 'Elétrica', description: 'Troca de tomadas (6 unidades)', date: addDays(1), time: '09:00', address: 'Av. Paulista, 900', value: 240, notes: '', status: 'solicitado' },
    { id: 's3', clientId: 'c3', category: 'Instalação', description: 'Instalação de chuveiro elétrico', date: addDays(2), time: '15:30', address: 'Rua Augusta, 456', value: 150, notes: 'Confirmar voltagem.', status: 'confirmado' },
    { id: 's4', clientId: 'c4', category: 'Manutenção', description: 'Manutenção elétrica geral', date: addDays(-2), time: '10:00', address: 'Rua Vergueiro, 712', value: 420, notes: '', status: 'concluído' },
    { id: 's5', clientId: 'c1', category: 'Elétrica', description: 'Revisão do quadro elétrico', date: addDays(-12), time: '11:00', address: 'Rua das Flores, 120', value: 320, notes: '', status: 'concluído' },
  ],
  movements: [
    { id: 'm1', description: 'Manutenção elétrica - Roberto', type: 'receita', value: 420, date: addDays(-2), status: 'recebido', payment: 'Pix' },
    { id: 'm2', description: 'Revisão do quadro - Maria', type: 'receita', value: 320, date: addDays(-12), status: 'recebido', payment: 'Cartão' },
    { id: 'm3', description: 'Materiais elétricos', type: 'despesa', value: 138.5, date: addDays(-5), status: 'recebido', payment: 'Dinheiro' },
    { id: 'm4', description: 'Instalação de ventilador - Maria', type: 'receita', value: 180, date: today, status: 'pendente', payment: 'Pix' },
    { id: 'm5', description: 'Combustível', type: 'despesa', value: 90, date: addDays(-1), status: 'recebido', payment: 'Cartão' },
  ],
};
const storageKey = 'faztudo-provider-demo-v1';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const whatsappUrl = (phone: string, message = 'Olá! Estou entrando em contato sobre seu serviço no FazTudo+.') =>
  `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

function useProviderData() {
  const [data, setData] = useState<DemoData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialData;
    } catch { return initialData; }
  });
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(data)), [data]);
  return [data, setData] as const;
}

const statusStyle: Record<string, string> = {
  recebido: 'bg-green-100 text-green-700', concluído: 'bg-green-100 text-green-700',
  confirmado: 'bg-blue-100 text-blue-700', 'em andamento': 'bg-amber-100 text-amber-800',
  solicitado: 'bg-orange-100 text-orange-700', pendente: 'bg-orange-100 text-orange-700',
  atrasado: 'bg-red-100 text-red-700', cancelado: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }: { status: string }) {
  return <Badge className={`border-0 font-medium capitalize ${statusStyle[status] || 'bg-muted'}`}>{status}</Badge>;
}

function Modal({ title, description, open, onClose, children, wide = false }: {
  title: string; description?: string; open: boolean; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-card shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-card px-6 py-5">
          <div><h2 className="text-xl font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

function ProviderShell({ section, available, onAvailability, children }: {
  section: Section; available: boolean; onAvailability: (value: boolean) => void; children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard, to: '/dashboard' },
    { id: 'clientes', label: 'Clientes', icon: Users, to: '/dashboard/clientes' },
    { id: 'financas', label: 'Finanças', icon: WalletCards, to: '/dashboard/financas' },
    { id: 'servicos', label: 'Agenda e serviços', icon: CalendarDays, to: '/dashboard/servicos' },
  ] as const;
  const sidebar = (
    <aside className="flex h-full flex-col bg-[#313131] text-white">
      <Link to="/" className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Wrench className="h-5 w-5" /></span>
        <span className="text-xl font-semibold">FazTudo+</span>
      </Link>
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação do prestador">
        {nav.map(({ id, label, icon: Icon, to }) => (
          <Link key={id} to={to} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${section === id ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link to="/perfil/editar" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">CS</span>
          <span className="min-w-0"><span className="block truncate text-sm font-medium">Carlos Silva</span><span className="text-xs text-white/55">Editar perfil</span></span>
        </Link>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" /><div className="relative h-full w-72">{sidebar}</div></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button>
            <div><p className="text-xs text-muted-foreground">Painel do prestador</p><p className="font-semibold">{nav.find(item => item.id === section)?.label}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm sm:flex ${available ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'}`}>
              <span className={`h-2 w-2 rounded-full ${available ? 'bg-green-500' : 'bg-slate-400'}`} />{available ? 'Disponível' : 'Indisponível'}
              <Switch checked={available} onCheckedChange={onAvailability} aria-label="Alterar disponibilidade" />
            </div>
            <Link to="/chat/1"><Button variant="ghost" size="icon" aria-label="Mensagens"><MessageCircle className="h-5 w-5" /></Button></Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function PageHeading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-1 text-sm font-medium text-secondary">{eyebrow}</p><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>{action}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, detail, tone = 'secondary' }: { label: string; value: string; icon: typeof Home; detail: string; tone?: 'secondary' | 'green' | 'red' | 'blue' }) {
  const tones = { secondary: 'bg-secondary/15 text-secondary', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-600', blue: 'bg-blue-100 text-blue-700' };
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className={`rounded-xl p-3 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></div></Card>;
}

function Dashboard({ data, goTo }: { data: DemoData; goTo: (section: string) => void }) {
  const received = data.movements.filter(m => m.type === 'receita' && m.status === 'recebido').reduce((sum, m) => sum + m.value, 0);
  const expenses = data.movements.filter(m => m.type === 'despesa' && m.status !== 'cancelado').reduce((sum, m) => sum + m.value, 0);
  const pending = data.movements.filter(m => m.type === 'receita' && ['pendente', 'atrasado'].includes(m.status)).reduce((sum, m) => sum + m.value, 0);
  const upcoming = data.services.filter(s => s.date >= today && s.status !== 'cancelado').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4);
  const chart = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return { month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), ganhos: data.movements.filter(m => m.date.startsWith(key) && m.type === 'receita' && m.status === 'recebido').reduce((s, m) => s + m.value, 0) };
  });
  const recent = [...data.movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return <>
    <PageHeading eyebrow="VISÃO GERAL" title="Olá, Carlos!" text="Acompanhe seu negócio e organize o dia em um só lugar." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Ganhos recebidos" value={currency(received)} icon={TrendingUp} detail="movimentações recebidas" tone="green" />
      <MetricCard label="A receber" value={currency(pending)} icon={Clock3} detail="pendentes e atrasados" />
      <MetricCard label="Despesas" value={currency(expenses)} icon={ArrowDownRight} detail="controle manual" tone="red" />
      <MetricCard label="Serviços" value={String(data.services.length)} icon={BriefcaseBusiness} detail={`${data.services.filter(s => s.status === 'concluído').length} concluídos`} tone="blue" />
      <MetricCard label="Clientes" value={String(data.clients.length)} icon={Users} detail="na sua carteira" />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Ganhos nos últimos 6 meses</h2><p className="text-sm text-muted-foreground">Somente receitas recebidas</p></div><BarChart3 className="h-5 w-5 text-secondary" /></div>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8a836" stopOpacity={0.35}/><stop offset="95%" stopColor="#e8a836" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={44}/><Tooltip formatter={(v: number) => currency(v)}/><Area type="monotone" dataKey="ganhos" stroke="#e8a836" strokeWidth={3} fill="url(#earnings)"/></AreaChart></ResponsiveContainer></div>
      </Card>
      <Card className="p-5 sm:p-6"><h2 className="font-semibold">Atalhos</h2><p className="mb-4 text-sm text-muted-foreground">Ações frequentes</p><div className="grid grid-cols-2 gap-3">
        {[['Novo serviço', CalendarDays, 'servicos'], ['Novo cliente', UserRound, 'clientes'], ['Movimentação', WalletCards, 'financas'], ['Ver agenda', Clock3, 'servicos']].map(([label, Icon, target]) => <button key={label as string} onClick={() => goTo(target as string)} className="flex min-h-24 flex-col items-start justify-between rounded-xl border bg-muted/30 p-4 text-left transition hover:border-secondary hover:bg-secondary/5"><Icon className="h-5 w-5 text-secondary"/><span className="text-sm font-medium">{label as string}</span></button>)}
      </div></Card>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">Próximos serviços</h2><p className="text-sm text-muted-foreground">Compromissos confirmados e solicitados</p></div><Button variant="ghost" size="sm" onClick={() => goTo('servicos')}>Ver agenda <ChevronRight className="h-4 w-4"/></Button></div>
        <div className="divide-y">{upcoming.length ? upcoming.map(s => { const client = data.clients.find(c => c.id === s.clientId); return <div key={s.id} className="flex items-center gap-4 p-5"><div className="min-w-14 rounded-xl bg-secondary/10 p-2 text-center"><span className="block text-xs text-muted-foreground">{formatDate(s.date).slice(3, 5)}</span><strong>{formatDate(s.date).slice(0, 2)}</strong></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{s.description}</p><p className="truncate text-sm text-muted-foreground">{client?.name} • {s.time}</p></div><StatusBadge status={s.status}/></div> }) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhum serviço próximo.</p>}</div>
      </Card>
      <Card className="overflow-hidden"><div className="border-b p-5"><h2 className="font-semibold">Atividades recentes</h2><p className="text-sm text-muted-foreground">Últimas movimentações registradas</p></div><div className="divide-y">{recent.map(m => <div key={m.id} className="flex items-center gap-4 p-5"><span className={`rounded-full p-2 ${m.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{m.type === 'receita' ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4"/>}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{m.description}</p><p className="text-xs text-muted-foreground">{formatDate(m.date)} • {m.payment}</p></div><strong className={m.type === 'receita' ? 'text-green-700' : 'text-red-600'}>{m.type === 'receita' ? '+' : '-'} {currency(m.value)}</strong></div>)}</div>
      </Card>
    </div>
  </>;
}

const emptyClient: Client = { id: '', name: '', phone: '', address: '', neighborhood: '', notes: '' };
function ClientsPage({ data, setData, notify }: { data: DemoData; setData: (fn: (data: DemoData) => DemoData) => void; notify: (message: string, error?: boolean) => void }) {
  const [search, setSearch] = useState(''); const [neighborhood, setNeighborhood] = useState('todos');
  const [modal, setModal] = useState<'form' | 'details' | 'delete' | null>(null); const [draft, setDraft] = useState<Client>(emptyClient);
  const neighborhoods = [...new Set(data.clients.map(c => c.neighborhood))];
  const filtered = data.clients.filter(c => `${c.name} ${c.phone} ${c.address}`.toLowerCase().includes(search.toLowerCase()) && (neighborhood === 'todos' || c.neighborhood === neighborhood));
  const clientServices = data.services.filter(s => s.clientId === draft.id);
  const total = clientServices.filter(s => s.status === 'concluído').reduce((sum, s) => sum + s.value, 0);
  const openForm = (client?: Client) => { setDraft(client || emptyClient); setModal('form'); };
  const save = (e: FormEvent) => { e.preventDefault(); if (!draft.name.trim() || draft.phone.replace(/\D/g, '').length < 10 || !draft.address.trim() || !draft.neighborhood.trim()) return notify('Preencha nome, telefone válido, endereço e bairro.', true); setData(d => ({ ...d, clients: draft.id ? d.clients.map(c => c.id === draft.id ? draft : c) : [...d.clients, { ...draft, id: uid() }] })); setModal(null); notify(draft.id ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.'); };
  const remove = () => { setData(d => ({ ...d, clients: d.clients.filter(c => c.id !== draft.id), services: d.services.filter(s => s.clientId !== draft.id) })); setModal(null); notify('Cliente e seus serviços demonstrativos foram excluídos.'); };
  return <>
    <PageHeading eyebrow="RELACIONAMENTO" title="Clientes" text={`${data.clients.length} clientes cadastrados na sua carteira.`} action={<Button variant="secondary" onClick={() => openForm()}><Plus className="h-4 w-4"/> Novo cliente</Button>} />
    <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou endereço" className="pl-9"/></div><select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-10 rounded-md border bg-input-background px-3 text-sm"><option value="todos">Todos os bairros</option>{neighborhoods.map(n => <option key={n}>{n}</option>)}</select></Card>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(c => { const history = data.services.filter(s => s.clientId === c.id); const generated = history.filter(s => s.status === 'concluído').reduce((sum, s) => sum + s.value, 0); return <Card key={c.id} className="p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary/15 font-semibold text-secondary">{c.name.split(' ').map(n => n[0]).slice(0,2).join('')}</span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{c.name}</h3><p className="text-sm text-muted-foreground">{c.phone}</p></div><button onClick={() => { setDraft(c); setModal('details'); }} aria-label={`Detalhes de ${c.name}`}><MoreHorizontal className="h-5 w-5 text-muted-foreground"/></button></div><div className="mt-4 space-y-2 text-sm"><p className="truncate">{c.address}</p><p className="text-muted-foreground">{c.neighborhood}</p></div><div className="my-4 grid grid-cols-2 rounded-xl bg-muted/60 p-3 text-sm"><div><span className="block text-xs text-muted-foreground">Serviços</span><strong>{history.length}</strong></div><div><span className="block text-xs text-muted-foreground">Valor gerado</span><strong>{currency(generated)}</strong></div></div><div className="flex gap-2"><a className="flex-1" href={whatsappUrl(c.phone)} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full"><MessageCircle className="h-4 w-4"/> WhatsApp</Button></a><Button variant="ghost" size="icon" onClick={() => openForm(c)} aria-label="Editar"><Edit3 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => { setDraft(c); setModal('delete'); }} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive"/></Button></div></Card>})}</div> : <EmptyState title="Nenhum cliente encontrado" text="Ajuste os filtros ou cadastre seu primeiro cliente."/>}
    <Modal title={draft.id ? 'Editar cliente' : 'Novo cliente'} open={modal === 'form'} onClose={() => setModal(null)}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><Field label="Nome" required><Input value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} placeholder="Nome completo"/></Field><Field label="Telefone" required><Input value={draft.phone} onChange={e => setDraft({...draft,phone:e.target.value})} placeholder="(11) 99999-9999"/></Field><div className="sm:col-span-2"><Field label="Endereço" required><Input value={draft.address} onChange={e => setDraft({...draft,address:e.target.value})} placeholder="Rua, número e complemento"/></Field></div><Field label="Bairro" required><Input value={draft.neighborhood} onChange={e => setDraft({...draft,neighborhood:e.target.value})}/></Field><div className="sm:col-span-2"><Field label="Observações"><Textarea value={draft.notes} onChange={e => setDraft({...draft,notes:e.target.value})} /></Field></div><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit" variant="secondary">Salvar cliente</Button></div></form></Modal>
    <Modal title={draft.name} description={`${draft.neighborhood} • ${draft.phone}`} open={modal === 'details'} onClose={() => setModal(null)} wide><div className="grid gap-4 sm:grid-cols-3"><Card className="p-4"><p className="text-xs text-muted-foreground">Serviços</p><strong className="text-xl">{clientServices.length}</strong></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Concluídos</p><strong className="text-xl">{clientServices.filter(s=>s.status==='concluído').length}</strong></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Valor total gerado</p><strong className="text-xl">{currency(total)}</strong></Card></div><div className="mt-5"><h3 className="mb-3 font-semibold">Histórico de serviços</h3>{clientServices.length ? <div className="divide-y rounded-xl border">{clientServices.map(s => <div key={s.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{s.description}</p><p className="text-sm text-muted-foreground">{formatDate(s.date)} • {currency(s.value)}</p></div><StatusBadge status={s.status}/></div>)}</div> : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Ainda não há serviços para este cliente.</p>}</div>{draft.notes && <p className="mt-4 text-sm"><strong>Observações:</strong> {draft.notes}</p>}</Modal>
    <Modal title="Excluir cliente?" description="Esta ação também remove o histórico demonstrativo de serviços deste cliente." open={modal === 'delete'} onClose={() => setModal(null)}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Manter cliente</Button><Button variant="destructive" onClick={remove}>Excluir definitivamente</Button></div></Modal>
  </>;
}

const emptyMovement: Movement = { id: '', description: '', type: 'receita', value: 0, date: today, status: 'pendente', payment: 'Pix' };
function FinancePage({ data, setData, notify }: { data: DemoData; setData: (fn: (data: DemoData) => DemoData) => void; notify: (message: string, error?: boolean) => void }) {
  const [filters, setFilters] = useState({ period: 'todos', type: 'todos', status: 'todos' }); const [draft, setDraft] = useState<Movement>(emptyMovement); const [modal, setModal] = useState<'form'|'delete'|null>(null);
  const cutoff = new Date(); if (filters.period !== 'todos') cutoff.setDate(cutoff.getDate() - Number(filters.period));
  const filtered = data.movements.filter(m => (filters.period === 'todos' || new Date(`${m.date}T12:00:00`) >= cutoff) && (filters.type === 'todos' || m.type === filters.type) && (filters.status === 'todos' || m.status === filters.status)).sort((a,b)=>b.date.localeCompare(a.date));
  const income = data.movements.filter(m => m.type==='receita' && m.status==='recebido').reduce((s,m)=>s+m.value,0); const expenses = data.movements.filter(m=>m.type==='despesa'&&m.status!=='cancelado').reduce((s,m)=>s+m.value,0); const pending = data.movements.filter(m=>m.type==='receita'&&['pendente','atrasado'].includes(m.status)).reduce((s,m)=>s+m.value,0);
  const chart = Array.from({length:6},(_,i)=>{const date=new Date();date.setMonth(date.getMonth()-(5-i));const key=date.toISOString().slice(0,7);const rows=data.movements.filter(m=>m.date.startsWith(key)&&m.status!=='cancelado');return {month:date.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),receitas:rows.filter(m=>m.type==='receita'&&m.status==='recebido').reduce((s,m)=>s+m.value,0),despesas:rows.filter(m=>m.type==='despesa').reduce((s,m)=>s+m.value,0)}}); 
  const save=(e:FormEvent)=>{e.preventDefault();if(!draft.description.trim()||draft.value<=0||!draft.date)return notify('Preencha descrição, data e um valor maior que zero.',true);setData(d=>({...d,movements:draft.id?d.movements.map(m=>m.id===draft.id?draft:m):[...d.movements,{...draft,id:uid()}]}));setModal(null);notify(draft.id?'Movimentação atualizada.':'Movimentação cadastrada.');}; const remove=()=>{setData(d=>({...d,movements:d.movements.filter(m=>m.id!==draft.id)}));setModal(null);notify('Movimentação excluída.');};
  return <>
    <PageHeading eyebrow="CONTROLE MANUAL" title="Finanças" text="Registre e acompanhe seu fluxo financeiro. Nenhum pagamento é processado pelo FazTudo+." action={<Button variant="secondary" onClick={()=>{setDraft(emptyMovement);setModal('form')}}><Plus className="h-4 w-4"/> Nova movimentação</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Receitas recebidas" value={currency(income)} icon={ArrowUpRight} detail="total registrado" tone="green"/><MetricCard label="Despesas" value={currency(expenses)} icon={ArrowDownRight} detail="não canceladas" tone="red"/><MetricCard label="Pendências" value={currency(pending)} icon={Clock3} detail="pendentes e atrasadas"/><MetricCard label="Lucro estimado" value={currency(income-expenses)} icon={CircleDollarSign} detail="receitas menos despesas" tone="blue"/></div>
    <Card className="mt-6 p-5 sm:p-6"><div className="mb-4"><h2 className="font-semibold">Receitas e despesas</h2><p className="text-sm text-muted-foreground">Últimos seis meses</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={(v:number)=>currency(v)}/><Bar dataKey="receitas" fill="#2d9f5e" radius={[6,6,0,0]}/><Bar dataKey="despesas" fill="#d4183d" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="mt-2 flex justify-center gap-5 text-xs"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-green-600"/>Receitas</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-red-600"/>Despesas</span></div></Card>
    <Card className="mt-6 overflow-hidden"><div className="grid gap-3 border-b p-4 sm:grid-cols-3"><select className="h-10 rounded-md border bg-input-background px-3 text-sm" value={filters.period} onChange={e=>setFilters({...filters,period:e.target.value})}><option value="todos">Todo o período</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select><select className="h-10 rounded-md border bg-input-background px-3 text-sm" value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}><option value="todos">Receitas e despesas</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select><select className="h-10 rounded-md border bg-input-background px-3 text-sm" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="todos">Todos os status</option>{['recebido','pendente','atrasado','cancelado'].map(s=><option key={s}>{s}</option>)}</select></div>
      {filtered.length?<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-4 font-medium">Descrição</th><th className="p-4 font-medium">Data</th><th className="p-4 font-medium">Tipo</th><th className="p-4 font-medium">Pagamento</th><th className="p-4 font-medium">Status</th><th className="p-4 text-right font-medium">Valor</th><th className="p-4"/></tr></thead><tbody className="divide-y">{filtered.map(m=><tr key={m.id} className="hover:bg-muted/20"><td className="p-4 font-medium">{m.description}</td><td className="p-4">{formatDate(m.date)}</td><td className="p-4 capitalize">{m.type}</td><td className="p-4">{m.payment}</td><td className="p-4"><StatusBadge status={m.status}/></td><td className={`p-4 text-right font-semibold ${m.type==='receita'?'text-green-700':'text-red-600'}`}>{m.type==='receita'?'+':'-'} {currency(m.value)}</td><td className="p-4"><div className="flex justify-end"><Button variant="ghost" size="icon" onClick={()=>{setDraft(m);setModal('form')}}><Edit3 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={()=>{setDraft(m);setModal('delete')}}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></td></tr>)}</tbody></table></div>:<div className="p-6"><EmptyState title="Nenhuma movimentação" text="Não há registros para os filtros selecionados."/></div>}</Card>
    <Modal title={draft.id?'Editar movimentação':'Nova movimentação'} open={modal==='form'} onClose={()=>setModal(null)}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Descrição" required><Input value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field></div><Field label="Tipo"><select className="h-10 w-full rounded-md border bg-input-background px-3" value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as Movement['type']})}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></Field><Field label="Valor" required><Input type="number" min="0.01" step="0.01" value={draft.value||''} onChange={e=>setDraft({...draft,value:Number(e.target.value)})}/></Field><Field label="Data" required><Input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></Field><Field label="Status"><select className="h-10 w-full rounded-md border bg-input-background px-3 capitalize" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as FinanceStatus})}>{['recebido','pendente','atrasado','cancelado'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Forma de pagamento"><select className="h-10 w-full rounded-md border bg-input-background px-3" value={draft.payment} onChange={e=>setDraft({...draft,payment:e.target.value as Movement['payment']})}>{['Pix','Dinheiro','Cartão','Transferência','Outro'].map(p=><option key={p}>{p}</option>)}</select></Field><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={()=>setModal(null)}>Cancelar</Button><Button type="submit" variant="secondary">Salvar</Button></div></form></Modal>
    <Modal title="Excluir movimentação?" description="Os indicadores financeiros serão atualizados automaticamente." open={modal==='delete'} onClose={()=>setModal(null)}><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setModal(null)}>Cancelar</Button><Button variant="destructive" onClick={remove}>Excluir</Button></div></Modal>
  </>;
}

const emptyService: Service = { id:'',clientId:'',category:'',description:'',date:today,time:'09:00',address:'',value:0,notes:'',status:'solicitado' };
function ServicesPage({data,setData,notify}:{data:DemoData;setData:(fn:(data:DemoData)=>DemoData)=>void;notify:(message:string,error?:boolean)=>void}) {
  const [search,setSearch]=useState('');const [status,setStatus]=useState('todos');const [period,setPeriod]=useState('proximos');const [draft,setDraft]=useState<Service>(emptyService);const [modal,setModal]=useState<'form'|'delete'|null>(null);
  const filtered=data.services.filter(s=>{const client=data.clients.find(c=>c.id===s.clientId);return `${s.description} ${s.category} ${client?.name}`.toLowerCase().includes(search.toLowerCase())&&(status==='todos'||s.status===status)&&(period==='todos'||(period==='hoje'?s.date===today:period==='proximos'?s.date>=today:s.date<today))}).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const todayServices=data.services.filter(s=>s.date===today&&s.status!=='cancelado');
  const save=(e:FormEvent)=>{e.preventDefault();if(!draft.clientId||!draft.category.trim()||!draft.description.trim()||!draft.date||!draft.time||!draft.address.trim()||draft.value<=0)return notify('Preencha todos os campos obrigatórios e um valor válido.',true);setData(d=>({...d,services:draft.id?d.services.map(s=>s.id===draft.id?draft:s):[...d.services,{...draft,id:uid()}]}));setModal(null);notify(draft.id?'Serviço atualizado.':'Serviço agendado.');};const remove=()=>{setData(d=>({...d,services:d.services.filter(s=>s.id!==draft.id)}));setModal(null);notify('Serviço excluído.');}; const updateStatus=(service:Service,next:ServiceStatus)=>{setData(d=>({...d,services:d.services.map(s=>s.id===service.id?{...s,status:next}:s)}));notify(`Serviço marcado como ${next}.`)};
  return <>
    <PageHeading eyebrow="OPERAÇÃO" title="Agenda e serviços" text={`${todayServices.length} serviço${todayServices.length===1?'':'s'} para hoje.`} action={<Button variant="secondary" onClick={()=>{setDraft({...emptyService,clientId:data.clients[0]?.id||''});setModal('form')}} disabled={!data.clients.length}><Plus className="h-4 w-4"/> Novo serviço</Button>}/>
    {!data.clients.length&&<Card className="mb-5 border-orange-200 bg-orange-50 p-4 text-sm text-orange-800"><AlertTriangle className="mr-2 inline h-4 w-4"/>Cadastre um cliente antes de criar um serviço.</Card>}
    {todayServices.length>0&&<div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{todayServices.map(s=>{const client=data.clients.find(c=>c.id===s.clientId);return <Card key={s.id} className="border-l-4 border-l-secondary p-4"><div className="flex justify-between"><span className="text-sm font-semibold text-secondary">{s.time}</span><StatusBadge status={s.status}/></div><h3 className="mt-3 font-semibold">{s.description}</h3><p className="text-sm text-muted-foreground">{client?.name}</p></Card>})}</div>}
    <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar serviço, cliente ou categoria" className="pl-9"/></div><select value={period} onChange={e=>setPeriod(e.target.value)} className="h-10 rounded-md border bg-input-background px-3 text-sm"><option value="proximos">Próximos</option><option value="hoje">Hoje</option><option value="passados">Passados</option><option value="todos">Todas as datas</option></select><select value={status} onChange={e=>setStatus(e.target.value)} className="h-10 rounded-md border bg-input-background px-3 text-sm capitalize"><option value="todos">Todos os status</option>{['solicitado','confirmado','em andamento','concluído','cancelado'].map(s=><option key={s}>{s}</option>)}</select></Card>
    {filtered.length?<div className="space-y-3">{filtered.map(s=>{const client=data.clients.find(c=>c.id===s.clientId);return <Card key={s.id} className="p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="flex min-w-32 items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/10 text-secondary"><CalendarDays className="h-5 w-5"/></span><div><strong className="block">{formatDate(s.date)}</strong><span className="text-sm text-muted-foreground">{s.time}</span></div></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{s.description}</h3><StatusBadge status={s.status}/></div><p className="mt-1 text-sm text-muted-foreground">{client?.name} • {s.category} • {s.address}</p></div><strong className="text-lg">{currency(s.value)}</strong><div className="flex flex-wrap gap-2">{s.status==='solicitado'&&<Button size="sm" variant="secondary" onClick={()=>updateStatus(s,'confirmado')}><Check className="h-4 w-4"/> Confirmar</Button>}{s.status==='confirmado'&&<Button size="sm" variant="secondary" onClick={()=>updateStatus(s,'em andamento')}><Clock3 className="h-4 w-4"/> Iniciar</Button>}{s.status==='em andamento'&&<Button size="sm" variant="success" onClick={()=>updateStatus(s,'concluído')}><CheckCircle2 className="h-4 w-4"/> Concluir</Button>}{!['concluído','cancelado'].includes(s.status)&&<Button size="sm" variant="outline" onClick={()=>updateStatus(s,'cancelado')}>Cancelar</Button>}{client&&<a href={whatsappUrl(client.phone,`Olá, ${client.name}! Sobre o serviço "${s.description}" agendado para ${formatDate(s.date)} às ${s.time}:`)} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><MessageCircle className="h-4 w-4"/></Button></a>}<Button size="sm" variant="ghost" onClick={()=>{setDraft(s);setModal('form')}}><Edit3 className="h-4 w-4"/></Button><Button size="sm" variant="ghost" onClick={()=>{setDraft(s);setModal('delete')}}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></div></Card>})}</div>:<EmptyState title="Nenhum serviço encontrado" text="Ajuste os filtros ou cadastre um novo serviço."/>}
    <Modal title={draft.id?'Editar serviço':'Novo serviço'} open={modal==='form'} onClose={()=>setModal(null)} wide><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><Field label="Cliente" required><select className="h-10 w-full rounded-md border bg-input-background px-3" value={draft.clientId} onChange={e=>{const client=data.clients.find(c=>c.id===e.target.value);setDraft({...draft,clientId:e.target.value,address:client?.address||draft.address})}}><option value="">Selecione</option>{data.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Categoria" required><Input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} placeholder="Ex.: Elétrica"/></Field><div className="sm:col-span-2"><Field label="Descrição" required><Input value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field></div><Field label="Data" required><Input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></Field><Field label="Horário" required><Input type="time" value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></Field><div className="sm:col-span-2"><Field label="Endereço" required><Input value={draft.address} onChange={e=>setDraft({...draft,address:e.target.value})}/></Field></div><Field label="Valor" required><Input type="number" min="0.01" step="0.01" value={draft.value||''} onChange={e=>setDraft({...draft,value:Number(e.target.value)})}/></Field><Field label="Status"><select className="h-10 w-full rounded-md border bg-input-background px-3 capitalize" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as ServiceStatus})}>{['solicitado','confirmado','em andamento','concluído','cancelado'].map(s=><option key={s}>{s}</option>)}</select></Field><div className="sm:col-span-2"><Field label="Observações"><Textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></Field></div><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={()=>setModal(null)}>Cancelar</Button><Button type="submit" variant="secondary">Salvar serviço</Button></div></form></Modal>
    <Modal title="Excluir serviço?" description="Esta ação removerá o serviço da agenda demonstrativa." open={modal==='delete'} onClose={()=>setModal(null)}><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setModal(null)}>Cancelar</Button><Button variant="destructive" onClick={remove}>Excluir</Button></div></Modal>
  </>;
}

export default function ProviderDashboard() {
  const params=useParams(); const navigate=useNavigate(); const section=(['clientes','financas','servicos'].includes(params.section||'')?params.section:'dashboard') as Section;
  const [data,setDataState]=useProviderData(); const [notice,setNotice]=useState<{message:string;error:boolean}|null>(null);
  const setData=(fn:(data:DemoData)=>DemoData)=>setDataState(fn); const notify=(message:string,error=false)=>{setNotice({message,error});window.setTimeout(()=>setNotice(null),3500)};
  return <ProviderShell section={section} available={data.available} onAvailability={available=>{setData(d=>({...d,available}));notify(available?'Você está disponível para novos serviços.':'Você está indisponível no momento.')}}>
    {notice&&<div role="status" className={`fixed right-4 top-20 z-[120] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${notice.error?'border-red-200 bg-red-50 text-red-700':'border-green-200 bg-green-50 text-green-700'}`}>{notice.error?<AlertTriangle className="h-5 w-5"/>:<CheckCircle2 className="h-5 w-5"/>}{notice.message}</div>}
    {section==='dashboard'&&<Dashboard data={data} goTo={target=>navigate(`/dashboard/${target}`)}/>}
    {section==='clientes'&&<ClientsPage data={data} setData={setData} notify={notify}/>}
    {section==='financas'&&<FinancePage data={data} setData={setData} notify={notify}/>}
    {section==='servicos'&&<ServicesPage data={data} setData={setData} notify={notify}/>}
  </ProviderShell>;
}
