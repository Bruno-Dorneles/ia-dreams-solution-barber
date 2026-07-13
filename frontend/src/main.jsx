import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Eye,
  EyeOff,
  Mail,
  Home,
  Lock,
  Maximize2,
  Minimize2,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Scissors,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Store,
  Tag,
  Trash2,
  UserCog,
  UserRound,
  Users,
  Wallet,
  LogOut,
  UserPlus,
  WalletCards,
} from 'lucide-react';
import barberproLoginHero from './assets/barberpro-login-hero.png';
import barberproRegisterHero from './assets/barberpro-register-hero.png';
import './styles.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});
let activeBarbershopId = null;

api.interceptors.request.use((config) => {
  if (!activeBarbershopId) {
    return config;
  }

  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = {
      ...(config.params || {}),
      barbershopId: activeBarbershopId,
    };
    return config;
  }

  if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
    config.data = {
      ...config.data,
      barbershopId: config.data.barbershopId || activeBarbershopId,
    };
  }

  return config;
});

const savedSessionKey = 'solution-barber-session';
const temporarySessionKey = 'solution-barber-tab-session';

const paymentLabels = {
  cash: 'Dinheiro',
  pix: 'Pix',
  credit_card: 'Credito',
  debit_card: 'Debito',
};

function App() {
  const [session, setSession] = useState(() => loadSavedSession());

  function handleAuthenticated(data, remember) {
    const nextSession = {
      token: data.token,
      user: data.user,
    };
    setSession(nextSession);
    saveSession(nextSession, remember);
  }

  function handleLogout() {
    localStorage.removeItem(savedSessionKey);
    sessionStorage.removeItem(temporarySessionKey);
    setSession(null);
  }

  useEffect(() => {
    if (session?.user && session.user.role !== 'admin' && !session.user.barbershopId) {
      localStorage.removeItem(savedSessionKey);
      sessionStorage.removeItem(temporarySessionKey);
      setSession(null);
    }
  }, [session]);

  if (!session?.user) {
    return <AuthGateway onAuthenticated={handleAuthenticated} />;
  }

  if (session.user.role === 'admin') {
    return <AdminWorkspace onLogout={handleLogout} />;
  }

  return <Workspace session={session} onLogout={handleLogout} />;
}

function AuthGateway({ onAuthenticated }) {
  const [mode, setMode] = useState('login');

  if (mode === 'login') {
    return (
      <LoginScreenV3
        onAuthenticated={onAuthenticated}
        onCreateAccount={() => setMode('register')}
      />
    );
  }

  if (mode === 'register') {
    return (
      <RegisterScreenV2
        onAuthenticated={onAuthenticated}
        onBack={() => setMode('login')}
      />
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark">
          <Scissors size={28} />
        </div>
        <p className="eyebrow">IA Dreams</p>
        <h1>IA Dreams</h1>
        <p className="brand-copy">
          Controle atendimentos, comissões e fechamento da barbearia sem depender
          de caderno.
        </p>
      </section>

      <section className="auth-card">
        {mode === 'login' && (
          <LoginScreen
            onAuthenticated={onAuthenticated}
            onCreateAccount={() => setMode('register')}
          />
        )}

        {mode === 'register' && (
          <RegisterScreenV2
            onAuthenticated={onAuthenticated}
            onBack={() => setMode('login')}
          />
        )}
      </section>
    </main>
  );
}

function LoginScreenV3({ onAuthenticated, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.error) {
        setError('E-mail ou senha invalidos. Tente novamente.');
        return;
      }

      onAuthenticated(response.data, remember);
    } catch {
      setError('Nao foi possivel entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050506] px-4 py-4 text-ia-text antialiased sm:px-6 lg:p-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-[1560px] overflow-hidden rounded-[18px] border border-white/15 bg-black shadow-ia lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.72fr_0.88fr]"
      >
        <div className="relative hidden min-h-full overflow-hidden lg:block">
          <img
            src={barberproLoginHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.08)_0%,rgba(0,0,0,.10)_52%,rgba(0,0,0,.70)_86%,rgba(0,0,0,.92)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_59%_40%,rgba(255,255,255,.12),transparent_16%)]" />
          <div className="absolute right-[13%] top-[22%] flex flex-col items-center text-center">
            <BarberProLogoMark size="large" />
            <h1 className="m-0 mt-4 text-[36px] font-semibold leading-none tracking-[-0.03em] text-white">
              BarberPro
            </h1>
            <p className="m-0 mt-4 max-w-[180px] text-[12px] font-normal uppercase leading-[1.55] tracking-[0.18em] text-white/65">
              Gestão completa para barbearias
            </p>
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-32px)] items-center justify-center px-5 py-10 lg:min-h-0 lg:px-8">
          <div className="w-full max-w-[380px] rounded-[20px] border border-white/10 bg-[#08090A]/90 px-6 py-7 shadow-ia backdrop-blur lg:px-7 lg:py-8">
            <div className="mb-7 flex flex-col items-center text-center">
              <BarberProLogoMark />
              <h1 className="m-0 mt-3 text-[34px] font-semibold leading-none tracking-[-0.03em] text-white">
                BarberPro
              </h1>
              <p className="m-0 mt-3 text-[14px] font-normal text-ia-muted">
                Faça login para continuar
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ia-muted">
                  <Mail size={18} strokeWidth={1.8} />
                </span>
                <input
                  className="h-12 w-full rounded-[8px] border border-white/10 bg-[#0D0E10] pl-12 pr-4 text-[14px] font-normal text-white outline-none transition duration-ia placeholder:text-ia-placeholder focus:border-white/70"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ia-muted">
                  <Lock size={18} strokeWidth={1.8} />
                </span>
                <input
                  className="h-12 w-full rounded-[8px] border border-white/10 bg-[#0D0E10] pl-12 pr-12 text-[14px] font-normal text-white outline-none transition duration-ia placeholder:text-ia-placeholder focus:border-white/70"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 flex h-8 w-8 appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 text-ia-muted shadow-none transition duration-ia hover:bg-white/5 hover:text-white"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.8} />
                  ) : (
                    <Eye size={17} strokeWidth={1.8} />
                  )}
                </button>
              </label>

              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-normal text-ia-muted">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border border-white/10 bg-[#0D0E10] text-transparent transition duration-ia peer-checked:border-white peer-checked:bg-white peer-checked:text-black">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  className="appearance-none border-0 bg-transparent p-0 text-[13px] font-normal text-white/80 shadow-none transition duration-ia hover:text-white"
                >
                  Esqueci minha senha
                </button>
              </div>

              {error && (
                <div className="rounded-[8px] border border-ia-error/30 bg-ia-error/10 px-4 py-3 text-[13px] text-white">
                  {error}
                </div>
              )}

              <button
                className="h-[48px] w-full appearance-none rounded-[8px] border-0 bg-white text-[14px] font-medium text-black shadow-none transition duration-ia hover:scale-[1.01] hover:bg-[#F2F2F2] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-4 text-center text-[13px] font-normal text-ia-muted">
              <div className="h-px flex-1 bg-white/5" />
              <span>ou continue com</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-label="Continuar com Google"
                className="flex h-[46px] appearance-none items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-transparent p-0 text-[13px] font-normal text-white/85 shadow-none transition duration-ia hover:bg-white/5"
              >
                <GoogleMark />
                Google
              </button>
              <button
                type="button"
                aria-label="Continuar com Apple"
                className="flex h-[46px] appearance-none items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-transparent p-0 text-[13px] font-normal text-white/85 shadow-none transition duration-ia hover:bg-white/5"
              >
                <AppleMark />
                Apple
              </button>
            </div>

            <div className="mt-9 text-center text-[14px] font-normal text-ia-muted">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onCreateAccount}
                className="appearance-none border-0 bg-transparent p-0 text-white shadow-none transition duration-ia hover:text-ia-muted"
              >
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

function BarberProLogoMark({ size = 'default' }) {
  const boxClass =
    size === 'large'
      ? 'h-14 w-14 rounded-[12px]'
      : size === 'sidebar'
        ? 'h-[52px] w-[52px] rounded-[14px]'
        : 'h-12 w-12 rounded-[10px]';

  return (
    <div
      className={`${boxClass} flex items-center justify-center border border-white/10 bg-white/10 shadow-[0_0_24px_rgba(255,255,255,.14)] backdrop-blur`}
    >
      <svg className="barberpro-logo-glyph" viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M20.5 10.5h15.8c8.2 0 13.3 4.5 13.3 11.5 0 4.3-2.3 7.7-6.1 9.4 4.8 1.6 7.5 5.4 7.5 10.3 0 7.3-5.7 11.8-14.4 11.8H20.5v-43Zm11.8 17.7h3c3 0 4.8-1.7 4.8-4.4 0-2.8-1.8-4.4-4.8-4.4h-3v8.8Zm0 16.9h3.9c3.3 0 5.3-1.8 5.3-4.8 0-2.9-2-4.7-5.3-4.7h-3.9v9.5Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function LoginScreenV2({ onAuthenticated, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.error) {
        setError('E-mail ou senha invalidos. Tente novamente.');
        return;
      }

      onAuthenticated(response.data, remember);
    } catch {
      setError('Nao foi possivel entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ia-bg px-5 py-8 text-ia-text antialiased md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-ia items-center gap-16 lg:grid-cols-[minmax(320px,480px)_minmax(380px,440px)] lg:justify-center"
      >
        <div className="hidden lg:block">
          <div className="relative mb-8 inline-block pb-4">
            <h1 className="m-0 text-[64px] font-semibold leading-[0.78] tracking-[-0.03em] text-white">
              BarberPro
            </h1>
            <p className="absolute right-0 top-[62px] m-0 text-right text-[16px] font-normal uppercase leading-none tracking-[0.18em] text-ia-muted">
              IA Dreams
            </p>
          </div>
          <p className="max-w-[410px] text-[18px] font-normal leading-8 text-ia-muted">
            Controle atendimentos, comissões e fechamento da barbearia sem depender de caderno.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[430px] lg:rounded-iaCard lg:border lg:border-ia-border lg:bg-ia-surface lg:p-8 lg:shadow-ia">
          <div className="mb-14 lg:mb-10">
            <div className="relative mb-8 inline-block pb-4 lg:hidden">
              <h1 className="m-0 text-[48px] font-semibold leading-[0.78] tracking-[-0.03em] text-white">
                BarberPro
              </h1>
              <p className="absolute right-0 top-[45px] m-0 text-right text-[12px] font-normal uppercase leading-none tracking-[0.18em] text-ia-muted">
                IA Dreams
              </p>
            </div>
            <div className="space-y-1">
              <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white lg:text-[36px]">
                Bem-vindo de volta!
              </h2>
              <p className="text-[16px] font-normal text-ia-muted">
                Faça login para continuar
              </p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-3 block text-[14px] font-normal text-white">E-mail</span>
              <input
                className="h-14 w-full rounded-iaInput border border-ia-border bg-ia-card px-4 text-[16px] font-normal text-white outline-none transition duration-ia placeholder:text-ia-placeholder focus:border-white"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-3 block text-[14px] font-normal text-white">Senha</span>
              <div className="relative">
                <input
                  className="h-14 w-full rounded-iaInput border border-ia-border bg-ia-card px-4 pr-12 text-[16px] font-normal text-white outline-none transition duration-ia placeholder:text-ia-placeholder focus:border-white"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 flex h-10 w-10 appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 text-ia-muted shadow-none transition duration-ia hover:bg-white/5 hover:text-white [&_svg]:block"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={2} />
                  ) : (
                    <Eye size={20} strokeWidth={2} />
                  )}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[14px] font-normal text-ia-muted">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border border-ia-border bg-ia-card text-transparent transition duration-ia peer-checked:border-white peer-checked:bg-white peer-checked:text-black">
                  <Check size={12} strokeWidth={3} />
                </span>
                Manter conectado
              </label>
              <button
                type="button"
                className="appearance-none border-0 bg-transparent p-0 text-[14px] font-normal text-white shadow-none transition duration-ia hover:text-ia-muted"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <div className="rounded-iaInput border border-ia-error/30 bg-ia-error/10 px-4 py-3 text-[14px] text-white">
                {error}
              </div>
            )}

            <button
              className="h-[52px] w-full rounded-iaButton bg-white text-[16px] font-medium text-black transition duration-ia hover:scale-[1.02] hover:bg-[#F2F2F2] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="my-10 text-center text-[14px] font-normal text-ia-muted lg:my-8">
            ou continuar com
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              aria-label="Continuar com Google"
              className="flex h-[56px] items-center justify-center rounded-iaButton border border-ia-border bg-transparent transition duration-ia hover:bg-white/5"
            >
              <GoogleMark />
            </button>
            <button
              type="button"
              aria-label="Continuar com Apple"
              className="flex h-[56px] items-center justify-center rounded-iaButton border border-ia-border bg-transparent text-white transition duration-ia hover:bg-white/5"
            >
              <AppleMark />
            </button>
          </div>

          <div className="mt-12 text-center text-[16px] font-normal text-ia-muted lg:mt-8">
            <div className="mb-8 h-px w-full bg-white/10" />
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onCreateAccount}
              className="appearance-none border-0 bg-transparent p-0 text-white shadow-none transition duration-ia hover:text-ia-muted"
            >
              Criar conta
            </button>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

