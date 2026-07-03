const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { Injectable } = require('@nestjs/common');

const paymentMethods = ['cash', 'pix', 'credit_card', 'debit_card'];
const supportEmail = 'suporte@azaroseu';
const supportPhone = '9999-9999';
const passwordCodeTtlMs = 10 * 60 * 1000;
const validPartnerCodes = {
  BRAGA: {
    code: 'BRAGA',
    label: 'Parceiro Braga',
    monthlyPriceCents: 0,
  },
};
const professionalColors = ['#f97316', '#2563eb', '#16a34a', '#a855f7', '#e11d48'];

const state = {
  barbershop: {
    id: 'shop-1',
    name: 'Braga Barber',
    ownerName: 'Braga',
    contact: '9999-9999',
    partnerCode: null,
    logoUrl: '',
    panelColor: '#ffffff',
    textColor: '#111827',
    accentColor: '#111827',
    scheduleStartHour: 8,
    scheduleEndHour: 18,
    scheduleSlotMinutes: 60,
    status: 'active',
    adminNotes: '',
    monthlyPriceCents: 2990,
  },
  barbershops: [],
  users: [
    {
      id: 'user-admin',
      name: 'IA Dreams Admin',
      email: 'admin@iadreams.com',
      password: 'Admin@123',
      role: 'admin',
      professionalId: null,
      barbershopId: null,
    },
    {
      id: 'user-owner',
      name: 'Braga',
      email: 'braga@gmail.com',
      password: 'Acesso@123',
      role: 'owner',
      professionalId: 'pro-owner',
      barbershopId: 'shop-1',
    },
  ],
  professionals: [
    {
      id: 'pro-owner',
      barbershopId: 'shop-1',
      name: 'Braga',
      email: 'braga@gmail.com',
      contact: '9999-9999',
      color: '#111827',
      commissionType: 'percentage',
      commissionValue: 0,
      ownerUserId: 'user-owner',
      active: true,
    },
  ],
  services: [
    {
      id: 'svc-1',
      barbershopId: 'shop-1',
      name: 'Corte',
      priceCents: 3500,
      active: true,
    },
    {
      id: 'svc-2',
      barbershopId: 'shop-1',
      name: 'Barba',
      priceCents: 2500,
      active: true,
    },
  ],
  appointments: [],
  schedules: [],
  costs: [],
  passwordRecoveries: {},
};

state.barbershops = [state.barbershop];

const persistenceKey = 'solution-barber-state';
let pool = null;
let persistenceReady = false;
let persistenceTimer = null;

