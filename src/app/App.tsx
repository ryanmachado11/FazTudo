import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './hooks/useAuth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ClientHome = lazy(() => import('./pages/ClientHome'));
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'));
const Chat = lazy(() => import('./pages/Chat'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Termos = lazy(() => import('./pages/Termos'));
const Privacidade = lazy(() => import('./pages/Privacidade'));
const RecuperarSenha = lazy(() => import('./pages/RecuperarSenha'));
const CadastroPrestador = lazy(() => import('./pages/CadastroPrestador'));
const PerfilEditar = lazy(() => import('./pages/PerfilEditar'));
const Urgente = lazy(() => import('./pages/Urgente'));
const ClientServices = lazy(() => import('./pages/ClientServices'));
const Messages = lazy(() => import('./pages/Messages'));

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}

function roleHome(role: string) {
  return role === 'PROVIDER' ? '/dashboard' : '/home';
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="max-w-xl rounded-3xl border bg-card p-10 text-center shadow-lg shadow-black/5">
        <h1 className="text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-4 text-muted-foreground">Esta rota não existe ou ainda não foi implementada.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Voltar para a home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<RequireRole roles={['CLIENT', 'PROVIDER']}><ClientHome /></RequireRole>} />
          <Route path="/prestador/:id" element={<ProviderProfile />} />
          <Route path="/chat/servico/:serviceRequestId" element={<RequireRole roles={['CLIENT', 'PROVIDER']}><Chat /></RequireRole>} />
          <Route path="/chat/:id" element={<RequireRole roles={['CLIENT', 'PROVIDER']}><Chat /></RequireRole>} />
          <Route path="/dashboard" element={<RequireRole roles={['PROVIDER']}><ProviderDashboard /></RequireRole>} />
          <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
          <Route path="/cadastro" element={<RequireGuest><Signup /></RequireGuest>} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/cadastro-prestador" element={<RequireGuest><CadastroPrestador /></RequireGuest>} />
          <Route path="/perfil/editar" element={<RequireRole roles={['PROVIDER']}><PerfilEditar /></RequireRole>} />
          <Route path="/urgente" element={<RequireRole roles={['CLIENT']}><Urgente /></RequireRole>} />
          <Route path="/servicos" element={<RequireRole roles={['CLIENT']}><ClientServices /></RequireRole>} />
          <Route path="/mensagens" element={<RequireRole roles={['CLIENT', 'PROVIDER']}><Messages /></RequireRole>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}