function LoginScreen({ onAuthenticated, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.error) {
        setError('E-mail ou senha inválidos. Tente novamente.');
        return;
      }

      onAuthenticated(response.data, remember);
    } catch {
      setError('Não foi possível entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader
        icon={<Lock size={22} />}
        title="Entrar"
        subtitle="Acesse sua barbearia para registrar atendimentos."
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Manter conectado
        </label>

        {error && <Message tone="error">{error}</Message>}

        <button className="primary-action compact" disabled={loading}>
          <Check size={18} />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="auth-links">
        <button type="button" onClick={onCreateAccount}>
          Criar conta
        </button>
        <span>Recuperação de senha em breve</span>
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 3-4.1 3-7.1Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2H3.1v2.5C4.8 19.7 8.2 22 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H3.1C2.4 9 2 10.5 2 12s.4 3 1.1 4.3l3.2-2.5Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2 8.2 2 4.8 4.3 3.1 7.7l3.2 2.5C7.1 7.8 9.3 6 12 6Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.2 13.1c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 2-1 2.7-2.1.8-1.2 1.1-2.3 1.1-2.4-.1-.1-2.4-1-2.4-3.4ZM15 6.8c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.7-1 1.7-.9 2.6 1 .1 1.9-.5 2.5-1.2Z" />
    </svg>
  );
}