async function initializePersistentState() {
  if (!process.env.DATABASE_URL || persistenceReady) {
    persistenceReady = true;
    return;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await pool.query(`
    create table if not exists app_state (
      key varchar(80) primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  const result = await pool.query('select data from app_state where key = $1', [persistenceKey]);
  if (result.rows[0]?.data) {
    Object.assign(state, result.rows[0].data);
  } else {
    await persistState();
  }

  persistenceReady = true;
}

async function persistState() {
  if (!pool) {
    return;
  }

  await pool.query(
    `
      insert into app_state (key, data, updated_at)
      values ($1, $2, now())
      on conflict (key)
      do update set data = excluded.data, updated_at = now()
    `,
    [persistenceKey, JSON.stringify(state)],
  );
}

function schedulePersist() {
  if (!pool || !persistenceReady) {
    return;
  }

  clearTimeout(persistenceTimer);
  persistenceTimer = setTimeout(() => {
    persistState().catch((error) => {
      console.error('Nao foi possivel salvar no PostgreSQL:', error.message);
    });
  }, 100);
}

class BarberShopService {
  login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const user = state.users.find(
      (item) => normalizeEmail(item.email) === normalizedEmail && item.password === password,
    );

    if (!user) {
      return { error: 'Credenciais invalidas.' };
    }

    const userBarbershop = user.barbershopId
      ? state.barbershops.find((item) => item.id === user.barbershopId)
      : null;
    if (userBarbershop && ['blocked', 'canceled'].includes(userBarbershop.status)) {
      return { error: 'Conta bloqueada. Entre em contato com a IA Dreams.' };
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        professionalId: user.professionalId,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        professionalId: user.professionalId,
        barbershopId: user.barbershopId,
      },
    };
  }

  getAdminSummary() {
    const barbershops = this.listAdminBarbershops();
    const activeClients = barbershops.filter((item) => item.status === 'active').length;
    const monthlyRecurringRevenueCents = barbershops.reduce(
      (sum, item) => sum + item.monthlyPriceCents,
      0,
    );

    return {
      clientsCount: barbershops.length,
      activeClients,
      trialClients: barbershops.filter((item) => item.status === 'trial').length,
      canceledClients: barbershops.filter((item) => item.status === 'canceled').length,
      blockedClients: barbershops.filter((item) => item.status === 'blocked').length,
      monthlyRecurringRevenueCents,
      appointmentsCount: state.appointments.length,
      professionalsCount: state.professionals.length,
    };
  }

  listAdminBarbershops() {
    return state.barbershops.map((barbershop) => {
      const owner = state.users.find(
        (user) => user.role === 'owner' && user.barbershopId === barbershop.id,
      );
      const professionals = state.professionals.filter(
        (professional) =>
          professional.barbershopId === barbershop.id ||
          professional.ownerUserId === owner?.id,
      );
      const appointments = state.appointments.filter(
        (appointment) => appointment.barbershopId === barbershop.id,
      );
      const schedules = state.schedules.filter(
        (schedule) => schedule.barbershopId === barbershop.id,
      );
      const costs = state.costs.filter((cost) => cost.barbershopId === barbershop.id);
      const revenueCents = appointments.reduce(
        (sum, appointment) => sum + appointment.totalCents,
        0,
      );
      const lastAppointment = appointments
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        id: barbershop.id,
        name: barbershop.name,
        ownerName: barbershop.ownerName,
        contact: barbershop.contact,
        email: owner?.email || '',
        status: barbershop.status || 'active',
        plan: barbershop.monthlyPriceCents === 0 ? 'Parceiro BRAGA' : 'R$ 29,90',
        partnerCode: barbershop.partnerCode,
        monthlyPriceCents: barbershop.monthlyPriceCents,
        adminNotes: barbershop.adminNotes || '',
        professionalsCount: professionals.length,
        appointmentsCount: appointments.length,
        schedulesCount: schedules.length,
        costsCount: costs.length,
        revenueCents,
        lastActivityAt: lastAppointment?.createdAt || null,
      };
    });
  }

  updateAdminBarbershop(barbershopId, body) {
    const barbershop = state.barbershops.find((item) => item.id === barbershopId);

    if (!barbershop) {
      return { error: 'Barbearia nao encontrada.' };
    }

    const allowedStatuses = ['trial', 'active', 'blocked', 'canceled'];
    if (body.status && allowedStatuses.includes(body.status)) {
      barbershop.status = body.status;
    }

    if (body.monthlyPriceCents !== undefined) {
      barbershop.monthlyPriceCents = Number(body.monthlyPriceCents || 0);
    }

    if (body.partnerCode !== undefined) {
      barbershop.partnerCode = normalizePartnerCode(body.partnerCode);
    }

    if (body.adminNotes !== undefined) {
      barbershop.adminNotes = body.adminNotes;
    }

    schedulePersist();
    return barbershop;
  }

  registerOwner(body) {
    const email = normalizeEmail(body.email);
    const partnerCode = normalizePartnerCode(body.partnerCode);

    if (!body.name || !body.barbershopName || !email || !body.contact || !body.password) {
      return { error: 'Preencha todos os campos obrigatorios.' };
    }

    const passwordError = validateStrongPassword(body.password);
    if (passwordError) {
      return { error: passwordError };
    }

    if (body.password !== body.confirmPassword) {
      return { error: 'As senhas nao conferem.' };
    }

    if (state.users.some((user) => normalizeEmail(user.email) === email)) {
      return { error: 'Este e-mail ja esta cadastrado.' };
    }

    if (partnerCode && !validPartnerCodes[partnerCode]) {
      return { error: 'Codigo de parceiro invalido.' };
    }

    const partner = partnerCode ? validPartnerCodes[partnerCode] : null;
    const barbershop = {
      id: `shop-${Date.now()}`,
      name: body.barbershopName,
      ownerName: body.name,
      contact: body.contact,
      partnerCode: partner?.code || null,
      logoUrl: '',
      panelColor: '#ffffff',
      textColor: '#111827',
      accentColor: '#111827',
      scheduleStartHour: 8,
      scheduleEndHour: 18,
      scheduleSlotMinutes: 60,
      status: 'trial',
      adminNotes: '',
      monthlyPriceCents: partner?.monthlyPriceCents ?? 2990,
    };

    state.barbershop = barbershop;
    state.barbershops.push(barbershop);

    const professionalId = `pro-${Date.now()}`;
    const user = {
      id: `user-${Date.now()}`,
      name: body.name,
      email,
      password: body.password,
      role: 'owner',
      professionalId,
      barbershopId: barbershop.id,
    };

    state.users.push(user);
    state.professionals.push({
      id: professionalId,
      barbershopId: barbershop.id,
      name: body.name,
      email,
      contact: body.contact,
      color: '#111827',
      commissionType: 'percentage',
      commissionValue: 0,
      ownerUserId: user.id,
      active: true,
    });
    state.services.push(
      {
        id: `svc-${Date.now()}-1`,
        barbershopId: barbershop.id,
        name: 'Corte',
        priceCents: 3500,
        active: true,
      },
      {
        id: `svc-${Date.now()}-2`,
        barbershopId: barbershop.id,
        name: 'Barba',
        priceCents: 2500,
        active: true,
      },
    );

    schedulePersist();
    return {
      message: 'Conta criada com sucesso.',
      barbershop,
      ...this.login({ email, password: body.password }),
    };
  }

  requestPasswordCode({ email }) {
    const normalizedEmail = normalizeEmail(email);
    const user = state.users.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const currentRecovery = state.passwordRecoveries[normalizedEmail];
    const expiredCount = currentRecovery?.expiredCount || 0;

    if (expiredCount >= 5) {
      return supportResponse();
    }

    if (!user) {
      return {
        message: 'Se o e-mail estiver cadastrado, enviaremos um codigo de verificacao.',
      };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    state.passwordRecoveries[normalizedEmail] = {
      code,
      attempts: 0,
      expiredCount,
      expiresAt: Date.now() + passwordCodeTtlMs,
      verified: false,
    };

    schedulePersist();
    return {
      message: 'Codigo de verificacao enviado.',
      // Apenas para o MVP local. Depois isso sai e entra envio real por e-mail.
      debugCode: code,
      expiresInMinutes: 10,
    };
  }

  verifyPasswordCode({ email, code }) {
    const normalizedEmail = normalizeEmail(email);
    const recovery = state.passwordRecoveries[normalizedEmail];

    if (!recovery) {
      return { error: 'Solicite um novo codigo de verificacao.' };
    }

    if (recovery.expiredCount >= 5 || recovery.attempts >= 3) {
      return supportResponse();
    }

    if (Date.now() > recovery.expiresAt) {
      recovery.expiredCount += 1;
      return recovery.expiredCount >= 5
        ? supportResponse()
        : { error: 'Codigo expirado. Solicite um novo codigo.' };
    }

    if (String(code).trim() !== recovery.code) {
      recovery.attempts += 1;
      return recovery.attempts >= 3
        ? supportResponse()
        : { error: 'Codigo invalido. Confira e tente novamente.' };
    }

    recovery.verified = true;
    schedulePersist();
    return { message: 'Codigo confirmado.' };
  }

  resetPassword({ email, code, password, confirmPassword }) {
    const normalizedEmail = normalizeEmail(email);
    const recovery = state.passwordRecoveries[normalizedEmail];
    const user = state.users.find((item) => normalizeEmail(item.email) === normalizedEmail);

    if (!recovery || !recovery.verified || String(code).trim() !== recovery.code) {
      return { error: 'Confirme o codigo antes de criar uma nova senha.' };
    }

    if (!user) {
      return { error: 'Nao foi possivel redefinir a senha.' };
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return { error: passwordError };
    }

    if (password !== confirmPassword) {
      return { error: 'As senhas nao conferem.' };
    }

    user.password = password;
    delete state.passwordRecoveries[normalizedEmail];

    schedulePersist();
    return { message: 'Senha alterada com sucesso.' };
  }

  getBarberShop(barbershopId) {
    return findBarbershop(barbershopId);
  }

  updateBarberShop(body) {
    const barbershop = findBarbershop(body.barbershopId);
    Object.assign(barbershop, {
      ...body,
    });

    if (state.barbershop.id === barbershop.id) {
      state.barbershop = barbershop;
    }

    schedulePersist();
    return barbershop;
  }

  listProfessionals(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.professionals.filter((item) => item.barbershopId === targetBarbershopId);
  }

  createProfessional(body) {
    const email = normalizeEmail(body.email);
    const passwordError = body.password ? validateStrongPassword(body.password) : null;

    if (passwordError) {
      return { error: passwordError };
    }

    if (email && state.users.some((user) => normalizeEmail(user.email) === email)) {
      return { error: 'Este e-mail ja esta cadastrado.' };
    }

    const professional = {
      id: `pro-${Date.now()}`,
      barbershopId: getTargetBarbershopId(body.barbershopId),
      name: body.name,
      email,
      contact: body.contact || '',
      color: body.color || nextProfessionalColor(),
      commissionType: body.commissionType || 'percentage',
      commissionValue: Number(body.commissionValue || 0),
      active: true,
    };

    state.professionals.push(professional);

    if (email) {
      state.users.push({
        id: `user-${Date.now()}`,
        name: body.name,
        email,
        password: body.password || '123456',
        role: 'barber',
        professionalId: professional.id,
        barbershopId: professional.barbershopId,
      });
    }

    schedulePersist();
    return professional;
  }

  updateProfessional(professionalId, body) {
    const professional = state.professionals.find((item) => item.id === professionalId);

    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    Object.assign(professional, {
      ...body,
      commissionValue:
        body.commissionValue === undefined
          ? professional.commissionValue
          : Number(body.commissionValue || 0),
    });

    const user = state.users.find((item) => item.professionalId === professionalId);
    if (user) {
      user.name = professional.name;
      user.email = normalizeEmail(professional.email);
      if (body.password) {
        const passwordError = validateStrongPassword(body.password);
        if (passwordError) {
          return { error: passwordError };
        }
        user.password = body.password;
      }
    }

    schedulePersist();
    return professional;
  }

  deleteProfessional(professionalId) {
    const professional = state.professionals.find((item) => item.id === professionalId);

    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    if (professional.ownerUserId) {
      return { error: 'O perfil do dono nao pode ser removido.' };
    }

    state.professionals = state.professionals.filter((item) => item.id !== professionalId);
    state.users = state.users.filter((item) => item.professionalId !== professionalId);

    schedulePersist();
    return { message: 'Funcionario removido.' };
  }

  listUsers(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.users.filter((user) => user.barbershopId === targetBarbershopId).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professionalId: user.professionalId,
      barbershopId: user.barbershopId,
    }));
  }

  updateUser(userId, body) {
    const user = state.users.find((item) => item.id === userId);

    if (!user) {
      return { error: 'Usuario nao encontrado.' };
    }

    if (body.password) {
      const passwordError = validateStrongPassword(body.password);
      if (passwordError) {
        return { error: passwordError };
      }
      user.password = body.password;
    }

    user.name = body.name || user.name;
    user.email = body.email ? normalizeEmail(body.email) : user.email;

    const professional = state.professionals.find((item) => item.id === user.professionalId);
    if (professional) {
      professional.name = user.name;
      professional.email = user.email;
      professional.contact = body.contact || professional.contact;
    }

    schedulePersist();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professionalId: user.professionalId,
      barbershopId: user.barbershopId,
    };
  }

  listServices(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.services.filter((item) => item.barbershopId === targetBarbershopId);
  }

  createService(body) {
    const service = {
      id: `svc-${Date.now()}`,
      barbershopId: getTargetBarbershopId(body.barbershopId),
      name: body.name,
      priceCents: Number(body.priceCents || 0),
      active: true,
    };

    state.services.push(service);
    schedulePersist();
    return service;
  }

  createAppointment(body) {
    const professional = state.professionals.find(
      (item) => item.id === body.professionalId,
    );
    const isOtherService = body.serviceId === 'other';
    const service = isOtherService
      ? null
      : state.services.find((item) => item.id === body.serviceId);

    if (!professional || (!service && !isOtherService)) {
      return { error: 'Profissional ou servico nao encontrado.' };
    }

    if (!paymentMethods.includes(body.paymentMethod)) {
      return { error: 'Forma de pagamento invalida.' };
    }

    const totalCents = Number(body.totalCents || service?.priceCents || 0);
    if (totalCents <= 0) {
      return { error: 'Informe um valor valido.' };
    }

    const commissionCents = calculateCommissionCents({
      totalCents,
      commissionType: professional.commissionType,
      commissionValue: professional.commissionValue,
    });

    const appointment = {
      id: `att-${Date.now()}`,
      barbershopId: professional.barbershopId || state.barbershop.id,
      professionalId: professional.id,
      professionalName: professional.name,
      serviceId: service?.id || 'other',
      serviceName: service?.name || body.serviceName || 'Outro',
      paymentMethod: body.paymentMethod,
      totalCents,
      commissionCents,
      netForShopCents: totalCents - commissionCents,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    state.appointments.push(appointment);
    schedulePersist();
    return appointment;
  }

  listAppointments(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.appointments
      .filter((item) => item.barbershopId === targetBarbershopId)
      .slice()
      .reverse();
  }

  listSchedules(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.schedules
      .filter((item) => item.barbershopId === targetBarbershopId)
      .slice()
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  createSchedule(body) {
    const professional = state.professionals.find((item) => item.id === body.professionalId);

    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    if (!body.startsAt) {
      return { error: 'Informe o horario.' };
    }

    const existing = state.schedules.find(
      (item) =>
        item.professionalId === professional.id &&
        item.startsAt === body.startsAt,
    );
    const isOpen = !body.clientName && !body.clientContact && !body.serviceName && !body.notes;

    if (existing) {
      if (isOpen) {
        state.schedules = state.schedules.filter((item) => item.id !== existing.id);
        schedulePersist();
        return { message: 'Horario aberto.', status: 'open' };
      }

      Object.assign(existing, {
        clientName: body.clientName || '',
        clientContact: body.clientContact || '',
        serviceName: body.serviceName || '',
        notes: body.notes || '',
        status: 'closed',
      });
      schedulePersist();
      return existing;
    }

    if (isOpen) {
      return { message: 'Horario aberto.', status: 'open' };
    }

    const schedule = {
      id: `sch-${Date.now()}`,
      barbershopId: professional.barbershopId || state.barbershop.id,
      clientName: body.clientName || '',
      clientContact: body.clientContact || '',
      serviceName: body.serviceName || '',
      professionalId: professional.id,
      professionalName: professional.name,
      startsAt: body.startsAt,
      notes: body.notes || '',
      status: 'closed',
      createdAt: new Date().toISOString(),
    };

    state.schedules.push(schedule);
    schedulePersist();
    return schedule;
  }

  deleteSchedule(scheduleId) {
    state.schedules = state.schedules.filter((item) => item.id !== scheduleId);
    schedulePersist();
    return { message: 'Agendamento removido.' };
  }

  listCosts(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.costs
      .filter((item) => item.barbershopId === targetBarbershopId)
      .slice()
      .sort((a, b) => a.description.localeCompare(b.description));
  }

  createCost(body) {
    const amountCents = Number(body.amountCents || 0);

    if (!body.description || amountCents <= 0) {
      return { error: 'Informe descricao e custo.' };
    }

    const cost = {
      id: `cost-${Date.now()}`,
      barbershopId: getTargetBarbershopId(body.barbershopId),
      icon: body.icon || 'home',
      description: body.description,
      amountCents,
      type: body.type === 'fixed' ? 'fixed' : 'variable',
      createdAt: new Date().toISOString(),
    };

    state.costs.push(cost);
    schedulePersist();
    return cost;
  }

  updateCost(costId, body) {
    const cost = state.costs.find((item) => item.id === costId);

    if (!cost) {
      return { error: 'Custo nao encontrado.' };
    }

    Object.assign(cost, {
      icon: body.icon || cost.icon,
      description: body.description || cost.description,
      amountCents:
        body.amountCents === undefined ? cost.amountCents : Number(body.amountCents || 0),
      type: body.type === 'fixed' ? 'fixed' : 'variable',
    });

    schedulePersist();
    return cost;
  }

  deleteCost(costId) {
    state.costs = state.costs.filter((item) => item.id !== costId);
    schedulePersist();
    return { message: 'Custo removido.' };
  }

  getReport({ period, date, month }) {
    const filtered = state.appointments.filter((appointment) => {
      if (period === 'daily') {
        const targetDate = date || new Date().toISOString().slice(0, 10);
        return appointment.createdAt.slice(0, 10) === targetDate;
      }

      const targetMonth = month || new Date().toISOString().slice(0, 7);
      return appointment.createdAt.slice(0, 7) === targetMonth;
    });

    return buildReport(filtered);
  }

  getProfessionalCommission({ professionalId, month }) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const appointments = state.appointments.filter(
      (appointment) =>
        appointment.professionalId === professionalId &&
        appointment.createdAt.slice(0, 7) === targetMonth,
    );

    return {
      professionalId,
      month: targetMonth,
      ...buildReport(appointments),
    };
  }
}

Injectable()(BarberShopService);

function calculateCommissionCents({
  totalCents,
  commissionType,
  commissionValue,
}) {
  if (commissionType === 'fixed') {
    return Math.round(Number(commissionValue || 0) * 100);
  }

  return Math.round(totalCents * (Number(commissionValue || 0) / 100));
}

function buildReport(appointments) {
  const summary = {
    appointmentsCount: appointments.length,
    revenueCents: 0,
    commissionCents: 0,
    netForShopCents: 0,
    byPaymentMethod: {},
    byProfessional: {},
  };

  for (const appointment of appointments) {
    summary.revenueCents += appointment.totalCents;
    summary.commissionCents += appointment.commissionCents;
    summary.netForShopCents += appointment.netForShopCents;

    const payment = summary.byPaymentMethod[appointment.paymentMethod] || {
      count: 0,
      revenueCents: 0,
    };
    payment.count += 1;
    payment.revenueCents += appointment.totalCents;
    summary.byPaymentMethod[appointment.paymentMethod] = payment;

    const professional = summary.byProfessional[appointment.professionalId] || {
      professionalName: appointment.professionalName,
      count: 0,
      revenueCents: 0,
      commissionCents: 0,
    };
    professional.count += 1;
    professional.revenueCents += appointment.totalCents;
    professional.commissionCents += appointment.commissionCents;
    summary.byProfessional[appointment.professionalId] = professional;
  }

  return summary;
}

module.exports = { BarberShopService, initializePersistentState };

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePartnerCode(code) {
  return String(code || '').trim().toUpperCase();
}

function supportResponse() {
  return {
    error: `Por seguranca, nao foi possivel continuar. Fale com ${supportEmail} ou ${supportPhone}.`,
    supportEmail,
    supportPhone,
  };
}

function nextProfessionalColor() {
  const used = new Set(state.professionals.map((item) => item.color));
  return professionalColors.find((color) => !used.has(color)) || professionalColors[state.professionals.length % professionalColors.length];
}

function findBarbershop(barbershopId) {
  return state.barbershops.find((item) => item.id === barbershopId) || state.barbershop;
}

function getTargetBarbershopId(barbershopId) {
  return barbershopId || state.barbershop.id;
}

function validateStrongPassword(password) {
  const value = String(password || '');

  if (value.length < 8) {
    return 'A senha precisa ter pelo menos 8 caracteres.';
  }

  if (!/[A-Za-z]/.test(value)) {
    return 'A senha precisa ter pelo menos uma letra.';
  }

  if (!/[0-9]/.test(value)) {
    return 'A senha precisa ter pelo menos um numero.';
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'A senha precisa ter pelo menos um simbolo.';
  }

  return '';
}
