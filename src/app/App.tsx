import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ClientHome from './pages/ClientHome';
import ProviderProfile from './pages/ProviderProfile';
import Chat from './pages/Chat';
import ProviderDashboard from './pages/ProviderDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import RecuperarSenha from './pages/RecuperarSenha';
import CadastroPrestador from './pages/CadastroPrestador';
import PerfilEditar from './pages/PerfilEditar';
import Urgente from './pages/Urgente';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<ClientHome />} />
        <Route path="/prestador/:id" element={<ProviderProfile />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/dashboard" element={<ProviderDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/cadastro-prestador" element={<CadastroPrestador />} />
        <Route path="/perfil/editar" element={<PerfilEditar />} />
        <Route path="/urgente" element={<Urgente />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}