function RegisterScreen({ onAuthenticated, onBack }) {
  const [form, setForm] = useState({
    name: '',
    barbershopName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    partnerCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordIssues = getPasswordIssues(form.password);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (passwordIssues.length > 0) {
      setError('Complete os requisitos da senha antes de criar a conta.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', form);

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      onAuthenticated(response.data, false);
    } catch {
      setError('Não foi possível criar sua conta agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <AuthHeader
        icon={<UserPlus size={22} />}
        title="Criar conta"
        subtitle="Cadastre o comprador e a barbearia para comecar."
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Nome do responsável
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label>
          Nome da barbearia
          <input
            value={form.barbershopName}
            onChange={(event) =>
              setForm({ ...form, barbershopName: event.target.value })
            }
            required
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>

        <label>
          Contato
          <input
            placeholder="WhatsApp"
            value={form.contact}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
            required
          />
        </label>

        <div className="two-columns">
          <label>
            Senha
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </label>

          <label>
            Confirmar senha
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
              required
            />
          </label>
        </div>

        {passwordIssues.length > 0 && (
          <ul className="password-rules">
            {passwordIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}

        <label>
          Código de parceiro/desconto
          <input
            value={form.partnerCode}
            onChange={(event) =>
              setForm({ ...form, partnerCode: event.target.value })
            }
          />
        </label>

        {error && <Message tone="error">{error}</Message>}

        <button className="primary-action compact" disabled={loading}>
          <Check size={18} />
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
    </>
  );
}

function AuthHeader({ icon, title, subtitle }) {
  return (
    <div className="auth-header">
      <div className="auth-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" className="back-button" onClick={onClick}>
      <ArrowLeft size={18} />
      Voltar
    </button>
  );
}

function Message({ tone, children }) {
  return <div className={`message ${tone}`}>{children}</div>;
}

function RegisterScreenV2({ onAuthenticated, onBack }) {
  const [form, setForm] = useState({
    name: '',
    barbershopName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    partnerCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordIssues = getPasswordIssues(form.password);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (passwordIssues.length > 0) {
      setError('Complete os requisitos da senha antes de criar a conta.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        ...form,
        partnerCode: form.partnerCode.trim(),
      });

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      onAuthenticated(response.data, false);
    } catch {
      setError('Não foi possível criar sua conta agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050506] px-4 py-4 text-ia-text antialiased sm:px-6 lg:p-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-[1560px] overflow-hidden rounded-[18px] border border-white/15 bg-black shadow-ia lg:min-h-[calc(100vh-64px)] lg:grid-cols-[0.72fr_1fr]"
      >
        <aside className="relative hidden min-h-full overflow-hidden lg:block">
          <img
            src={barberproRegisterHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.88)_0%,rgba(0,0,0,.68)_48%,rgba(0,0,0,.20)_100%)]" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col px-14 py-6">
            <BarberProWordmark />

            <div className="mt-9 max-w-[430px]">
              <span className="hidden">
                Sua barbearia, no próximo nível.
              </span>
              <h1 className="m-0 text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                Gestão completa para barbearias modernas.
              </h1>
              <p className="m-0 mt-4 max-w-[350px] text-[16px] font-normal leading-7 text-white/72">
                Controle atendimentos, profissionais, financeiro e clientes em um só lugar.
              </p>

              <div className="mt-7 space-y-4">
                <RegisterBenefit icon={<BarChart3 size={24} />} title="Mais controle" text="Tenha visão total do seu negócio." />
                <RegisterBenefit icon={<Users size={24} />} title="Mais clientes" text="Organize e fidelize seus clientes." />
                <RegisterBenefit icon={<CircleDollarSign size={24} />} title="Mais resultados" text="Relatórios inteligentes para crescer." />
              </div>
            </div>

            <p className="m-0 mt-auto text-[13px] text-white/70">
              © 2025 IA Dreams. Todos os direitos reservados.
            </p>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-32px)] items-start justify-center px-5 py-8 lg:min-h-0 lg:items-center lg:px-8 lg:py-4">
          <div className="w-full max-w-[860px]">
            <button
              type="button"
              onClick={onBack}
              className="mb-6 flex h-10 w-10 appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 text-[34px] font-normal leading-none text-white shadow-none transition duration-ia hover:bg-white/5 lg:hidden"
              aria-label="Voltar"
            >
              ‹
            </button>

            <div className="mb-2 hidden items-center justify-end gap-5 text-[13px] text-white/80 lg:flex">
              <span>Já tem uma conta?</span>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 appearance-none items-center gap-3 rounded-[10px] border border-white/12 bg-transparent px-4 text-[13px] font-medium text-white shadow-none transition duration-ia hover:bg-white/5"
              >
                Fazer login
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="mb-10 flex flex-col items-center text-center lg:hidden">
              <BarberProLogoMark size="large" />
              <h1 className="m-0 mt-5 text-[40px] font-semibold leading-none tracking-[-0.03em] text-white">
                BarberPro
              </h1>
              <p className="m-0 mt-2 text-[14px] font-normal uppercase tracking-[0.28em] text-white/60">
                IA Dreams
              </p>
            </div>

            <div className="rounded-none border-0 bg-transparent lg:rounded-[20px] lg:border lg:border-white/10 lg:bg-[#111216]/82 lg:px-6 lg:py-4 lg:shadow-ia lg:backdrop-blur">
              <div className="mb-8 lg:mb-3 lg:text-center">
                <div className="mx-auto mb-2 hidden h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white lg:flex">
                  <UserPlus size={20} strokeWidth={1.8} />
                </div>
                <p className="m-0 mb-3 text-[14px] font-medium uppercase tracking-[0.12em] text-white/60 lg:hidden">
                  Criar conta
                </p>
                <h2 className="m-0 text-[36px] font-semibold leading-tight tracking-[-0.03em] text-white lg:text-[28px]">
                  <span className="lg:hidden">Vamos criar sua conta</span>
                  <span className="hidden lg:inline">Criar conta</span>
                </h2>
                <p className="m-0 mt-3 max-w-[360px] text-[18px] leading-8 text-ia-muted lg:mx-auto lg:mt-1 lg:text-[13px] lg:leading-5">
                  <span className="lg:hidden">Preencha os dados abaixo para começar a usar o BarberPro.</span>
                  <span className="hidden lg:inline">Preencha os dados abaixo para começar.</span>
                </p>
              </div>

              <form className="space-y-4 lg:space-y-3" onSubmit={handleSubmit}>
                <div className="grid gap-4 lg:grid-cols-2 lg:gap-3">
                  <RegisterField
                    icon={<UserRound size={24} />}
                    label="Nome do responsável"
                    placeholder="Digite o nome do responsável"
                    value={form.name}
                    onChange={(value) => setForm({ ...form, name: value })}
                    required
                  />
                  <RegisterField
                    icon={<Store size={24} />}
                    label="Nome da barbearia"
                    placeholder="Digite o nome da barbearia"
                    value={form.barbershopName}
                    onChange={(value) => setForm({ ...form, barbershopName: value })}
                    required
                  />
                  <RegisterField
                    icon={<Mail size={24} />}
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com.br"
                    value={form.email}
                    onChange={(value) => setForm({ ...form, email: value })}
                    required
                  />
                  <RegisterField
                    icon={<Phone size={24} />}
                    label="Contato (WhatsApp)"
                    placeholder="(00) 00000-0000"
                    value={form.contact}
                    onChange={(value) => setForm({ ...form, contact: value })}
                    required
                  />
                  <RegisterPasswordField
                    label="Senha"
                    placeholder="Digite sua senha"
                    value={form.password}
                    visible={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    onChange={(value) => setForm({ ...form, password: value })}
                  />
                  <RegisterPasswordField
                    label="Confirmar senha"
                    placeholder="Digite novamente sua senha"
                    value={form.confirmPassword}
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    onChange={(value) => setForm({ ...form, confirmPassword: value })}
                  />
                </div>

                {passwordIssues.length > 0 && (
                  <div className="rounded-[14px] border border-ia-warning/25 bg-ia-warning/10 px-4 py-3 text-[13px] leading-6 text-white/80">
                    Falta: {passwordIssues.join(', ')}.
                  </div>
                )}

                <RegisterField
                  icon={<Tag size={24} />}
                  label="Código do parceiro"
                  optionalLabel="opcional"
                  placeholder="Digite o código do parceiro"
                  value={form.partnerCode}
                  onChange={(value) => setForm({ ...form, partnerCode: value })}
                  fullWidth
                />

                {error && (
                  <div className="rounded-[14px] border border-ia-error/30 bg-ia-error/10 px-4 py-3 text-[14px] text-white">
                    {error}
                  </div>
                )}

                <button
                  className="mt-6 flex h-[84px] w-full appearance-none items-center justify-center gap-4 rounded-[12px] border-0 bg-white text-[24px] font-semibold text-black shadow-none transition duration-ia hover:scale-[1.01] hover:bg-[#F2F2F2] disabled:cursor-not-allowed disabled:opacity-70 lg:mt-3 lg:h-11 lg:text-[15px]"
                  disabled={loading}
                >
                  <UserPlus size={30} strokeWidth={2} className="lg:h-[22px] lg:w-[22px]" />
                  {loading ? 'Criando...' : 'Criar conta'}
                </button>
              </form>

              <div className="my-8 flex items-center gap-5 text-center text-[16px] uppercase text-ia-muted lg:my-3 lg:text-[12px]">
                <div className="h-px flex-1 bg-white/8" />
                <span>ou</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <button
                type="button"
                className="flex h-[82px] w-full appearance-none items-center justify-center gap-4 rounded-[12px] border border-white/12 bg-transparent p-0 text-[23px] font-semibold text-white shadow-none transition duration-ia hover:bg-white/5 lg:h-11 lg:text-[15px]"
              >
                <GoogleMark />
                Continuar com Google
              </button>

              <p className="m-0 mt-8 text-center text-[17px] text-ia-muted lg:hidden">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={onBack}
                  className="appearance-none border-0 bg-transparent p-0 text-white shadow-none"
                >
                  Fazer login
                </button>
              </p>

              <p className="m-0 mt-3 hidden text-center text-[12px] text-white/55 lg:block [@media(max-height:760px)]:lg:hidden">
                Ao criar uma conta, você concorda com nossos{' '}
                <span className="text-white underline">Termos de Uso</span> e{' '}
                <span className="text-white underline">Política de Privacidade</span>.
              </p>
            </div>
          </div>
        </section>
      </motion.section>
    </main>
  );
}

function BarberProWordmark() {
  return (
    <div className="flex flex-col items-center text-center">
      <BarberProLogoMark />
      <p className="m-0 mt-3 text-[30px] font-semibold leading-none tracking-[-0.03em] text-white">
        BarberPro
      </p>
      <p className="m-0 mt-1 text-[12px] uppercase tracking-[0.28em] text-white/70">
        IA Dreams
      </p>
    </div>
  );
}

function RegisterBenefit({ icon, title, text }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/8 text-white">
        {icon}
      </div>
      <div>
        <p className="m-0 text-[16px] font-semibold text-white">{title}</p>
        <p className="m-0 mt-1 text-[13px] text-white/70">{text}</p>
      </div>
    </div>
  );
}

function RegisterField({
  icon,
  label,
  optionalLabel,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 hidden text-[13px] font-semibold text-white lg:block">
        {label}
        {optionalLabel && <span className="font-normal text-ia-muted"> ({optionalLabel})</span>}
      </span>
      <div className="relative flex min-h-[88px] items-center rounded-[12px] border border-white/12 bg-black/25 transition duration-ia focus-within:border-white/65 lg:min-h-[42px] lg:rounded-[8px]">
        <span className="pointer-events-none absolute left-7 flex text-ia-muted lg:left-4 [&_svg]:h-7 [&_svg]:w-7 lg:[&_svg]:h-[16px] lg:[&_svg]:w-[16px]">
          {icon}
        </span>
        <div className="w-full pl-[86px] pr-5 lg:pl-10">
          <span className="block text-[18px] font-semibold text-white lg:hidden">
            {label}
            {optionalLabel && <span className="font-normal text-ia-muted"> ({optionalLabel})</span>}
          </span>
          <input
            className="mt-2 w-full appearance-none border-0 bg-transparent p-0 text-[20px] font-normal text-white outline-none placeholder:text-ia-placeholder lg:mt-0 lg:text-[13px]"
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
          />
        </div>
      </div>
    </label>
  );
}

function RegisterPasswordField({ label, placeholder, value, visible, onToggle, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 hidden text-[13px] font-semibold text-white lg:block">
        {label}
      </span>
      <div className="relative flex min-h-[88px] items-center rounded-[12px] border border-white/12 bg-black/25 transition duration-ia focus-within:border-white/65 lg:min-h-[42px] lg:rounded-[8px]">
        <span className="pointer-events-none absolute left-7 flex text-ia-muted lg:left-4">
          <Lock size={28} className="lg:h-[16px] lg:w-[16px]" />
        </span>
        <div className="w-full pl-[86px] pr-16 lg:pl-10 lg:pr-10">
          <span className="block text-[18px] font-semibold text-white lg:hidden">{label}</span>
          <input
            className="mt-2 w-full appearance-none border-0 bg-transparent p-0 text-[20px] font-normal text-white outline-none placeholder:text-ia-placeholder lg:mt-0 lg:text-[13px]"
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-6 top-1/2 flex h-10 w-10 -translate-y-1/2 appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 text-ia-muted shadow-none transition duration-ia hover:bg-white/5 hover:text-white lg:right-3 lg:h-7 lg:w-7"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff size={28} className="lg:h-[16px] lg:w-[16px]" /> : <Eye size={28} className="lg:h-[16px] lg:w-[16px]" />}
        </button>
      </div>
    </label>
  );
}

function PageTitle({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function ManagementGreeting({ user }) {
  const firstName = String(user?.name || 'Joao').trim().split(' ')[0] || 'Joao';

  return (
    <section className="management-greeting">
      <h1>Olá, {firstName}! <span aria-hidden="true">{'\uD83D\uDC4B'}</span></h1>
      <p>Aqui está um resumo da sua barbearia.</p>
    </section>
  );
}

function AppHeader({ onBack, onLogout }) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    function updateFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }

  return (
    <header className="barberpro-app-header">
      <button
        type="button"
        className="app-header-action app-header-fullscreen"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      >
        {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
      </button>

      {onBack ? (
        <button type="button" className="app-header-action app-header-back" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={21} />
        </button>
      ) : (
        <span className="app-header-spacer app-header-back" aria-hidden="true" />
      )}

      <div className="app-header-brand">
        <BarberProLogoMark />
        <div>
          <strong>BarberPro</strong>
          <span>IA Dreams</span>
        </div>
      </div>

      <div className="app-header-actions">
        <button type="button" className="app-header-action" aria-label="Avisos">
          <Bell size={21} />
        </button>
        <button type="button" className="app-header-action" onClick={onLogout} aria-label="Sair">
          <LogOut size={21} />
        </button>
      </div>
    </header>
  );
}

const MOBILE_NAV_ITEMS = [
  { id: 'management', label: 'Financeiro', icon: <Home size={23} /> },
  { id: 'schedule', label: 'Agendamentos', icon: <CalendarClock size={23} /> },
  { id: 'payments', label: 'Pagamentos', icon: <Plus size={31} />, featured: true },
  { id: 'inventory', label: 'Estoque', icon: <Store size={23} /> },
  { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={23} /> },
];

const DESKTOP_NAV_ITEMS = [
  { id: 'payments', label: 'Pagamentos', icon: <WalletCards size={22} /> },
  { id: 'management', label: 'Financeiro', icon: <Home size={22} /> },
  { id: 'schedule', label: 'Agendamentos', icon: <CalendarClock size={22} /> },
  { id: 'professionals', label: 'Profissionais', icon: <UserCog size={22} /> },
  { id: 'closing', label: 'Relatórios', icon: <BarChart3 size={22} /> },
  { id: 'inventory', label: 'Estoque', icon: <Store size={22} /> },
  { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={22} /> },
];

function AppNavigation({ currentScreen, onNavigate, barbershop, user }) {
  const currentNavId = currentScreen === 'professionals' ? 'settings' : currentScreen;

  return (
    <nav className="app-nav" aria-label="Navegação principal">
      <div className="nav-brand">
        <BarberProLogoMark size="sidebar" />
        <div>
          <strong>BarberPro</strong>
          <span>IA Dreams</span>
        </div>
      </div>

      <div className="nav-items nav-items-desktop">
        {DESKTOP_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={currentNavId === item.id ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-current={currentNavId === item.id ? 'page' : undefined}
            type="button"
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-items nav-items-mobile">
        {MOBILE_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`${currentScreen === item.id ? 'active' : ''} ${
            item.featured ? 'featured' : ''
          }`}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          aria-label={item.label}
          aria-current={currentScreen === item.id ? 'page' : undefined}
          type="button"
        >
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </button>
        ))}
      </div>

      <div className="nav-user-card">
        <div className="nav-user-avatar">B</div>
        <div>
          <strong>{barbershop?.name || 'Barbearia'}</strong>
          <span>{user?.role === 'admin' ? 'Admin' : user?.role === 'owner' ? 'Dono' : 'Profissional'}</span>
          <small><i /> Online</small>
        </div>
      </div>
    </nav>
  );
}

function DropdownSelect({ value, options, onChange, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function selectOption(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className={`dropdown-select ${open ? 'open' : ''} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-select-button"
        onClick={() => setOpen(!open)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        {selectedOption?.color && (
          <span className="color-dot" style={{ background: selectedOption.color }} />
        )}
        <span>{selectedOption?.label || 'Selecionar'}</span>
      </button>
      {open && (
        <div className="dropdown-select-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={String(option.value) === String(value) ? 'active' : ''}
              onClick={() => selectOption(option.value)}
            >
              {option.color && (
                <span className="color-dot" style={{ background: option.color }} />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminWorkspace({ onLogout }) {
  const [summary, setSummary] = useState(null);
  const [barbershops, setBarbershops] = useState([]);

  async function loadAdminData() {
    const [summaryResponse, barbershopsResponse] = await Promise.all([
      api.get('/admin/summary'),
      api.get('/admin/barbershops'),
    ]);
    setSummary(summaryResponse.data);
    setBarbershops(barbershopsResponse.data);
  }

  useEffect(() => {
    activeBarbershopId = null;
    loadAdminData().catch(() => {});
  }, []);

  async function updateClient(client, patch) {
    await api.post(`/admin/barbershops/${client.id}`, patch);
    await loadAdminData();
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">IA Dreams</p>
          <h1>Painel de controle</h1>
        </div>
        <button onClick={onLogout}>
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <section className="admin-metrics">
        <MetricPanel title="Clientes" value={summary?.clientsCount || 0} />
        <MetricPanel title="Ativos" value={summary?.activeClients || 0} />
        <MetricPanel title="Em dia" value={summary?.paidClients || 0} />
        <MetricPanel title="Vencidos" value={summary?.overdueClients || 0} />
        <MetricPanel
          title="Receita mensal"
          value={money(summary?.monthlyRecurringRevenueCents || 0)}
        />
      </section>

      {summary?.couponSummary?.length > 0 && (
        <section className="admin-metrics coupon-metrics">
          {summary.couponSummary.map((coupon) => (
            <MetricPanel
              key={coupon.code}
              title={coupon.code}
              value={`${coupon.count} barbearia${coupon.count === 1 ? '' : 's'}`}
              hint={
                coupon.partnerCommissionCents
                  ? `${money(coupon.partnerCommissionCents)} por cliente ativo`
                  : coupon.label
              }
            />
          ))}
        </section>
      )}

      <section className="panel">
        <SectionTitle eyebrow="Clientes" title="Barbearias usando o app" compact />
        <div className="admin-table">
          <div className="admin-row admin-head-row">
            <span>Barbearia</span>
            <span>Dono</span>
            <span>Cupom</span>
            <span>Situação</span>
            <span>Pagamento</span>
            <span>Vencimento</span>
            <span>Mensalidade</span>
            <span>Atendimentos</span>
            <span>Observações</span>
          </div>
          {barbershops.map((item) => (
            <div className="admin-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.ownerName}</span>
              <span>{item.partnerCode || 'Cliente próprio'}</span>
              <select
                value={item.status}
                onChange={(event) => updateClient(item, { status: event.target.value })}
              >
                <option value="trial">Teste</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
                <option value="canceled">Cancelado</option>
              </select>
              <span className={`payment-dot ${item.paymentStatus}`}>
                {paymentStatusLabel(item.paymentStatus)}
              </span>
              <input
                type="date"
                defaultValue={item.paymentDueDate || ''}
                onBlur={(event) =>
                  updateClient(item, { paymentDueDate: event.target.value })
                }
              />
              <input
                type="number"
                min="0"
                step="0.01"
                defaultValue={(item.monthlyPriceCents || 0) / 100}
                onBlur={(event) =>
                  updateClient(item, {
                    monthlyPriceCents: Math.round(Number(event.target.value || 0) * 100),
                  })
                }
              />
              <span>{item.appointmentsCount}</span>
              <input
                defaultValue={item.adminNotes}
                placeholder="Observação interna"
                onBlur={(event) => updateClient(item, { adminNotes: event.target.value })}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Workspace({ session, onLogout }) {
  const { user } = session;
  const [screen, setScreen] = useState('management');
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [barbershop, setBarbershop] = useState(null);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [costs, setCosts] = useState([]);
  const [settingsInitialTab, setSettingsInitialTab] = useState('company');

  async function loadData() {
    const [
      barbershopResponse,
      usersResponse,
      professionalsResponse,
      servicesResponse,
      appointmentsResponse,
      schedulesResponse,
      costsResponse,
    ] = await Promise.all([
      api.get('/barbershop'),
      api.get('/users'),
      api.get('/professionals'),
      api.get('/services'),
      api.get('/appointments'),
      api.get('/schedules'),
      api.get('/costs'),
    ]);

    setBarbershop(barbershopResponse.data);
    setUsers(usersResponse.data);
    setProfessionals(professionalsResponse.data);
    setServices(servicesResponse.data);
    setAppointments(appointmentsResponse.data);
    setSchedules(schedulesResponse.data);
    setCosts(costsResponse.data);

    const sessionProfessionalExists = professionalsResponse.data.some(
      (professional) => professional.id === user.professionalId,
    );
    if (user.role !== 'owner' && !sessionProfessionalExists) {
      onLogout();
      return;
    }

    if (user.role === 'owner' && user.professionalId && !sessionProfessionalExists) {
      onLogout();
    }
  }

  useEffect(() => {
    activeBarbershopId = user.barbershopId;
    loadData().catch(() => {
      onLogout();
    });
    return () => {
      activeBarbershopId = null;
    };
  }, [user.barbershopId]);

  return (
    <main
      className="app-shell"
      style={{
        '--panel-color': barbershop?.panelColor || '#ffffff',
        '--text-color': barbershop?.textColor || '#111827',
        '--accent-color': barbershop?.accentColor || '#111827',
      }}
    >
      <AppNavigation
        currentScreen={screen}
        barbershop={barbershop}
        user={user}
        onNavigate={(nextScreen) => {
          if (nextScreen === 'professionals') {
            setSettingsInitialTab('team');
            setScreen('settings');
            return;
          }

          if (nextScreen === 'settings') {
            setSettingsInitialTab('company');
          }

          setScreen(nextScreen);
        }}
      />

      <section className="app-content">
        <AppHeader
          onBack={
            screen === 'payments'
              ? null
              : () => setScreen(screen === 'closing' ? 'management' : 'payments')
          }
          onLogout={onLogout}
        />

        {screen === 'payments' && (
          <PaymentsScreenV2
            user={user}
            professionals={professionals}
            services={services}
            onSaved={loadData}
          />
        )}

        {screen === 'schedule' && (
          <ScheduleScreenV2
            professionals={professionals}
            services={services}
            schedules={schedules}
            barbershop={barbershop}
            onSaved={loadData}
          />
        )}

        {screen === 'management' && (
          <>
            <ManagementScreen
              user={user}
              barbershop={barbershop}
              professionals={professionals}
              appointments={appointments}
              schedules={schedules}
              costs={costs}
              onSaved={loadData}
              onOpenClosing={() => setScreen('closing')}
            />
          </>
        )}

        {screen === 'closing' && (
          <ClosingScreen
            appointments={appointments}
            professionals={professionals}
            costs={costs}
            onBack={() => setScreen('management')}
          />
        )}

        {screen === 'inventory' && <ComingSoonScreen title="Estoque" />}

        {screen === 'settings' && (
          <div className="settings-screen-shell">
            <PageTitle title="Configurações" />
            <SettingsScreen
              user={user}
              barbershop={barbershop}
              users={users}
              professionals={professionals}
              services={services}
              costs={costs}
              initialTab={settingsInitialTab}
              onSaved={loadData}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function PaymentsScreenV2({ user, professionals, services, onSaved }) {
  const canOwnerChoose = user.role === 'owner' && professionals.length > 1;
  const firstProfessionalId = professionals[0]?.id || '';
  const userProfessionalExists = professionals.some((professional) => professional.id === user.professionalId);
  const defaultProfessionalId =
    user.role === 'barber'
      ? user.professionalId
      : userProfessionalExists
        ? user.professionalId
        : firstProfessionalId;
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId);
  const [serviceId, setServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentExists = professionals.some((professional) => professional.id === professionalId);
    if ((!professionalId || !currentExists) && defaultProfessionalId) {
      setProfessionalId(defaultProfessionalId);
    }
  }, [defaultProfessionalId, professionalId, professionals]);

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedProfessional = professionals.find((professional) => professional.id === professionalId);
  const isOther = serviceId === 'other';
  const amountCents = isOther
    ? Math.round(Number(customPrice || 0) * 100)
    : selectedService?.priceCents || 0;
  const chargeProfessionalId = professionalId || user.professionalId || firstProfessionalId || '';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!serviceId) {
      setError('Selecione um serviço.');
      return;
    }

    if (amountCents <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    const response = await api.post('/appointments', {
      barbershopId: user.barbershopId,
      professionalId: chargeProfessionalId,
      serviceId,
      serviceName: isOther ? customServiceName || 'Outro' : undefined,
      totalCents: amountCents,
      paymentMethod,
      businessDate: today(),
    });

    if (response.data.error) {
      setError(response.data.error);
      return;
    }

    setServiceId('');
    setCustomServiceName('');
    setCustomPrice('');
    setSaved(true);
    await onSaved();
    window.setTimeout(() => setSaved(false), 1800);
  }

  const methods = [
    { value: 'pix', title: 'Pix', description: 'Pagamento instantâneo', icon: <WalletCards size={34} /> },
    { value: 'cash', title: 'Dinheiro', description: 'Pagamento em espécie', icon: <Banknote size={34} /> },
    { value: 'credit_card', title: 'Crédito', description: 'Cartão de crédito', icon: <CreditCard size={34} /> },
    { value: 'debit_card', title: 'Débito', description: 'Cartão de débito', icon: <CreditCard size={34} /> },
  ];

  return (
    <div className="barberpro-payments">
      <section className="payments-heading">
        <h1>Registrar atendimento</h1>
        <p>Selecione o serviço e a forma de pagamento.</p>
      </section>

      <form className="payments-form" onSubmit={handleSubmit}>
        <div className="payments-main-column">
          <section className="payments-card payments-service-card">
            <div className="payments-card-title">
              <h2>1. Serviço</h2>
              <p>Selecione o serviço</p>
            </div>

            {canOwnerChoose && (
              <label className="payments-select-field">
                <span>Profissional</span>
                <div>
                  <UserRound size={22} />
                  <select
                    value={professionalId}
                    onChange={(event) => setProfessionalId(event.target.value)}
                    required
                  >
                    <option value="">Selecione o profissional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            )}

            <label className="payments-select-field">
              <span>Serviço</span>
              <div>
                <Scissors size={22} />
                <select
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  required
                >
                  <option value="">Selecione o serviço</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {money(service.priceCents)}
                    </option>
                  ))}
                  <option value="other">Outro</option>
                </select>
              </div>
            </label>

            {isOther && (
              <div className="payments-custom-grid">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  placeholder="Valor livre"
                  onChange={(event) => setCustomPrice(event.target.value)}
                  required
                />
                <input
                  value={customServiceName}
                  placeholder="Descrição"
                  onChange={(event) => setCustomServiceName(event.target.value)}
                />
              </div>
            )}
          </section>

          <section className="payments-card payments-method-card">
            <div className="payments-card-title">
              <h2>2. Forma de pagamento</h2>
              <p>Escolha a forma de pagamento</p>
            </div>

            <div className="payments-method-grid">
              {methods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  className={paymentMethod === method.value ? 'active' : ''}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  {paymentMethod === method.value && (
                    <span className="method-check"><Check size={18} /></span>
                  )}
                  {method.icon}
                  <strong>{method.title}</strong>
                  <small>{method.description}</small>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="payments-summary-card">
          <h2>Resumo do atendimento</h2>
          <div>
            <span>Serviço</span>
            <strong>{isOther ? customServiceName || 'Outro' : selectedService?.name || '-'}</strong>
          </div>
          <div>
            <span>Profissional</span>
            <strong>{selectedProfessional?.name || user.name || '-'}</strong>
          </div>
          <div className="payments-total">
            <span>Total</span>
            <strong>{amountCents ? money(amountCents) : 'R$ 0,00'}</strong>
          </div>

          {error && <div className="payments-error">{error}</div>}
          {saved && <div className="payments-success">Atendimento salvo</div>}

          <button className="payments-charge-button" disabled={!amountCents}>
            <Check size={22} />
            Cobrar atendimento
          </button>
        </section>
      </form>
    </div>
  );
}

function ComingSoonScreen({ title }) {
  return (
    <div className="coming-soon-screen">
      <section className="coming-soon-card">
        <div>
          <Lock size={32} />
        </div>
        <h1>{title}</h1>
        <p>Em breve</p>
      </section>
    </div>
  );
}

function ScheduleScreenV2({ professionals, services = [], schedules, barbershop, onSaved }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [viewMode, setViewMode] = useState('day');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [editingSlot, setEditingSlot] = useState('');
  const [openCancelSlot, setOpenCancelSlot] = useState('');
  const [canceledCounts, setCanceledCounts] = useState({});
  const [customServiceSlots, setCustomServiceSlots] = useState({});
  const selectedDateObj = new Date(`${selectedDate}T12:00:00`);
  const weekDays = scheduleWeekDays(selectedDate);
  const selectedProfessional = professionals.find((item) => item.id === professionalId);
  const scheduleSlots = useMemo(() => businessSlots(barbershop), [barbershop]);

  useEffect(() => {
    const currentExists = professionals.some((professional) => professional.id === professionalId);
    if ((!professionalId || !currentExists) && professionals[0]?.id) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionalId, professionals]);

  useEffect(() => {
    const nextDrafts = {};
    for (const slot of scheduleSlots) {
      const startsAt = `${selectedDate}T${slot}`;
      const schedule = schedules.find(
        (item) =>
          item.professionalId === professionalId &&
          scheduleDateTimeKey(item.startsAt) === startsAt,
      );
      nextDrafts[startsAt] = {
        clientName: schedule?.clientName || '',
        clientContact: schedule?.clientContact || '',
        serviceName: schedule?.serviceName || '',
      };
    }
    setDrafts(nextDrafts);
  }, [professionalId, scheduleSlots, schedules, selectedDate]);

  function updateDraft(startsAt, field, value) {
    setDrafts((current) => ({
      ...current,
      [startsAt]: {
        ...current[startsAt],
        [field]: value,
      },
    }));
  }

  async function saveLine(startsAt, draftOverride) {
    if (!professionalId) return;

    const draft = draftOverride || drafts[startsAt] || {};
    await api.post('/schedules', {
      professionalId,
      startsAt,
      clientName: draft.clientName || '',
      clientContact: draft.clientContact || '',
      serviceName: draft.serviceName || '',
    });
    await onSaved();
  }

  async function cancelLine(startsAt) {
    if (!professionalId) return;

    await api.post('/schedules', {
      professionalId,
      startsAt,
      clientName: '',
      clientContact: '',
      serviceName: '',
    });

    setDrafts((current) => ({
      ...current,
      [startsAt]: {
        clientName: '',
        clientContact: '',
        serviceName: '',
      },
    }));
    setCanceledCounts((current) => ({
      ...current,
      [`${professionalId}-${selectedDate}`]: (current[`${professionalId}-${selectedDate}`] || 0) + 1,
    }));
    setOpenCancelSlot('');
    setEditingSlot('');
    await onSaved();
  }
  function moveDate(days) {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + days);
    setSelectedDate(toInputDate(next));
  }

  function schedulesForDate(date) {
    return schedules
      .filter((item) => item.professionalId === professionalId)
      .filter((item) => scheduleDateTimeKey(item.startsAt).startsWith(date))
      .sort((a, b) => scheduleDateTimeKey(a.startsAt).localeCompare(scheduleDateTimeKey(b.startsAt)));
  }

  const listSchedules = schedules
    .filter((item) => item.professionalId === professionalId)
    .filter((item) => scheduleDateTimeKey(item.startsAt).slice(0, 10) >= selectedDate)
    .sort((a, b) => scheduleDateTimeKey(a.startsAt).localeCompare(scheduleDateTimeKey(b.startsAt)))
    .slice(0, 12);
  const serviceOptions = Array.from(
    new Set(
      [
        ...services.map((service) => service.name),
        ...schedules
          .filter((item) => item.professionalId === professionalId)
          .map((item) => item.serviceName),
      ].filter(Boolean),
    ),
  );
  const scheduledSlots = Object.values(drafts).filter((draft) =>
    Boolean(draft.clientName || draft.clientContact || draft.serviceName),
  );
  const openSlotsCount = Math.max(scheduleSlots.length - scheduledSlots.length, 0);
  const canceledKey = professionalId + '-' + selectedDate;
  const canceledCount = canceledCounts[canceledKey] || 0;

  return (
    <div className="barberpro-schedule">
      <header className="schedule-hero">
        <div className="schedule-title-row">
          <div>
            <h2>Agendamentos</h2>
            <p>Gerencie os agendamentos da sua barbearia.</p>
          </div>
          <button type="button" className="new-schedule-button">
            <Plus size={18} />
            Novo agendamento
          </button>
        </div>
      </header>

      <section className="schedule-workspace">
        <div className="schedule-main-panel">
          <div className="schedule-tabs">
            <button className={viewMode === 'day' ? 'active' : ''} type="button" onClick={() => setViewMode('day')}>
              <CalendarClock size={19} />
              Dia
            </button>
            <button className={viewMode === 'week' ? 'active' : ''} type="button" onClick={() => setViewMode('week')}>
              <CalendarClock size={19} />
              Semana
            </button>
            <button className={viewMode === 'month' ? 'active' : ''} type="button" onClick={() => setViewMode('month')}>
              <CalendarClock size={19} />
              Mês
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} type="button" onClick={() => setViewMode('list')}>
              <SlidersHorizontal size={19} />
              Lista
            </button>
          </div>

          <div className="schedule-date-nav">
            <button type="button" onClick={() => moveDate(-1)} aria-label="Dia anterior">
              ‹
            </button>
            <label className="schedule-date-picker" aria-label="Selecionar data">
              <CalendarClock size={19} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <div>
              <strong>{formatLongDate(selectedDateObj)}</strong>
              <span>{capitalize(weekdayFullLabel(selectedDateObj))}</span>
            </div>
            <DropdownSelect
              className="schedule-professional-picker icon-only-dropdown"
              value={professionalId}
              options={professionals.map((professional) => ({
                value: professional.id,
                label: professional.name,
                color: professional.color || '#111827',
              }))}
              onChange={setProfessionalId}
              ariaLabel="Selecionar profissional"
            />
            <button type="button" onClick={() => moveDate(1)} aria-label="Próximo dia">
              ›
            </button>
          </div>

          <div className="schedule-week-strip">
            {weekDays.map((day) => (
              <button
                key={day.date}
                type="button"
                className={day.date === selectedDate ? 'active' : ''}
                onClick={() => setSelectedDate(day.date)}
              >
                <span>{day.weekday}</span>
                <strong>{day.day}</strong>
              </button>
            ))}
          </div>

          {viewMode === 'day' && <section className="schedule-timeline">
            {scheduleSlots.map((slot, index) => {
              const startsAt = `${selectedDate}T${slot}`;
              const draft = drafts[startsAt] || {};
              const isClosed = Boolean(
                draft.clientName || draft.clientContact || draft.serviceName,
              );
              const isEditing = editingSlot === startsAt;
              const statusClass = isClosed ? 'confirmed' : 'open';
              const hiddenByStatus =
                (statusFilter === 'open' && isClosed) ||
                (statusFilter === 'scheduled' && !isClosed);
              const hiddenByService =
                serviceFilter !== 'all' &&
                (!isClosed || draft.serviceName !== serviceFilter);
              if (hiddenByStatus || hiddenByService) return null;

              const isCustomService = Boolean(customServiceSlots[startsAt]) || Boolean(draft.serviceName && !serviceOptions.includes(draft.serviceName));
              const serviceSelectValue = isCustomService ? 'other' : draft.serviceName || '';

              return (
                <div className="schedule-time-row" key={startsAt}>
                  <time>{slot}</time>
                  <article className={`schedule-appointment-card ${statusClass}`}>
                    {isClosed ? (
                      <div className="schedule-avatar">
                        {initials(draft.clientName || selectedProfessional?.name || 'BP')}
                      </div>
                    ) : (
                      <div className="schedule-avatar schedule-avatar-open">
                        <CalendarClock size={22} />
                      </div>
                    )}
                    <div className={`schedule-card-grid ${!isClosed && !isEditing ? 'available' : ''} ${isEditing ? 'editing' : ''} ${isClosed ? 'closed' : 'open-slot'}`}>
                      {!isClosed && !isEditing ? (
                        <div className="schedule-available-label">Horário disponível</div>
                      ) : (
                        <>
                          <div className="schedule-name-column">
                            <input
                              value={draft.clientName || ''}
                              onChange={(event) => updateDraft(startsAt, 'clientName', event.target.value)}
                              onBlur={(event) =>
                                saveLine(startsAt, { ...drafts[startsAt], clientName: event.target.value })
                              }
                              placeholder="Nome do cliente"
                              aria-label={`Cliente ${slot}`}
                            />
                            <select
                              className="schedule-service-select"
                              value={serviceSelectValue}
                              onChange={(event) => {
                                const nextService = event.target.value;
                                if (nextService === 'other') {
                                  setCustomServiceSlots((current) => ({
                                    ...current,
                                    [startsAt]: true,
                                  }));
                                  updateDraft(startsAt, 'serviceName', '');
                                  return;
                                }

                                setCustomServiceSlots((current) => ({
                                  ...current,
                                  [startsAt]: false,
                                }));
                                updateDraft(startsAt, 'serviceName', nextService);
                                if (nextService) {
                                  saveLine(startsAt, { ...drafts[startsAt], serviceName: nextService });
                                }
                              }}
                              aria-label={`Serviço ${slot}`}
                            >
                              <option value="">Serviço</option>
                              {serviceOptions.map((serviceName) => (
                                <option key={serviceName} value={serviceName}>{serviceName}</option>
                              ))}
                              <option value="other">Outro</option>
                            </select>
                            {isCustomService && (
                              <input
                                value={draft.serviceName || ''}
                                onChange={(event) => updateDraft(startsAt, 'serviceName', event.target.value)}
                                onBlur={(event) =>
                                  saveLine(startsAt, { ...drafts[startsAt], serviceName: event.target.value })
                                }
                                placeholder="Digite o serviço"
                                aria-label={`Outro serviço ${slot}`}
                              />
                            )}
                          </div>
                          <input
                            className="schedule-contact-field"
                            value={draft.clientContact || ''}
                            onChange={(event) => updateDraft(startsAt, 'clientContact', event.target.value)}
                            onBlur={(event) =>
                              saveLine(startsAt, { ...drafts[startsAt], clientContact: event.target.value })
                            }
                            placeholder="Contato"
                            aria-label={`Contato ${slot}`}
                          />
                        </>
                      )}
                      <span
                        className={`schedule-status-dot ${statusClass}`}
                        title={isClosed ? 'Confirmado' : 'Aberto'}
                      >
                        <i />
                        {isClosed ? 'Confirmado' : 'Pendente'}
                      </span>
                      <div className="schedule-action-cell">
                        {isClosed ? (
                          <div className="schedule-cancel-menu-wrap">
                            <button
                              type="button"
                              className="schedule-more"
                              aria-label="Mais opções"
                              onClick={() => setOpenCancelSlot(openCancelSlot === startsAt ? '' : startsAt)}
                            >
                              ⋮
                            </button>
                            {openCancelSlot === startsAt && (
                              <button
                                type="button"
                                className="schedule-cancel-action"
                                onClick={() => cancelLine(startsAt)}
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        ) : isEditing ? null : (
                          <button
                            type="button"
                            className="schedule-inline-action"
                            onClick={() => {
                              setEditingSlot(startsAt);
                              window.setTimeout(() => {
                                const input = document.querySelector(`[aria-label="Cliente ${slot}"]`);
                                input?.focus();
                              }, 0);
                            }}
                          >
                            Agendar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </section>}

          {viewMode === 'week' && (
            <section className="schedule-week-view">
              {weekDays.map((day) => {
                const daySchedules = schedulesForDate(day.date);
                return (
                  <button
                    type="button"
                    key={day.date}
                    className={day.date === selectedDate ? 'active' : ''}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setViewMode('day');
                    }}
                  >
                    <span>{day.weekday}</span>
                    <strong>{day.day}</strong>
                    <small>{daySchedules.length} agenda{daySchedules.length === 1 ? '' : 's'}</small>
                    <div>
                      {daySchedules.slice(0, 3).map((item) => (
                        <i key={item.id || item.startsAt}>{item.clientName || 'Reservado'}</i>
                      ))}
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {viewMode === 'month' && (
            <section className="schedule-month-view">
              {monthCalendarDays(selectedDate).map((day) => {
                const daySchedules = schedulesForDate(day.date);
                return (
                  <button
                    type="button"
                    key={day.date}
                    className={`${day.currentMonth ? '' : 'muted'} ${day.date === selectedDate ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setViewMode('day');
                    }}
                  >
                    <span>{day.day}</span>
                    {daySchedules.length > 0 && <em>{daySchedules.length}</em>}
                  </button>
                );
              })}
            </section>
          )}

          {viewMode === 'list' && (
            <section className="schedule-list-view">
              {listSchedules.length === 0 && <p>Nenhum agendamento encontrado.</p>}
              {listSchedules.map((item) => {
                const key = scheduleDateTimeKey(item.startsAt);
                return (
                  <article key={item.id || key}>
                    <time>{formatDate(key.slice(0, 10))} às {key.slice(11, 16)}</time>
                    <strong>{item.clientName || 'Cliente sem nome'}</strong>
                    <span>{item.serviceName || 'Serviço não informado'}</span>
                  </article>
                );
              })}
            </section>
          )}
        </div>

        <aside className="schedule-side-panel">
          <h3>Resumo do dia</h3>
          <div className="schedule-summary-grid">
            <article>
              <CalendarClock size={24} />
              <strong>{scheduledSlots.length}</strong>
              <span>Agendamentos</span>
              <small><i className="green" />Confirmados</small>
            </article>
            <article>
              <CalendarClock size={24} />
              <strong>{openSlotsCount}</strong>
              <span>Pendentes</span>
              <small><i className="blue" />Abertos</small>
            </article>
            <article>
              <UserRound size={24} />
              <strong>0</strong>
              <span>Cancelados</span>
              <small><i className="red" />Cancelados</small>
            </article>
            <article>
              <BarChart3 size={24} />
              <strong>R$ 0,00</strong>
              <span>Faturamento do dia</span>
            </article>
          </div>

          <div className="schedule-quick-filters">
            <h3>Filtros rápidos</h3>
            <label>
              <span>Profissional</span>
              <DropdownSelect
                value={professionalId}
                options={professionals.map((professional) => ({
                  value: professional.id,
                  label: professional.name,
                  color: professional.color || '#111827',
                }))}
                onChange={setProfessionalId}
                ariaLabel="Filtrar profissional"
              />
            </label>
            <label>
              <span>Serviço</span>
              <DropdownSelect
                value={serviceFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...serviceOptions.map((service) => ({ value: service, label: service })),
                ]}
                onChange={setServiceFilter}
                ariaLabel="Filtrar serviço"
              />
            </label>
            <label>
              <span>Status</span>
              <DropdownSelect
                value={statusFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'scheduled', label: 'Confirmados' },
                  { value: 'open', label: 'Abertos' },
                ]}
                onChange={setStatusFilter}
                ariaLabel="Filtrar status"
              />
            </label>
            <button
              type="button"
              className="schedule-clear-filters"
              onClick={() => {
                setServiceFilter('all');
                setStatusFilter('all');
              }}
            >
              Limpar filtros
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ManagementScreen({
  user,
  barbershop,
  professionals,
  appointments,
  schedules,
  costs,
  onSaved,
  onOpenClosing,
}) {
  const [chartMode, setChartMode] = useState('week');
  const [selectedDate, setSelectedDate] = useState(today());
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [scopeProfessionalId, setScopeProfessionalId] = useState('all');
  const [summaryMonth, setSummaryMonth] = useState(localMonthKey(new Date()));

  const scopedAppointments = useMemo(() => {
    if (user.role !== 'owner') {
      return appointments.filter((item) => item.professionalId === user.professionalId);
    }

    if (scopeProfessionalId === 'all') {
      return appointments;
    }

    return appointments.filter((item) => item.professionalId === scopeProfessionalId);
  }, [appointments, scopeProfessionalId, user]);

  const dayAppointments = scopedAppointments
    .filter((appointment) => appointmentDateKey(appointment) === selectedDate)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const periodAppointments = scopedAppointments.filter((appointment) =>
    isDateInRange(appointmentDateKey(appointment), startDate, endDate),
  );
  const chartItems = buildChartItems(scopedAppointments, chartMode, professionals);
  const dayReport = buildReport(dayAppointments);
  const periodReport = buildReport(periodAppointments);
  const scopeOptions = [
    { value: 'all', label: barbershop?.name || 'Barbearia' },
    ...professionals.map((professional) => ({
      value: professional.id,
      label: professional.name,
      color: professional.color || '#111827',
    })),
  ];
  const summaryMonthOptions = Array.from(
    new Set([
      localMonthKey(new Date()),
      ...scopedAppointments.map((appointment) => localMonthKey(appointmentDateKey(appointment))),
      ...schedules.map((schedule) => scheduleDateTimeKey(schedule.startsAt).slice(0, 7)),
    ]),
  )
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const currentMonth = summaryMonth;
  const previousMonth = previousMonthKey(currentMonth);
  const scopedSchedules = schedules.filter((schedule) => {
    if (user.role !== 'owner') {
      return schedule.professionalId === user.professionalId;
    }

    if (scopeProfessionalId === 'all') {
      return true;
    }

    return schedule.professionalId === scopeProfessionalId;
  });
  const currentMonthAppointments = scopedAppointments.filter(
    (appointment) => localMonthKey(appointmentDateKey(appointment)) === currentMonth,
  );
  const previousMonthAppointments = scopedAppointments.filter(
    (appointment) => localMonthKey(appointmentDateKey(appointment)) === previousMonth,
  );
  const currentMonthSchedules = scopedSchedules.filter(
    (schedule) => scheduleDateTimeKey(schedule.startsAt).slice(0, 7) === currentMonth,
  );
  const previousMonthSchedules = scopedSchedules.filter(
    (schedule) => scheduleDateTimeKey(schedule.startsAt).slice(0, 7) === previousMonth,
  );
  const currentRevenueCents = currentMonthAppointments.reduce(
    (sum, appointment) => sum + appointment.totalCents,
    0,
  );
  const previousRevenueCents = previousMonthAppointments.reduce(
    (sum, appointment) => sum + appointment.totalCents,
    0,
  );
  const currentTicketCents = currentMonthAppointments.length
    ? Math.round(currentRevenueCents / currentMonthAppointments.length)
    : 0;
  const previousTicketCents = previousMonthAppointments.length
    ? Math.round(previousRevenueCents / previousMonthAppointments.length)
    : 0;
  const summaryItems = [
    {
      label: 'Agendamentos',
      value: currentMonthSchedules.length,
      trend: percentageTrend(currentMonthSchedules.length, previousMonthSchedules.length),
      icon: <CalendarClock size={24} />,
    },
    {
      label: 'Atendimentos',
      value: currentMonthAppointments.length,
      trend: percentageTrend(currentMonthAppointments.length, previousMonthAppointments.length),
      icon: <Users size={24} />,
    },
    {
      label: 'Faturamento',
      value: money(currentRevenueCents),
      trend: percentageTrend(currentRevenueCents, previousRevenueCents),
      icon: <CircleDollarSign size={24} />,
    },
    {
      label: 'Ticket Médio',
      value: money(currentTicketCents),
      trend: percentageTrend(currentTicketCents, previousTicketCents),
      icon: <BarChart3 size={24} />,
    },
  ];
  const serviceDistributionItems = buildServiceDistribution(currentMonthAppointments);
  const paymentDistributionItems = buildPaymentDistribution(currentMonthAppointments);

  return (
    <div className="screen-column management-screen">
      <div className="management-top-row">
        <ManagementGreeting user={user} />

        {user.role === 'owner' && (
          <DropdownSelect
            className="scope-control"
            value={scopeProfessionalId}
            options={scopeOptions}
            onChange={setScopeProfessionalId}
            ariaLabel="Selecionar barbearia ou funcionário"
          />
        )}
      </div>

      <section className="management-summary-section">
        <div className="management-summary-header">
          <h2>Resumo geral</h2>
          <DropdownSelect
            className="period-dropdown"
            value={summaryMonth}
            options={summaryMonthOptions.map((month) => ({
              value: month,
              label: month === localMonthKey(new Date()) ? 'Este mês' : formatMonthLabel(month),
            }))}
            onChange={setSummaryMonth}
            ariaLabel="Selecionar mês"
          />
        </div>
        <div className="management-summary-card">
          {summaryItems.map((item) => (
            <article key={item.label}>
              <div className="summary-icon">{item.icon}</div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small className={item.trend.direction}>
                {item.trend.direction === 'flat' ? '•' : item.trend.direction === 'down' ? '▼' : '▲'} {Math.abs(item.trend.value)}%
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="finance-charts-grid">
        <section className="performance-section">
          <h2>Desempenho</h2>
          <RevenueChart items={chartItems} mode={chartMode} onModeChange={setChartMode} />
        </section>
        <FinanceDistributionCarousel
          serviceItems={serviceDistributionItems}
          serviceTotal={currentMonthAppointments.length}
          paymentItems={paymentDistributionItems}
        />
      </section>

      {user.role === 'owner' && (
        <div className="finance-actions">
          <CostsAccordion costs={costs} onSaved={onSaved} />
          <button className="closing-button" onClick={onOpenClosing}>
            <ReceiptText size={18} />
            Fechamento de caixa
          </button>
        </div>
      )}

      <div className="reports-grid">
        <ReportCard
          title="Dia"
          report={dayReport}
          action={
            <button className="icon-action" onClick={() => setShowDayPicker(!showDayPicker)}>
              <SlidersHorizontal size={18} />
            </button>
          }
        >
          {showDayPicker && (
            <input
              className="date-input"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          )}
        </ReportCard>

        <ReportCard
          title="Periodo"
          report={periodReport}
          action={
            <button
              className="icon-action"
              onClick={() => setShowPeriodPicker(!showPeriodPicker)}
            >
              <SlidersHorizontal size={18} />
            </button>
          }
        >
          {showPeriodPicker && (
            <div className="period-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  const next = limitRangeStart(event.target.value, endDate);
                  setStartDate(next);
                }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  const next = limitRangeEnd(startDate, event.target.value);
                  setEndDate(next);
                }}
              />
            </div>
          )}
        </ReportCard>
      </div>

      <section className="panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">{formatDate(selectedDate)}</p>
            <h2>Atendimentos do dia</h2>
          </div>
        </div>
        <AppointmentList appointments={dayAppointments} />
      </section>
    </div>
  );
}

