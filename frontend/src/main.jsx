import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  Check,
  CreditCard,
  Home,
  Lock,
  Pencil,
  ReceiptText,
  Scissors,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Trash2,
  Wallet,
  LogOut,
  UserPlus,
  WalletCards,
} from 'lucide-react';
import './styles.css';

const defaultLogo =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="230" height="56" viewBox="0 0 230 56"><rect width="230" height="56" rx="12" fill="none"/><text x="12" y="36" font-family="Arial Black,Arial" font-size="23" font-weight="900" fill="white" stroke="%23111827" stroke-width="4" paint-order="stroke">BRAGA</text><text x="104" y="36" font-family="Arial Black,Arial" font-size="23" font-weight="900" fill="white" stroke="%232563eb" stroke-width="4" paint-order="stroke">BARBER</text></svg>';

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
          <RegisterScreen
            onAuthenticated={onAuthenticated}
            onBack={() => setMode('login')}
          />
        )}
      </section>
    </main>
  );
}

function LoginScreen({ onAuthenticated, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

function PageTitle({ title }) {
  return <h1 className="page-title">{title}</h1>;
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
        <MetricPanel
          title="Receita mensal"
          value={money(summary?.monthlyRecurringRevenueCents || 0)}
        />
        <MetricPanel title="Atendimentos" value={summary?.appointmentsCount || 0} />
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
            <span>Status</span>
            <span>Mensalidade</span>
            <span>Atendimentos</span>
            <span>Observações</span>
          </div>
          {barbershops.map((item) => (
            <div className="admin-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.ownerName}</span>
              <span>{item.partnerCode || 'Sem cupom'}</span>
              <select
                value={item.status}
                onChange={(event) => updateClient(item, { status: event.target.value })}
              >
                <option value="trial">Teste</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
                <option value="canceled">Cancelado</option>
              </select>
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
  }

  useEffect(() => {
    activeBarbershopId = user.barbershopId;
    loadData().catch(() => {});
    return () => {
      activeBarbershopId = null;
    };
  }, [user.barbershopId]);

  const visibleAppointments = useMemo(
    () => scopeAppointmentsByUser(appointments, user),
    [appointments, user],
  );

  const menu = [
    { id: 'payments', label: 'Pagamentos', icon: <WalletCards size={23} /> },
    { id: 'schedule', label: 'Agendamentos', icon: <CalendarClock size={23} /> },
    { id: 'management', label: 'Gestão', icon: <BarChart3 size={23} /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={23} /> },
  ];

  return (
    <main
      className="app-shell"
      style={{
        '--panel-color': barbershop?.panelColor || '#ffffff',
        '--text-color': barbershop?.textColor || '#111827',
        '--accent-color': barbershop?.accentColor || '#111827',
      }}
    >
      <nav className="app-nav">
        <div className="nav-brand">
          <Scissors size={22} />
        </div>
        {menu.map((item) => (
          <button
            key={item.id}
            className={screen === item.id ? 'active' : ''}
            onClick={() => setScreen(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}
      </nav>

      <section className="app-content">
        <header className="mobile-header">
          <div className="brand-header">
            <p className="eyebrow">IA Dreams</p>
            <img
              src={barbershop?.logoUrl || defaultLogo}
              alt={barbershop?.name || 'IA Dreams'}
            />
          </div>
          <div className="logged-user compact-user">
            <strong>{barbershop?.ownerName || user.name}</strong>
            <button type="button" onClick={onLogout} title="Sair">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {screen === 'payments' && (
          <PaymentsScreen
            user={user}
            professionals={professionals}
            services={services}
            onSaved={loadData}
          />
        )}

        {screen === 'schedule' && (
          <>
            <PageTitle title="Agendamentos" />
            <ScheduleScreen
              professionals={professionals}
              schedules={schedules}
              barbershop={barbershop}
              onSaved={loadData}
            />
          </>
        )}

        {screen === 'management' && (
          <>
            <PageTitle title="Gestão" />
            <ManagementScreen
              user={user}
              barbershop={barbershop}
              professionals={professionals}
              appointments={appointments}
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

        {screen === 'settings' && (
          <>
            <PageTitle title="Configurações" />
            <SettingsScreen
              user={user}
              barbershop={barbershop}
              users={users}
              professionals={professionals}
              services={services}
              costs={costs}
              onSaved={loadData}
            />
          </>
        )}
      </section>
    </main>
  );
}

function PaymentsScreen({ user, professionals, services, onSaved }) {
  const canOwnerChoose = user.role === 'owner' && professionals.length > 1;
  const defaultProfessionalId =
    user.role === 'barber'
      ? user.professionalId
      : user.professionalId || professionals[0]?.id || '';
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId);
  const [serviceId, setServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!professionalId && defaultProfessionalId) {
      setProfessionalId(defaultProfessionalId);
    }
  }, [defaultProfessionalId, professionalId]);

  const selectedService = services.find((service) => service.id === serviceId);
  const isOther = serviceId === 'other';
  const amountCents = isOther
    ? Math.round(Number(customPrice || 0) * 100)
    : selectedService?.priceCents || 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!professionalId) {
      setError('Selecione ou cadastre um profissional antes de cobrar.');
      return;
    }

    if (!serviceId) {
      setError('Selecione um serviço.');
      return;
    }

    if (amountCents <= 0) {
      setError('Informe um valor valido.');
      return;
    }

    const response = await api.post('/appointments', {
      professionalId,
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

  return (
    <div className="screen-column">
      <SectionTitle
        eyebrow="Pagamentos"
        title="Registrar atendimento"
        action={saved ? <span className="success-pill">Salvo</span> : null}
      />

      <form className="panel quick-form" onSubmit={handleSubmit}>
        {canOwnerChoose && (
          <label>
            Profissional
            <select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
              required
            >
              <option value="">Selecione</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Serviço
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            required
          >
            <option value="">Selecione</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {money(service.priceCents)}
              </option>
            ))}
            <option value="other">Outro</option>
          </select>
        </label>

        {isOther && (
          <div className="two-columns">
            <label>
              Descrição
              <input
                value={customServiceName}
                placeholder="Ex.: Produto, ajuste, pacote"
                onChange={(event) => setCustomServiceName(event.target.value)}
              />
            </label>
            <label>
              Valor livre
              <input
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(event) => setCustomPrice(event.target.value)}
                required
              />
            </label>
          </div>
        )}

        <div className="payment-grid">
          {Object.entries(paymentLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={paymentMethod === value ? 'active' : ''}
              onClick={() => setPaymentMethod(value)}
            >
              {value.includes('card') ? <CreditCard size={18} /> : <Banknote size={18} />}
              {label}
            </button>
          ))}
        </div>

        {error && <Message tone="error">{error}</Message>}

        <button className="primary-action" disabled={!amountCents}>
          <Check size={20} />
          Cobrar {amountCents ? money(amountCents) : ''}
        </button>
      </form>
    </div>
  );
}

function ScheduleScreen({ professionals, schedules, barbershop, onSaved }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!professionalId && professionals[0]?.id) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionalId, professionals]);

  useEffect(() => {
    const nextDrafts = {};
    for (const slot of businessSlots(barbershop)) {
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
  }, [barbershop, professionalId, schedules, selectedDate]);

  function updateDraft(startsAt, field, value) {
    setDrafts((current) => ({
      ...current,
      [startsAt]: {
        ...current[startsAt],
        [field]: value,
      },
    }));
  }

  async function saveLine(startsAt) {
    if (!professionalId) return;

    const draft = drafts[startsAt] || {};
    await api.post('/schedules', {
      professionalId,
      startsAt,
      clientName: draft.clientName || '',
      clientContact: draft.clientContact || '',
      serviceName: draft.serviceName || '',
    });
    onSaved();
  }

  return (
    <div className="screen-column">
      <div className="agenda-toolbar">
        <button
          className={selectedDate === today() ? 'active' : ''}
          onClick={() => setSelectedDate(today())}
        >
          Hoje
        </button>
        <button
          className={selectedDate === tomorrow() ? 'active' : ''}
          onClick={() => setSelectedDate(tomorrow())}
        >
          Amanhã
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
        <select
          value={professionalId}
          onChange={(event) => setProfessionalId(event.target.value)}
        >
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </select>
      </div>

      <section className="panel agenda-panel">
        <div className="agenda-grid agenda-head">
          <span>Horário</span>
          <span>Nome</span>
          <span>Contato</span>
          <span>Serviço</span>
          <span>Status</span>
        </div>
        {businessSlots(barbershop).map((slot) => {
          const startsAt = `${selectedDate}T${slot}`;
          const draft = drafts[startsAt] || {};
          const isClosed = Boolean(
            draft.clientName || draft.clientContact || draft.serviceName,
          );

          return (
            <div className="agenda-grid agenda-line" key={startsAt}>
              <strong>{slot}</strong>
              <input
                value={draft.clientName || ''}
                onChange={(event) => updateDraft(startsAt, 'clientName', event.target.value)}
                onBlur={() => saveLine(startsAt)}
                placeholder="Nome"
              />
              <input
                value={draft.clientContact || ''}
                onChange={(event) => updateDraft(startsAt, 'clientContact', event.target.value)}
                onBlur={() => saveLine(startsAt)}
                placeholder="Contato"
              />
              <input
                value={draft.serviceName || ''}
                onChange={(event) => updateDraft(startsAt, 'serviceName', event.target.value)}
                onBlur={() => saveLine(startsAt)}
                placeholder="Serviço"
              />
              <span
                className={isClosed ? 'status closed' : 'status open'}
                title={isClosed ? 'Agendado' : 'Aberto'}
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ManagementScreen({
  user,
  barbershop,
  professionals,
  appointments,
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
  const [showScopePicker, setShowScopePicker] = useState(false);
  const [scopeProfessionalId, setScopeProfessionalId] = useState('all');

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
  const scopeName =
    scopeProfessionalId === 'all'
      ? barbershop?.name || 'Barbearia'
      : professionals.find((item) => item.id === scopeProfessionalId)?.name || 'Profissional';

  return (
    <div className="screen-column">
      {user.role === 'owner' && (
        <div className="scope-control">
          <button onClick={() => setShowScopePicker(!showScopePicker)}>
            {scopeName}
          </button>
          {showScopePicker && (
            <div className="scope-menu">
              <button onClick={() => { setScopeProfessionalId('all'); setShowScopePicker(false); }}>
                Toda barbearia
              </button>
              {professionals.map((professional) => (
                <button
                  key={professional.id}
                  onClick={() => {
                    setScopeProfessionalId(professional.id);
                    setShowScopePicker(false);
                  }}
                >
                  <span
                    className="color-dot"
                    style={{ background: professional.color || '#111827' }}
                  />
                  {professional.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <section className="panel chart-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Faturamento</p>
            <h2>{chartMode === 'week' ? 'Semana' : 'Mês todo'}</h2>
          </div>
          <div className="segmented">
            <button
              className={chartMode === 'week' ? 'active' : ''}
              onClick={() => setChartMode('week')}
            >
              Semana
            </button>
            <button
              className={chartMode === 'month' ? 'active' : ''}
              onClick={() => setChartMode('month')}
            >
              Mês
            </button>
          </div>
        </div>
        <RevenueChart items={chartItems} />
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

function RevenueChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.revenueCents), 1);

  return (
    <div className="chart">
      {items.map((item) => {
        const height = Math.max(8, Math.round((item.revenueCents / maxValue) * 150));
        const totalCommission = item.segments.reduce(
          (sum, segment) => sum + segment.commissionCents,
          0,
        );
        let topOffset = 0;

        return (
          <div className="chart-item" key={item.key}>
            <div className="bar-track" title={`${item.label}: ${money(item.revenueCents)}`}>
              <div className="bar" style={{ height }}>
                {item.segments.map((segment) => {
                  const segmentHeight =
                    totalCommission > 0
                      ? Math.max(
                          4,
                          Math.round((segment.commissionCents / item.revenueCents) * height),
                        )
                      : 0;
                  const style = {
                    background: segment.color,
                    height: segmentHeight,
                    top: topOffset,
                  };
                  topOffset += segmentHeight;
                  return (
                    <span
                      key={segment.professionalId}
                      className="bar-commission"
                      style={style}
                    />
                  );
                })}
              </div>
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
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
            <div className="icon-picker single-picker">
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
              placeholder="Descrição"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Custo"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              required
            />
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option value="variable">Variável</option>
              <option value="fixed">Fixo mensal</option>
            </select>
            <button>{editingId ? 'Atualizar' : 'Adicionar'}</button>
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
    <div className="screen-column">
      <SectionTitle
        eyebrow="Financeiro"
        title="Fechamento de caixa"
        action={
          <button className="back-inline" onClick={onBack}>
            <ArrowLeft size={18} />
            Voltar
          </button>
        }
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
        <Metric label="Liquido loja" value={money(report.netForShopCents)} />
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
  onSaved,
}) {
  const isOwner = user.role === 'owner';
  const [tab, setTab] = useState('company');

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
            <select
              value={form.scheduleStartHour}
              onChange={(event) =>
                setForm({ ...form, scheduleStartHour: event.target.value })
              }
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            Final
            <select
              value={form.scheduleEndHour}
              onChange={(event) =>
                setForm({ ...form, scheduleEndHour: event.target.value })
              }
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            Intervalo
            <select
              value={form.scheduleSlotMinutes}
              onChange={(event) =>
                setForm({ ...form, scheduleSlotMinutes: event.target.value })
              }
            >
              {[15, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
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
      <div className="compact-list">
        {services.map((item) => (
          <span key={item.id}>
            {item.name} <strong>{money(item.priceCents)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action, compact }) {
  return (
    <div className={compact ? 'section-title compact-title' : 'section-title'}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
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
  if (!/[^A-Za-z0-9]/.test(value)) issues.push('Adicione pelo menos um simbolo.');

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

function scopeAppointmentsByUser(appointments, user) {
  if (user.role === 'owner') return appointments;
  return appointments.filter((item) => item.professionalId === user.professionalId);
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

function buildChartItems(appointments, mode, professionals) {
  const dates = mode === 'week' ? lastNDates(7) : daysInCurrentMonth();

  return dates.map((date) => {
    const items = appointments.filter((appointment) =>
      appointmentDateKey(appointment) === date,
    );
    const report = buildReport(items);
    const segments = professionals
      .map((professional) => {
        const professionalAppointments = items.filter(
          (appointment) => appointment.professionalId === professional.id,
        );
        return {
          professionalId: professional.id,
          color: professional.color || '#f97316',
          commissionCents: buildReport(professionalAppointments).commissionCents,
        };
      })
      .filter((segment) => segment.commissionCents > 0);

    return {
      key: date,
      label: mode === 'week' ? weekdayLabel(date) : String(Number(date.slice(8, 10))),
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

function appointmentDateKey(appointment) {
  return appointment.businessDate || localDateKey(appointment.createdAt);
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

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`));
}

function timeOnly(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function screenTitle(screen) {
  return {
    payments: 'Pagamentos',
    schedule: 'Agendamentos',
    management: 'Gestão',
    settings: 'Configurações',
    closing: 'Fechamento',
  }[screen];
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
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

createRoot(document.getElementById('root')).render(<App />);