function RevenueChart({ items, mode, onModeChange }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const dragStartX = useRef(null);
  const maxRevenueCents = Math.max(...items.map((item) => item.revenueCents), 0);
  const maxValue = getRevenueChartMaxCents(maxRevenueCents);
  const totalCents = items.reduce((sum, item) => sum + item.revenueCents, 0);
  const width = 640;
  const height = 230;
  const chartTop = 26;
  const chartBottom = 174;
  const chartLeft = 58;
  const chartRight = 594;
  const chartHeight = chartBottom - chartTop;
  const xStep = items.length > 1 ? (chartRight - chartLeft) / (items.length - 1) : 0;
  const points = items.map((item, index) => {
    const x = items.length > 1 ? chartLeft + index * xStep : (chartLeft + chartRight) / 2;
    const y = chartBottom - (item.revenueCents / maxValue) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
    : '';
  const lastPoint = points[points.length - 1];

  function handleDragStart(event) {
    dragStartX.current = event.clientX ?? event.touches?.[0]?.clientX ?? null;
  }

  function handleDragEnd(event) {
    if (dragStartX.current === null) return;
    const endX = event.clientX ?? event.changedTouches?.[0]?.clientX ?? null;
    if (endX === null) return;

    const distance = endX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(distance) < 36) return;

    setActiveSlide((current) => {
      if (distance < 0) return Math.min(1, current + 1);
      return Math.max(0, current - 1);
    });
  }

  return (
    <div className="revenue-line-card revenue-carousel-card">
      <div className="revenue-line-header">
        <div>
          <span>Faturamento</span>
          <strong>{money(totalCents)}</strong>
        </div>
        <DropdownSelect
          className="period-dropdown"
          value={mode}
          options={[
            { value: 'week', label: 'Semanal' },
            { value: 'month', label: 'Mensal' },
          ]}
          onChange={onModeChange}
          ariaLabel="Selecionar período do gráfico"
        />
      </div>

      <div
        className="revenue-carousel-viewport"
        onPointerDown={handleDragStart}
        onPointerUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="revenue-carousel-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          <div className="revenue-carousel-slide">
            <svg className="revenue-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de faturamento em linha">
              <defs>
                <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                </linearGradient>
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {[0, 1 / 3, 2 / 3, 1].map((ratio) => {
                const y = chartBottom - ratio * chartHeight;
                return <line key={ratio} x1={chartLeft} x2={chartRight} y1={y} y2={y} />;
              })}

              {[0, 1 / 3, 2 / 3, 1].map((ratio) => {
                const value = Math.round(maxValue * ratio);
                const y = chartBottom - ratio * chartHeight;
                return (
                  <text key={ratio} className="revenue-y-label" x="16" y={y + 4}>
                    {formatCompactMoney(value)}
                  </text>
                );
              })}

              {areaPath && <path className="revenue-area" d={areaPath} />}
              {linePath && <path className="revenue-line" d={linePath} filter="url(#lineGlow)" />}

              {lastPoint && (
                <>
                  <text className="revenue-value-badge" x={Math.max(chartLeft, lastPoint.x - 44)} y={lastPoint.y - 18}>
                    {money(lastPoint.revenueCents).replace('R$ ', 'R$ ')}
                  </text>
                  <circle className="revenue-dot-outer" cx={lastPoint.x} cy={lastPoint.y} r="11" />
                  <circle className="revenue-dot" cx={lastPoint.x} cy={lastPoint.y} r="6" />
                </>
              )}

              {points.map((point) => (
                <text key={point.key} className="revenue-x-label" x={point.x} y="210">
                  {point.label}
                </text>
              ))}
            </svg>
          </div>

          <div className="revenue-carousel-slide">
            <RevenueBarChart items={items} maxValue={maxValue} />
          </div>
        </div>
      </div>

      <div className="revenue-carousel-dots" aria-label="Alternar visualização de faturamento">
        {[
          { key: 'line', label: 'Linha' },
          { key: 'bars', label: 'Barras' },
        ].map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            className={activeSlide === index ? 'active' : ''}
            onClick={() => setActiveSlide(index)}
            aria-label={`Mostrar gráfico de ${slide.label}`}
          />
        ))}
      </div>
    </div>
  );
}

function RevenueBarChart({ items, maxValue }) {
  const width = 640;
  const height = 230;
  const chartTop = 26;
  const chartBottom = 174;
  const chartLeft = 58;
  const chartRight = 594;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;
  const barGap = items.length > 16 ? 5 : 10;
  const barWidth = Math.max(8, Math.min(34, (chartWidth - barGap * Math.max(0, items.length - 1)) / Math.max(1, items.length)));
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;

  return (
    <svg className="revenue-line-chart revenue-bar-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de faturamento em barras">
      {[0, 1 / 3, 2 / 3, 1].map((ratio) => {
        const y = chartBottom - ratio * chartHeight;
        return <line key={ratio} x1={chartLeft} x2={chartRight} y1={y} y2={y} />;
      })}

      {[0, 1 / 3, 2 / 3, 1].map((ratio) => {
        const value = Math.round(maxValue * ratio);
        const y = chartBottom - ratio * chartHeight;
        return (
          <text key={ratio} className="revenue-y-label" x="16" y={y + 4}>
            {formatCompactMoney(value)}
          </text>
        );
      })}

      {items.map((item, index) => {
        const x = chartLeft + index * step + (step - barWidth) / 2;
        const barHeight = Math.max(item.revenueCents > 0 ? 4 : 0, (item.revenueCents / maxValue) * chartHeight);
        const y = chartBottom - barHeight;
        const segments = item.segments?.length ? item.segments : [
          { professionalId: 'total', color: '#2563eb', revenueCents: item.revenueCents },
        ];
        const segmentTotal = segments.reduce((sum, segment) => sum + (segment.revenueCents || 0), 0) || item.revenueCents || 1;
        let segmentOffset = chartBottom;

        return (
          <g key={item.key}>
            {barHeight > 0 && (
              <rect
                className="revenue-bar-bg"
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="7"
              />
            )}
            {segments.map((segment, segmentIndex) => {
              const segmentHeight = Math.max(2, ((segment.revenueCents || 0) / segmentTotal) * barHeight);
              segmentOffset -= segmentHeight;
              return (
                <rect
                  key={segment.professionalId}
                  className="revenue-bar-segment"
                  x={x}
                  y={segmentOffset}
                  width={barWidth}
                  height={segmentHeight}
                  rx={segmentIndex === segments.length - 1 ? 7 : 0}
                  fill={segment.color || '#2563eb'}
                />
              );
            })}
            <text className="revenue-x-label" x={x + barWidth / 2} y="210">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
const serviceDistributionColors = ['#2563eb', '#60a5fa', '#8b5cf6', '#7c9ce8', '#9ca3af'];

function FinanceDistributionCarousel({ serviceItems, serviceTotal, paymentItems }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const dragStartX = useRef(null);
  const slides = [
    {
      key: 'services',
      label: 'Serviços',
      content: <ServiceDistributionChart items={serviceItems} total={serviceTotal} embedded />,
    },
    {
      key: 'payments',
      label: 'Pagamentos',
      content: <PaymentDistributionChart items={paymentItems} />,
    },
  ];

  function handleDragStart(event) {
    dragStartX.current = event.clientX ?? event.touches?.[0]?.clientX ?? null;
  }

  function handleDragEnd(event) {
    if (dragStartX.current === null) return;
    const endX = event.clientX ?? event.changedTouches?.[0]?.clientX ?? null;
    if (endX === null) return;

    const distance = endX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(distance) < 36) return;

    setActiveSlide((current) => {
      if (distance < 0) return Math.min(slides.length - 1, current + 1);
      return Math.max(0, current - 1);
    });
  }

  return (
    <section
      className="finance-distribution-carousel"
      aria-label="Indicadores financeiros"
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchEnd={handleDragEnd}
    >
      <div
        className="finance-carousel-track"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div className="finance-carousel-slide" key={slide.key}>
            {slide.content}
          </div>
        ))}
      </div>

      <div className="finance-carousel-dots" aria-label="Alternar indicador">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            className={activeSlide === index ? 'active' : ''}
            onClick={() => setActiveSlide(index)}
            aria-label={`Mostrar ${slide.label}`}
          />
        ))}
      </div>
    </section>
  );
}

function PaymentDistributionChart({ items }) {
  return (
    <section className="payment-distribution-card">
      <h2>Formas de pagamento</h2>
      <div className="payment-distribution-list">
        {items.map((item) => (
          <div key={item.method}>
            <span className="payment-method-label">
              <i className={item.method}>{item.icon}</i>
              {item.label}
            </span>
            <strong>{money(item.totalCents)}</strong>
            <em>{item.percent}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}
function ServiceDistributionChart({ items, total, embedded = false }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className={`service-distribution-card ${embedded ? 'embedded' : ''}`}>
      <h2>Distribuição de serviços</h2>
      <div className="service-distribution-content">
        <div className="service-donut-wrap">
          <svg className="service-donut" viewBox="0 0 120 120" role="img" aria-label="Distribuição de serviços">
            <circle className="service-donut-track" cx="60" cy="60" r={radius} />
            {items.map((item) => {
              const dash = (item.percent / 100) * circumference;
              const segment = (
                <circle
                  key={item.label}
                  className="service-donut-segment"
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={item.color}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return segment;
            })}
          </svg>
          <div className="service-donut-center">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="service-distribution-list">
          {items.map((item) => (
            <div key={item.label}>
              <span><i style={{ background: item.color }} /> {item.label}</span>
              <strong>{item.displayPercent ?? item.percent}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CostsAccordion({ costs, onSaved }) {
  const [open, setOpen] = useState(false);
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const [form, setForm] = useState({
    icon: 'home',
    description: '',
    amount: '',
    type: 'fixed',
  });
  const [editingId, setEditingId] = useState('');

  async function submit(event) {
    event.preventDefault();
    const payload = {
      icon: form.icon,
      description: form.description,
      amountCents: Math.round(Number(form.amount || 0) * 100),
      type: form.type,
    };

    if (editingId) {
      await api.post(`/costs/${editingId}`, payload);
    } else {
      await api.post('/costs', payload);
    }

    setForm({ icon: 'home', description: '', amount: '', type: 'fixed' });
    setEditingId('');
    onSaved();
  }

  function edit(cost) {
    setOpen(true);
    setEditingId(cost.id);
    setForm({
      icon: cost.icon || 'home',
      description: cost.description,
      amount: String((cost.amountCents || 0) / 100),
      type: cost.type,
    });
  }

  async function remove(cost) {
    await api.post(`/costs/${cost.id}/delete`);
    onSaved();
  }

  return (
    <div className="costs-box">
      <button className="costs-toggle" onClick={() => setOpen(!open)}>
        <Wallet size={18} />
        Adicionar custos
      </button>

      {open && (
        <div className="costs-panel">
          <form className="cost-form" onSubmit={submit}>
            <div className="icon-picker single-picker cost-icon-field">
              <button
                type="button"
                onClick={() => setIconMenuOpen(!iconMenuOpen)}
                title="Selecionar ícone"
              >
                <CostIcon type={form.icon} />
              </button>
              {iconMenuOpen && (
                <div className="icon-menu">
                  {['home', 'wallet', 'receipt'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={form.icon === icon ? 'active' : ''}
                      onClick={() => {
                        setForm({ ...form, icon });
                        setIconMenuOpen(false);
                      }}
                    >
                      <CostIcon type={icon} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className="cost-description-field"
              placeholder="Descrição"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
            <input
              className="cost-amount-field"
              type="number"
              min="0"
              step="0.01"
              placeholder="Custo"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              required
            />
            <DropdownSelect
              className="cost-type-field"
              value={form.type}
              options={[
                { value: 'variable', label: 'Variável' },
                { value: 'fixed', label: 'Fixo mensal' },
              ]}
              onChange={(type) => setForm({ ...form, type })}
              ariaLabel="Selecionar tipo de custo"
            />
            <button className="cost-submit-button">{editingId ? 'Atualizar' : 'Adicionar'}</button>
          </form>

          <div className="cost-list">
            {costs.length === 0 && <p className="empty">Nenhum custo cadastrado.</p>}
            {costs.map((cost) => (
              <div className="cost-row" key={cost.id}>
                <CostIcon type={cost.icon} />
                <strong>{cost.description}</strong>
                <span>{money(cost.amountCents)}</span>
                <small>{cost.type === 'fixed' ? 'Fixo' : 'Variável'}</small>
                <button onClick={() => edit(cost)} type="button">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(cost)} type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClosingScreen({ appointments, professionals, costs, onBack }) {
  const currentMonth = localMonthKey(new Date());
  const monthAppointments = appointments.filter((appointment) =>
    appointmentDateKey(appointment).slice(0, 7) === currentMonth,
  );
  const report = buildReport(monthAppointments);
  const costsTotal = costs.reduce((sum, cost) => sum + cost.amountCents, 0);
  const profitCents = report.revenueCents - report.commissionCents - costsTotal;
  const salaryRows = professionals
    .map((professional) => {
      const professionalReport = buildReport(
        monthAppointments.filter(
          (appointment) => appointment.professionalId === professional.id,
        ),
      );
      return {
        professional,
        commissionCents: professionalReport.commissionCents,
      };
    })
    .filter((row) => row.commissionCents > 0);

  return (
    <div className="screen-column closing-screen">
      <SectionTitle
        title="Fechamento de Caixa"
      />
      <div className="reports-grid">
        <MetricPanel title="Lucro total" value={money(profitCents)} />
        <MetricPanel title="Salários a pagar" value={money(report.commissionCents)} />
        <MetricPanel title="Custos" value={money(costsTotal)} />
        <MetricPanel title="Faturamento" value={money(report.revenueCents)} />
      </div>

      <section className="panel">
        <SectionTitle eyebrow="Saídas" title="Salários e gastos" compact />
        <div className="closing-list">
          {salaryRows.length === 0 && costs.length === 0 && (
            <p className="empty">Nenhuma saída neste mês.</p>
          )}
          {salaryRows.map((row) => (
            <div className="closing-row" key={row.professional.id}>
              <span
                className="color-dot"
                style={{ background: row.professional.color || '#111827' }}
              />
              <strong>Salário {row.professional.name}</strong>
              <span>{money(row.commissionCents)}</span>
            </div>
          ))}
          {costs.map((cost) => (
            <div className="closing-row" key={cost.id}>
              <CostIcon type={cost.icon} />
              <strong>{cost.description}</strong>
              <span>{money(cost.amountCents)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricPanel({ title, value, hint }) {
  return (
    <div className="panel metric-panel">
      <span>{title}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function CostIcon({ type }) {
  if (type === 'receipt') return <ReceiptText size={18} />;
  if (type === 'wallet') return <Wallet size={18} />;
  return <Home size={18} />;
}

function ReportCard({ title, report, action, children }) {
  return (
    <div className="panel">
      <div className="report-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
      <div className="metrics">
        <Metric label="Faturamento" value={money(report.revenueCents)} />
        <Metric label="Comissões" value={money(report.commissionCents)} />
        <Metric label="Atendimentos" value={report.appointmentsCount} />
        <Metric label="Líquido loja" value={money(report.netForShopCents)} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppointmentList({ appointments }) {
  if (appointments.length === 0) {
    return <p className="empty">Nenhum atendimento neste dia.</p>;
  }

  return (
    <div className="table">
      {appointments.map((appointment) => (
        <div className="table-row" key={appointment.id}>
          <span className="sale-time">{timeOnly(appointment.createdAt)}</span>
          <span className="sale-name">{appointment.professionalName}</span>
          <span className="sale-service">{appointment.serviceName}</span>
          <span className="sale-payment">{paymentLabels[appointment.paymentMethod]}</span>
          <strong className="sale-total">{money(appointment.totalCents)}</strong>
        </div>
      ))}
    </div>
  );
}

function SettingsScreen({
  user,
  barbershop,
  users,
  professionals,
  services,
  initialTab = 'company',
  onSaved,
}) {
  const isOwner = user.role === 'owner';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isOwner) {
    return (
      <div className="screen-column">
        <SectionTitle eyebrow="Perfil" title="Minha conta" />
        <ProfileEditor user={user} onSaved={onSaved} />
      </div>
    );
  }

  return (
    <div className="screen-column">
      <div className="settings-tabs">
        <button className={tab === 'company' ? 'active' : ''} onClick={() => setTab('company')}>Empresa</button>
        <button className={tab === 'theme' ? 'active' : ''} onClick={() => setTab('theme')}>Customização</button>
        <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>Equipe</button>
        <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Serviços</button>
        <button className={tab === 'schedule' ? 'active' : ''} onClick={() => setTab('schedule')}>Agendamento</button>
      </div>

      {tab === 'company' && <CompanyEditor barbershop={barbershop} onSaved={onSaved} />}
      {tab === 'theme' && <ThemeEditor barbershop={barbershop} onSaved={onSaved} />}
      {tab === 'team' && (
        <div className="settings-grid">
          <CreateProfessional onSaved={onSaved} />
          <ProfessionalsEditor
            professionals={professionals}
            users={users}
            onSaved={onSaved}
          />
        </div>
      )}
      {tab === 'services' && <ServicesEditor services={services} onSaved={onSaved} />}
      {tab === 'schedule' && (
        <ScheduleSettings barbershop={barbershop} onSaved={onSaved} />
      )}
    </div>
  );
}

function ProfileEditor({ user, onSaved }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: '',
  });
  const [message, setMessage] = useState('');
  const issues = form.password ? getPasswordIssues(form.password) : [];

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (issues.length > 0) {
      setMessage('Complete os requisitos da senha.');
      return;
    }
    await api.post(`/users/${user.id}`, form);
    setMessage('Perfil atualizado.');
    onSaved();
  }

  return (
    <form className="panel stack-form" onSubmit={submit}>
      <input
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <input
        type="email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />
      <input
        type="password"
        placeholder="Nova senha"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />
      {issues.length > 0 && <PasswordRules issues={issues} />}
      {message && <Message tone={issues.length > 0 ? 'error' : 'success'}>{message}</Message>}
      <button>Salvar perfil</button>
    </form>
  );
}

function CompanyEditor({ barbershop, onSaved }) {
  const [form, setForm] = useState({
    name: barbershop?.name || '',
    ownerName: barbershop?.ownerName || '',
    contact: barbershop?.contact || '',
  });

  useEffect(() => {
    setForm({
      name: barbershop?.name || '',
      ownerName: barbershop?.ownerName || '',
      contact: barbershop?.contact || '',
    });
  }, [barbershop]);

  async function submit(event) {
    event.preventDefault();
    await api.post('/barbershop', form);
    onSaved();
  }

  return (
    <div className="panel">
      <SectionTitle eyebrow="Empresa" title="Perfil da barbearia" compact />
      <form className="stack-form" onSubmit={submit}>
        <input
          placeholder="Nome da barbearia"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="Responsável"
          value={form.ownerName}
          onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
        />
        <input
          placeholder="Contato"
          value={form.contact}
          onChange={(event) => setForm({ ...form, contact: event.target.value })}
        />
        <button>Salvar empresa</button>
      </form>
    </div>
  );
}

function ThemeEditor({ barbershop, onSaved }) {
  const defaultTheme = {
    logoUrl: '',
    panelColor: '#ffffff',
    textColor: '#111827',
    accentColor: '#111827',
  };
  const [form, setForm] = useState(defaultTheme);

  useEffect(() => {
    setForm({
      logoUrl: barbershop?.logoUrl || '',
      panelColor: barbershop?.panelColor || '#ffffff',
      textColor: barbershop?.textColor || '#111827',
      accentColor: barbershop?.accentColor || '#111827',
    });
  }, [barbershop]);

  async function submit(event) {
    event.preventDefault();
    await api.post('/barbershop', form);
    onSaved();
  }

  async function resetTheme() {
    setForm(defaultTheme);
    await api.post('/barbershop', defaultTheme);
    onSaved();
  }

  return (
    <div className="panel">
      <SectionTitle eyebrow="Visual" title="Customização do app" compact />
      <form className="stack-form" onSubmit={submit}>
        <input
          placeholder="Logo PNG por URL ou base64"
          value={form.logoUrl}
          onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
        />
        <div className="theme-grid">
          <label>
            Painel
            <input
              type="color"
              value={form.panelColor}
              onChange={(event) => setForm({ ...form, panelColor: event.target.value })}
            />
          </label>
          <label>
            Letras
            <input
              type="color"
              value={form.textColor}
              onChange={(event) => setForm({ ...form, textColor: event.target.value })}
            />
          </label>
          <label>
            Destaque
            <input
              type="color"
              value={form.accentColor}
              onChange={(event) => setForm({ ...form, accentColor: event.target.value })}
            />
          </label>
        </div>
        <div className="button-row">
          <button>Salvar visual</button>
          <button type="button" className="secondary-button" onClick={resetTheme}>
            Redefinir padrão
          </button>
        </div>
      </form>
    </div>
  );
}

function ScheduleSettings({ barbershop, onSaved }) {
  const [form, setForm] = useState({
    scheduleStartHour: barbershop?.scheduleStartHour ?? 8,
    scheduleEndHour: barbershop?.scheduleEndHour ?? 18,
    scheduleSlotMinutes: barbershop?.scheduleSlotMinutes ?? 60,
  });

  useEffect(() => {
    setForm({
      scheduleStartHour: barbershop?.scheduleStartHour ?? 8,
      scheduleEndHour: barbershop?.scheduleEndHour ?? 18,
      scheduleSlotMinutes: barbershop?.scheduleSlotMinutes ?? 60,
    });
  }, [barbershop]);

  async function submit(event) {
    event.preventDefault();
    await api.post('/barbershop', {
      scheduleStartHour: Number(form.scheduleStartHour),
      scheduleEndHour: Number(form.scheduleEndHour),
      scheduleSlotMinutes: Number(form.scheduleSlotMinutes),
    });
    onSaved();
  }

  return (
    <div className="panel">
      <SectionTitle eyebrow="Agenda" title="Horário padrão" compact />
      <form className="stack-form" onSubmit={submit}>
        <div className="three-columns">
          <label>
            Inicio
            <DropdownSelect
              value={form.scheduleStartHour}
              options={Array.from({ length: 24 }, (_, hour) => ({
                value: hour,
                label: `${String(hour).padStart(2, '0')}:00`,
              }))}
              onChange={(scheduleStartHour) =>
                setForm({ ...form, scheduleStartHour })
              }
              ariaLabel="Selecionar horário inicial"
            />
          </label>
          <label>
            Final
            <DropdownSelect
              value={form.scheduleEndHour}
              options={Array.from({ length: 24 }, (_, hour) => ({
                value: hour,
                label: `${String(hour).padStart(2, '0')}:00`,
              }))}
              onChange={(scheduleEndHour) =>
                setForm({ ...form, scheduleEndHour })
              }
              ariaLabel="Selecionar horário final"
            />
          </label>
          <label>
            Intervalo
            <DropdownSelect
              value={form.scheduleSlotMinutes}
              options={[15, 30, 45, 60].map((minutes) => ({
                value: minutes,
                label: `${minutes} min`,
              }))}
              onChange={(scheduleSlotMinutes) =>
                setForm({ ...form, scheduleSlotMinutes })
              }
              ariaLabel="Selecionar intervalo"
            />
          </label>
        </div>
        <button>Salvar agenda</button>
      </form>
    </div>
  );
}

function CreateProfessional({ onSaved }) {
  const [professional, setProfessional] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    commissionValue: 40,
    commissionType: 'percentage',
    color: '#f97316',
  });
  const [error, setError] = useState('');
  const issues = professional.password ? getPasswordIssues(professional.password) : [];

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (issues.length > 0) {
      setError('Complete os requisitos da senha.');
      return;
    }

    const response = await api.post('/professionals', professional);
    if (response.data.error) {
      setError(response.data.error);
      return;
    }
    setProfessional({
      name: '',
      email: '',
      contact: '',
      password: '',
      commissionValue: 40,
      commissionType: 'percentage',
      color: '#f97316',
    });
    onSaved();
  }

  return (
    <div className="panel">
      <SectionTitle eyebrow="Equipe" title="Novo funcionário" compact />
      <form className="stack-form" onSubmit={submit}>
        <input
          placeholder="Nome"
          value={professional.name}
          onChange={(event) =>
            setProfessional({ ...professional, name: event.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={professional.email}
          onChange={(event) =>
            setProfessional({ ...professional, email: event.target.value })
          }
          required
        />
        <input
          placeholder="WhatsApp"
          value={professional.contact}
          onChange={(event) =>
            setProfessional({ ...professional, contact: event.target.value })
          }
        />
        <input
          type="password"
          placeholder="Senha inicial"
          value={professional.password}
          onChange={(event) =>
            setProfessional({ ...professional, password: event.target.value })
          }
          required
        />
        {issues.length > 0 && <PasswordRules issues={issues} />}
        <label>
          Comissão
          <div className="percent-field">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={professional.commissionValue}
              onChange={(event) =>
                setProfessional({
                  ...professional,
                  commissionValue: event.target.value,
                })
              }
            />
            <span>%</span>
          </div>
        </label>
        <label>
          Cor
          <input
            type="color"
            value={professional.color}
            onChange={(event) =>
              setProfessional({ ...professional, color: event.target.value })
            }
          />
        </label>
        {error && <Message tone="error">{error}</Message>}
        <button>Adicionar funcionário</button>
      </form>
    </div>
  );
}

function ProfessionalsEditor({ professionals, onSaved }) {
  const employees = professionals.filter((professional) => !professional.ownerUserId);

  async function update(professional, field, value) {
    await api.post(`/professionals/${professional.id}`, {
      ...professional,
      [field]: value,
    });
    onSaved();
  }

  async function remove(professional) {
    await api.post(`/professionals/${professional.id}/delete`);
    onSaved();
  }

  return (
    <div className="panel wide">
      <SectionTitle eyebrow="Perfis" title="Funcionários" compact />
      {employees.length === 0 && (
        <p className="empty">Nenhum funcionário cadastrado ainda.</p>
      )}
      <div className="editable-list">
        {employees.map((professional) => (
          <div className="editable-row" key={professional.id}>
            <label>
              Nome
              <input
                defaultValue={professional.name}
                onBlur={(event) => update(professional, 'name', event.target.value)}
              />
            </label>
            <label>
              E-mail
              <input
                defaultValue={professional.email}
                onBlur={(event) => update(professional, 'email', event.target.value)}
              />
            </label>
            <label>
              Comissão
              <div className="percent-field">
                <input
                  type="number"
                  defaultValue={professional.commissionValue}
                  onBlur={(event) =>
                    update(professional, 'commissionValue', event.target.value)
                  }
                />
                <span>%</span>
              </div>
            </label>
            <label>
              Cor
              <input
                type="color"
                defaultValue={professional.color || '#f97316'}
                onBlur={(event) => update(professional, 'color', event.target.value)}
              />
            </label>
            <button
              className="danger-icon"
              onClick={() => remove(professional)}
              title="Excluir funcionário"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesEditor({ services, onSaved }) {
  const [service, setService] = useState({ name: '', price: 35 });

  async function createService(event) {
    event.preventDefault();
    await api.post('/services', {
      name: service.name,
      priceCents: Math.round(Number(service.price) * 100),
    });
    setService({ name: '', price: 35 });
    onSaved();
  }

  async function removeService(serviceId) {
    await api.post(`/services/${serviceId}/delete`);
    onSaved();
  }

  return (
    <div className="panel">
      <SectionTitle eyebrow="Serviços" title="Tabela" compact />
      <form className="stack-form" onSubmit={createService}>
        <input
          placeholder="Serviço"
          value={service.name}
          onChange={(event) => setService({ ...service, name: event.target.value })}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preco"
          value={service.price}
          onChange={(event) => setService({ ...service, price: event.target.value })}
        />
        <button>Adicionar serviço</button>
      </form>
      <div className="services-list">
        {services.map((item) => (
          <div className="service-row" key={item.id}>
            <span className="service-info">
              <span>{item.name}</span>
              <strong>{money(item.priceCents)}</strong>
            </span>
            <button
              className="service-remove-button"
              onClick={() => removeService(item.id)}
              title="Remover serviço"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action, compact }) {
  return (
    <div className={compact ? 'section-title compact-title' : 'section-title'}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function PasswordRules({ issues }) {
  return (
    <ul className="password-rules">
      {issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  );
}

function getPasswordIssues(password) {
  const value = String(password || '');
  const issues = [];

  if (value.length < 8) issues.push('Use pelo menos 8 caracteres.');
  if (!/[A-Za-z]/.test(value)) issues.push('Adicione pelo menos uma letra.');
  if (!/[0-9]/.test(value)) issues.push('Adicione pelo menos um numero.');
  if (!/[^A-Za-z0-9]/.test(value)) issues.push('Adicione pelo menos um símbolo.');

  return issues;
}

function loadSavedSession() {
  const raw =
    localStorage.getItem(savedSessionKey) ||
    sessionStorage.getItem(temporarySessionKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session, remember) {
  const value = JSON.stringify(session);
  localStorage.removeItem(savedSessionKey);
  sessionStorage.removeItem(temporarySessionKey);

  if (remember) {
    localStorage.setItem(savedSessionKey, value);
    return;
  }

  sessionStorage.setItem(temporarySessionKey, value);
}

function buildReport(appointments) {
  return appointments.reduce(
    (summary, appointment) => ({
      appointmentsCount: summary.appointmentsCount + 1,
      revenueCents: summary.revenueCents + appointment.totalCents,
      commissionCents: summary.commissionCents + appointment.commissionCents,
      netForShopCents: summary.netForShopCents + appointment.netForShopCents,
    }),
    {
      appointmentsCount: 0,
      revenueCents: 0,
      commissionCents: 0,
      netForShopCents: 0,
    },
  );
}

function buildServiceDistribution(appointments) {
  if (appointments.length === 0) {
    return [
      { label: 'Sem vendas', count: 0, percent: 0, displayPercent: 0, color: serviceDistributionColors[4] },
    ];
  }

  const counts = appointments.reduce((acc, appointment) => {
    const name = appointment.serviceName || 'Outros';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const top = entries.slice(0, 4);
  const otherCount = entries.slice(4).reduce((sum, item) => sum + item.count, 0);
  const grouped = otherCount > 0 ? [...top, { label: 'Outros', count: otherCount }] : top;

  return grouped.map((item, index) => ({
    ...item,
    percent: Math.max(1, Math.round((item.count / appointments.length) * 100)),
    displayPercent: Math.round((item.count / appointments.length) * 100),
    color: serviceDistributionColors[index] || serviceDistributionColors[serviceDistributionColors.length - 1],
  }));
}

function buildPaymentDistribution(appointments) {
  const methods = [
    { method: 'cash', label: 'Dinheiro', icon: <Banknote size={18} /> },
    { method: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard size={18} /> },
    { method: 'pix', label: 'Pix', icon: <WalletCards size={18} /> },
    { method: 'debit_card', label: 'Cartão de Débito', icon: <CreditCard size={18} /> },
  ];
  const totalCents = appointments.reduce((sum, appointment) => sum + (appointment.totalCents || 0), 0);

  return methods.map((method) => {
    const methodTotalCents = appointments
      .filter((appointment) => appointment.paymentMethod === method.method)
      .reduce((sum, appointment) => sum + (appointment.totalCents || 0), 0);

    return {
      ...method,
      totalCents: methodTotalCents,
      percent: totalCents ? Math.round((methodTotalCents / totalCents) * 100) : 0,
    };
  });
}
function buildChartItems(appointments, mode, professionals) {
  const dates = mode === 'week' ? lastNDates(7) : daysInCurrentMonth();

  return dates.map((date, index) => {
    const day = Number(date.slice(8, 10));
    const isLastMonthDay = mode === 'month' && index === dates.length - 1;
    const shouldShowMonthLabel = mode !== 'month' || day % 2 === 1 || isLastMonthDay;
    const items = appointments.filter((appointment) =>
      appointmentDateKey(appointment) === date,
    );
    const report = buildReport(items);
    const segments = professionals
      .map((professional) => {
        const professionalAppointments = items.filter(
          (appointment) => appointment.professionalId === professional.id,
        );
        const professionalReport = buildReport(professionalAppointments);
        return {
          professionalId: professional.id,
          color: professional.color || '#f97316',
          revenueCents: professionalReport.revenueCents,
          commissionCents: professionalReport.commissionCents,
        };
      })
      .filter((segment) => segment.revenueCents > 0);

    return {
      key: date,
      label: mode === 'week' ? weekdayLabel(date) : shouldShowMonthLabel ? String(day) : '',
      segments,
      ...report,
    };
  });
}

function lastNDates(amount) {
  return Array.from({ length: amount }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (amount - 1 - index));
    return toInputDate(date);
  });
}

function daysInCurrentMonth() {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) =>
    toInputDate(new Date(now.getFullYear(), now.getMonth(), index + 1)),
  );
}

function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function limitRangeStart(nextStart, currentEnd) {
  const start = new Date(`${nextStart}T00:00:00`);
  const end = new Date(`${currentEnd}T00:00:00`);
  const diff = (end - start) / 86400000;
  if (diff > 90) {
    end.setDate(end.getDate() - 90);
    return toInputDate(end);
  }
  return nextStart;
}

function limitRangeEnd(currentStart, nextEnd) {
  const start = new Date(`${currentStart}T00:00:00`);
  const end = new Date(`${nextEnd}T00:00:00`);
  const diff = (end - start) / 86400000;
  if (diff > 90) {
    start.setDate(start.getDate() + 90);
    return toInputDate(start);
  }
  return nextEnd;
}

function today() {
  return toInputDate(new Date());
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toInputDate(date);
}

function businessSlots(barbershop) {
  const startHour = clamp(Number(barbershop?.scheduleStartHour ?? 8), 0, 23);
  const endHour = clamp(Number(barbershop?.scheduleEndHour ?? 18), 0, 23);
  const slotMinutes = [15, 30, 45, 60].includes(Number(barbershop?.scheduleSlotMinutes))
    ? Number(barbershop.scheduleSlotMinutes)
    : 60;
  const start = startHour * 60;
  const end = Math.max(start, endHour * 60);
  const slots = [];

  for (let minutes = start; minutes <= end; minutes += slotMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }

  return slots;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function monthStart() {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function toInputDate(date) {
  return localDateKey(date);
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function localMonthKey(value) {
  return localDateKey(value).slice(0, 7);
}

function previousMonthKey(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number);
  return localMonthKey(new Date(year, month - 2, 1));
}

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number);
  if (!year || !month) return monthKey;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function percentageTrend(current, previous) {
  if (!previous && !current) {
    return { value: 0, direction: 'flat' };
  }

  if (!previous) {
    return { value: 0, direction: 'flat' };
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return {
    value: change,
    direction: change === 0 ? 'flat' : change < 0 ? 'down' : 'up',
  };
}

function appointmentDateKey(appointment) {
  return appointment.businessDate || localDateKey(appointment.createdAt);
}

function paymentStatusLabel(status) {
  return {
    ok: 'Ok',
    near_due: 'Quase vencendo',
    overdue: 'Vencido',
    non_paying: 'Não pagante',
  }[status] || 'Ok';
}

function scheduleDateTimeKey(value) {
  const text = String(value || '');
  if (!text.includes('Z') && text.length >= 16) {
    return text.slice(0, 16);
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text.slice(0, 16);
  }

  return `${localDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function weekdayLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '');
}

function weekdayFullLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function scheduleWeekDays(centerDate) {
  const center = new Date(`${centerDate}T12:00:00`);
  const start = new Date(center);
  start.setDate(center.getDate() - 2);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: toInputDate(date),
      day: String(date.getDate()).padStart(2, '0'),
      weekday: weekdayLabel(toInputDate(date)).slice(0, 3).toUpperCase(),
    };
  });
}

function monthCalendarDays(selectedDate) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const monthStartDate = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const gridStart = new Date(monthStartDate);
  gridStart.setDate(monthStartDate.getDate() - monthStartDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date: toInputDate(date),
      day: date.getDate(),
      currentMonth: date.getMonth() === selected.getMonth(),
    };
  });
}

function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function initials(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'BP';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`));
}

function timeOnly(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function money(cents) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);
}

function formatCompactMoney(cents) {
  const value = (cents || 0) / 100;

  if (value >= 1000) {
    return `R$ ${new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 1,
    }).format(value / 1000)} mil`;
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function getRevenueChartMaxCents(maxRevenueCents) {
  const maxRevenue = Math.max(0, maxRevenueCents / 100);
  const chartMax = Math.max(300, (Math.floor(maxRevenue / 150) + 1) * 150);
  return chartMax * 100;
}

createRoot(document.getElementById('root')).render(<App />);






















