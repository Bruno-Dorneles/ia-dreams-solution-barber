const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { Injectable } = require('@nestjs/common');

const paymentMethods = ['cash', 'pix', 'credit_card', 'debit_card'];
const defaultPaymentSettings = {
  pix: { enabled: true, feePercent: 0 },
  cash: { enabled: true, feePercent: 0 },
  credit_card: { enabled: true, feePercent: 3 },
  debit_card: { enabled: true, feePercent: 2 },
};
const supportEmail = 'suporte@azaroseu';
const supportPhone = '9999-9999';
const passwordCodeTtlMs = 10 * 60 * 1000;
const validPartnerCodes = {
  'PARCEIRO-IADREAMS': {
    code: 'PARCEIRO-IADREAMS',
    label: 'Parceiro IA Dreams',
    monthlyPriceCents: 0,
    partnerCommissionCents: 0,
  },
  BRAGA: {
    code: 'BRAGA',
    label: 'Parceiro Braga',
    monthlyPriceCents: 0,
    partnerCommissionCents: 1000,
  },
};
const professionalColors = ['#f97316', '#2563eb', '#16a34a', '#a855f7', '#e11d48'];
const legalDocumentVersion = '1.1';

const state = {
  barbershop: null,
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
  ],
  professionals: [],
  services: [],
  appointments: [],
  schedules: [],
  costs: [],
  passwordRecoveries: {},
};

const persistenceKey = 'solution-barber-state';
let pool = null;
let persistenceReady = false;
let persistenceTimer = null;
const rateLimitBuckets = new Map();
const rateLimitCleanupMs = 60 * 60 * 1000;

async function initializePersistentState() {
  if (!process.env.DATABASE_URL || persistenceReady) {
    migratePasswordHashes();
    persistenceReady = true;
    return;
  }

  try {
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
      if (migratePasswordHashes()) {
        await persistState();
      }
    } else {
      migratePasswordHashes();
      await persistState();
    }
  } catch (error) {
    console.error('PostgreSQL indisponivel. Rodando com dados temporarios:', error.message);
    pool = null;
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
  authenticateToken(authHeader) {
    const token = extractBearerToken(authHeader);
    if (!token) {
      return { error: 'Sessao expirada. Faça login novamente.' };
    }

    try {
      const payload = jwt.verify(token, getJwtSecret());
      const user = state.users.find((item) => item.id === payload.sub);
      if (!user) {
        return { error: 'Sessao invalida. Faça login novamente.' };
      }

      const userBarbershop = user.barbershopId
        ? state.barbershops.find((item) => item.id === user.barbershopId)
        : null;
      if (userBarbershop && ['blocked', 'canceled'].includes(userBarbershop.status)) {
        return { error: 'Conta bloqueada. Entre em contato com a IA Dreams.' };
      }

      return publicUser(user);
    } catch {
      return { error: 'Sessao expirada. Faça login novamente.' };
    }
  }

  login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const rateLimitKey = 'login:' + (normalizedEmail || 'unknown');
    const rateLimitError = checkRateLimit(rateLimitKey, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    });
    if (rateLimitError) {
      addSecurityEvent('login_rate_limited', { email: normalizedEmail });
      return rateLimitError;
    }

    if (!isValidEmail(normalizedEmail)) {
      addSecurityEvent('login_invalid_email', { email: normalizedEmail });
      return { error: 'Credenciais invalidas.' };
    }

    const user = state.users.find((item) => normalizeEmail(item.email) === normalizedEmail);

    if (!user || !verifyPassword(password, user.password)) {
      addSecurityEvent('login_failed', { email: normalizedEmail });
      return { error: 'Credenciais invalidas.' };
    }

    clearRateLimit(rateLimitKey);

    if (!isPasswordHash(user.password)) {
      user.password = hashPassword(password);
      schedulePersist();
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
        barbershopId: user.barbershopId,
      },
      getJwtSecret(),
      { expiresIn: '8h' },
    );

    return {
      token,
      user: publicUser(user),
    };
  }
  getAdminSummary() {
    const barbershops = this.listAdminBarbershops();
    const activeClients = barbershops.filter((item) => item.status === 'active').length;
    const paidClients = barbershops.filter((item) => item.paymentStatus === 'ok').length;
    const overdueClients = barbershops.filter((item) => item.paymentStatus === 'overdue').length;
    const monthlyRecurringRevenueCents = barbershops.reduce(
      (sum, item) => sum + item.monthlyPriceCents,
      0,
    );
    const couponSummary = buildCouponSummary(barbershops);

    return {
      clientsCount: barbershops.length,
      activeClients,
      trialClients: barbershops.filter((item) => item.status === 'trial').length,
      canceledClients: barbershops.filter((item) => item.status === 'canceled').length,
      blockedClients: barbershops.filter((item) => item.status === 'blocked').length,
      paidClients,
      overdueClients,
      monthlyRecurringRevenueCents,
      appointmentsCount: state.appointments.length,
      professionalsCount: state.professionals.length,
      couponSummary,
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
        accountStage: barbershop.status || 'trial',
        paymentDueDate: ensurePaymentDueDate(barbershop),
        paymentStatus: getPaymentStatus(barbershop),
        plan: barbershop.monthlyPriceCents === 0
          ? validPartnerCodes[barbershop.partnerCode]?.label || 'Gratuito'
          : 'R$ 29,90',
        partnerCode: barbershop.partnerCode,
        partnerLabel: validPartnerCodes[barbershop.partnerCode]?.label || 'Cliente próprio',
        partnerCommissionCents:
          validPartnerCodes[barbershop.partnerCode]?.partnerCommissionCents || 0,
        monthlyPriceCents: barbershop.monthlyPriceCents,
        adminNotes: barbershop.adminNotes || '',
        professionalsCount: professionals.length,
        appointmentsCount: appointments.length,
        schedulesCount: schedules.length,
        costsCount: costs.length,
        revenueCents,
        lastActivityAt: lastAppointment?.createdAt || null,
        legalAcceptedAt: barbershop.legalAcceptedAt || null,
        legalAcceptedByEmail: barbershop.legalAcceptedByEmail || '',
        legalAcceptedVersion: barbershop.legalAcceptedVersion || null,
        legalAcceptedUserAgent: barbershop.legalAcceptedUserAgent || '',
        legalAcceptedIp: barbershop.legalAcceptedIp || '',
        legalAcceptanceHistory: barbershop.legalAcceptanceHistory || [],
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

    if (body.paymentDueDate !== undefined) {
      barbershop.paymentDueDate = normalizeBusinessDate(body.paymentDueDate);
    }

    if (body.partnerCode !== undefined) {
      barbershop.partnerCode = normalizePartnerCode(body.partnerCode);
    }

    if (body.adminNotes !== undefined) {
      barbershop.adminNotes = body.adminNotes;
    }

    if (body.forceLegalAcceptance === true) {
      barbershop.legalAcceptedAt = null;
      barbershop.legalAcceptedByUserId = null;
      barbershop.legalAcceptedByEmail = null;
      barbershop.legalAcceptedVersion = null;
      barbershop.legalAcceptedDocuments = null;
      barbershop.legalAcceptedUserAgent = null;
      barbershop.legalAcceptedUrl = null;
      barbershop.legalAcceptedIp = null;
      addSecurityEvent('legal_acceptance_forced', { barbershopId: barbershop.id });
    }

    schedulePersist();
    return barbershop;
  }

  registerOwner(body) {
    const email = normalizeEmail(body.email);
    const partnerCode = normalizePartnerCode(body.partnerCode);
    const ownerName = normalizeText(body.name, 80);
    const barbershopName = normalizeText(body.barbershopName, 100);
    const contact = normalizeWhatsAppPhone(body.contact);

    if (!ownerName || !barbershopName || !email || !body.contact || !body.password) {
      return { error: 'Preencha todos os campos obrigatorios.' };
    }

    if (!isValidEmail(email)) {
      return { error: 'Informe um e-mail valido.' };
    }

    if (!contact) {
      return { error: 'Informe um WhatsApp valido com DDD.' };
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
      id: 'shop-' + Date.now(),
      name: barbershopName,
      publicSlug: uniqueBarbershopSlug(barbershopName),
      ownerName,
      contact,
      partnerCode: partner?.code || null,
      logoUrl: '',
      panelColor: '#ffffff',
      textColor: '#111827',
      accentColor: '#111827',
      scheduleStartHour: 8,
      scheduleEndHour: 18,
      scheduleSlotMinutes: 60,
      paymentSettings: normalizePaymentSettings(),
      status: 'trial',
      paymentDueDate: nextBillingDate(new Date()),
      adminNotes: '',
      monthlyPriceCents: partner?.monthlyPriceCents ?? 2990,
      legalAcceptedAt: null,
      legalAcceptedByUserId: null,
      legalAcceptedByEmail: null,
      legalAcceptedVersion: null,
      legalAcceptedDocuments: null,
      legalAcceptedUserAgent: null,
      legalAcceptedUrl: null,
      legalAcceptedIp: null,
      legalAcceptanceHistory: [],
    };

    state.barbershop = barbershop;
    state.barbershops.push(barbershop);

    const professionalId = 'pro-' + Date.now();
    const user = {
      id: 'user-' + Date.now(),
      name: ownerName,
      email,
      password: hashPassword(body.password),
      role: 'owner',
      professionalId,
      barbershopId: barbershop.id,
    };

    state.users.push(user);
    state.professionals.push({
      id: professionalId,
      barbershopId: barbershop.id,
      name: ownerName,
      email,
      contact,
      color: '#111827',
      commissionType: 'percentage',
      commissionValue: 0,
      ownerUserId: user.id,
      active: true,
    });

    addSecurityEvent('owner_registered', { email, barbershopId: barbershop.id });

    state.services.push(
      {
        id: 'svc-' + Date.now() + '-1',
        barbershopId: barbershop.id,
        name: 'Corte',
        priceCents: 3500,
        active: true,
      },
      {
        id: 'svc-' + Date.now() + '-2',
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
    const response = {
      message: 'Codigo de verificacao enviado.',
      expiresInMinutes: 10,
    };
    if (process.env.NODE_ENV !== 'production') {
      response.debugCode = code;
    }
    return response;
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

    user.password = hashPassword(password);
    delete state.passwordRecoveries[normalizedEmail];

    schedulePersist();
    return { message: 'Senha alterada com sucesso.' };
  }

  getBarberShop(barbershopId) {
    return findBarbershop(barbershopId);
  }

  getPublicBookingPage(slug) {
    const barbershop = findBarbershopBySlug(slug);

    if (!barbershop) {
      return { error: 'Barbearia nao encontrada.' };
    }

    ensureOwnerProfessional(barbershop.id);
    ensureDefaultServices(barbershop.id);

    return {
      barbershop: {
        id: barbershop.id,
        name: barbershop.name,
        ownerName: barbershop.ownerName,
        logoUrl: barbershop.logoUrl || '',
        publicSlug: barbershop.publicSlug || slugify(barbershop.name),
        scheduleStartHour: barbershop.scheduleStartHour ?? 8,
        scheduleEndHour: barbershop.scheduleEndHour ?? 18,
        scheduleSlotMinutes: barbershop.scheduleSlotMinutes ?? 60,
      },
      professionals: state.professionals
        .filter((item) => item.barbershopId === barbershop.id && item.active !== false)
        .map((item) => ({
          id: item.id,
          name: item.name,
          color: item.color || '#2563eb',
        })),
      services: state.services
        .filter((item) => item.barbershopId === barbershop.id && item.active !== false)
        .map((item) => ({
          id: item.id,
          name: item.name,
          priceCents: item.priceCents || 0,
        })),
      schedules: state.schedules
        .filter((item) => item.barbershopId === barbershop.id)
        .map((item) => ({
          id: item.id,
          professionalId: item.professionalId,
          startsAt: item.startsAt,
          status: item.status || 'closed',
        })),
    };
  }

  createPublicSchedule(slug, body) {
    const page = this.getPublicBookingPage(slug);

    if (page.error) {
      return page;
    }

    const professional = page.professionals.find((item) => item.id === body.professionalId);
    const service = page.services.find((item) => item.id === body.serviceId);

    if (!professional) {
      return { error: 'Escolha um profissional valido.' };
    }

    if (!service) {
      return { error: 'Escolha um servico valido.' };
    }

    const clientName = normalizeText(body.clientName, 80);
    if (!clientName || !body.clientContact) {
      return { error: 'Informe nome e WhatsApp.' };
    }

    const clientContact = normalizeWhatsAppPhone(body.clientContact);
    if (!clientContact) {
      return { error: 'Informe um WhatsApp valido com DDD. Exemplo: (51) 99999-9999.' };
    }

    const rateLimitError = checkRateLimit('public_schedule:' + page.barbershop.id + ':' + clientContact, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    });
    if (rateLimitError) {
      addSecurityEvent('public_schedule_rate_limited', { barbershopId: page.barbershop.id, contact: clientContact });
      return rateLimitError;
    }
    const startsAt = String(body.startsAt || '').slice(0, 16);
    if (!startsAt) {
      return { error: 'Escolha data e horario.' };
    }

    const isTaken = state.schedules.some(
      (item) => item.professionalId === professional.id && item.startsAt === startsAt,
    );

    if (isTaken) {
      return { error: 'Este horario acabou de ser ocupado. Escolha outro horario.' };
    }

    const schedule = {
      id: `sch-${Date.now()}`,
      barbershopId: page.barbershop.id,
      clientName,
      clientContact,
      serviceName: service.name,
      professionalId: professional.id,
      professionalName: professional.name,
      startsAt,
      notes: 'Solicitado pela pagina publica',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    state.schedules.push(schedule);
    addSecurityEvent('public_schedule_created', { barbershopId: page.barbershop.id, scheduleId: schedule.id });
    schedulePersist();

    return {
      message: 'Agendamento solicitado com sucesso.',
      schedule,
      barbershop: page.barbershop,
      service,
      professional,
    };
  }
  acceptLegalTerms(body, user) {
    const barbershop = findBarbershop(user?.barbershopId || body?.barbershopId);
    if (!barbershop) {
      return { error: 'Barbearia nao encontrada.' };
    }

    if (user?.role === 'barber') {
      return { error: 'Apenas o responsavel pela barbearia pode aceitar os termos.' };
    }

    const accepted = body?.accepted === true;
    if (!accepted) {
      return { error: 'Confirme que leu e aceitou os documentos.' };
    }

    const acceptedAt = new Date().toISOString();
    const acceptedDocuments = {
      contract: body?.documents?.contract || legalDocumentVersion,
      terms: body?.documents?.terms || legalDocumentVersion,
      privacy: body?.documents?.privacy || legalDocumentVersion,
      cookies: body?.documents?.cookies || legalDocumentVersion,
    };
    const acceptanceRecord = {
      acceptedAt,
      userId: user.id,
      userName: user.name,
      email: user.email,
      version: legalDocumentVersion,
      documents: acceptedDocuments,
      userAgent: String(body?.userAgent || '').slice(0, 500),
      acceptanceUrl: String(body?.acceptanceUrl || '').slice(0, 500),
      ip: String(body?.ip || '').split(',')[0].trim().slice(0, 120),
    };

    Object.assign(barbershop, {
      legalAcceptedAt: acceptedAt,
      legalAcceptedByUserId: user.id,
      legalAcceptedByEmail: user.email,
      legalAcceptedVersion: legalDocumentVersion,
      legalAcceptedDocuments: acceptedDocuments,
      legalAcceptedUserAgent: acceptanceRecord.userAgent,
      legalAcceptedUrl: acceptanceRecord.acceptanceUrl,
      legalAcceptedIp: acceptanceRecord.ip,
      legalAcceptanceHistory: [...(barbershop.legalAcceptanceHistory || []), acceptanceRecord],
    });

    addSecurityEvent('legal_terms_accepted', {
      barbershopId: barbershop.id,
      userId: user.id,
      email: user.email,
      version: legalDocumentVersion,
      documents: acceptedDocuments,
    });
    schedulePersist();
    return barbershop;
  }
  updateBarberShop(body) {
    const barbershop = findBarbershop(body.barbershopId);
    if (!barbershop) {
      return { error: 'Barbearia nao encontrada.' };
    }

    Object.assign(barbershop, {
      ...body,
      paymentSettings: body.paymentSettings
        ? normalizePaymentSettings(body.paymentSettings)
        : normalizePaymentSettings(barbershop.paymentSettings),
      partnerCode: body.partnerCode ? normalizePartnerCode(body.partnerCode) : barbershop.partnerCode,
    });

    if (body.ownerName) {
      const owner = state.users.find(
        (user) => user.role === 'owner' && user.barbershopId === barbershop.id,
      );
      if (owner) {
        owner.name = body.ownerName;
      }

      const ownerProfessional = state.professionals.find(
        (professional) => professional.ownerUserId === owner?.id,
      );
      if (ownerProfessional) {
        ownerProfessional.name = body.ownerName;
      }
    }

    if (state.barbershop?.id === barbershop.id) {
      state.barbershop = barbershop;
    }

    schedulePersist();
    return barbershop;
  }

  listProfessionals(barbershopId) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    ensureOwnerProfessional(targetBarbershopId);
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
        password: hashPassword(body.password || 'Acesso@123'),
        role: 'barber',
        professionalId: professional.id,
        barbershopId: professional.barbershopId,
      });
    }

    schedulePersist();
    return professional;
  }

  updateProfessional(professionalId, body, authUser) {
    const professional = state.professionals.find((item) => item.id === professionalId);

    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, professional.barbershopId)) {
      return denyAccess();
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
        user.password = hashPassword(body.password);
      }
    }

    schedulePersist();
    return professional;
  }

  deleteProfessional(professionalId, authUser) {
    const professional = state.professionals.find((item) => item.id === professionalId);

    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, professional.barbershopId)) {
      return denyAccess();
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

  updateUser(userId, body, authUser) {
    const user = state.users.find((item) => item.id === userId);

    if (!user) {
      return { error: 'Usuario nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, user.barbershopId)) {
      return denyAccess();
    }

    if (body.password) {
      const passwordError = validateStrongPassword(body.password);
      if (passwordError) {
        return { error: passwordError };
      }
      user.password = hashPassword(body.password);
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
    ensureDefaultServices(targetBarbershopId);
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

  deleteService(serviceId, authUser) {
    const index = state.services.findIndex((item) => item.id === serviceId);
    if (index === -1) {
      return { error: 'Servico nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, state.services[index].barbershopId)) {
      return denyAccess();
    }

    state.services.splice(index, 1);
    schedulePersist();
    return { ok: true };
  }

  createAppointment(body, authUser) {
    const isOtherService = body.serviceId === 'other';
    let service = isOtherService
      ? null
      : state.services.find((item) => item.id === body.serviceId);
    const requestedProfessional = state.professionals.find((item) => item.id === body.professionalId);
    const requestedBarbershop = state.barbershops.find((item) => item.id === body.barbershopId);
    let targetBarbershopId = authUser?.role === 'admin'
      ? (
        requestedProfessional?.barbershopId ||
        service?.barbershopId ||
        requestedBarbershop?.id ||
        body.barbershopId ||
        state.barbershop?.id ||
        ''
      )
      : authUser?.barbershopId || '';
    if (!targetBarbershopId && state.barbershops.length === 1) {
      targetBarbershopId = state.barbershops[0].id;
    }
    ensureDefaultServices(targetBarbershopId);

    if (!service && !isOtherService) {
      service = state.services.find(
        (item) => item.id === body.serviceId && item.barbershopId === targetBarbershopId,
      );
    }

    const professional =
      (authUser?.role === 'barber' && authUser.professionalId
        ? state.professionals.find((item) => item.id === authUser.professionalId && item.barbershopId === targetBarbershopId)
        : null) ||
      (requestedProfessional?.barbershopId === targetBarbershopId ? requestedProfessional : null) ||
      ensureOwnerProfessional(targetBarbershopId) ||
      state.professionals.find((item) => item.barbershopId === targetBarbershopId);

    const hasFallbackServiceValue = Number(body.totalCents || 0) > 0;

    if (!professional) {
      return { error: 'Profissional da barbearia nao encontrado. Abra Configuracoes e confira o perfil do dono.' };
    }

    if (!service && !isOtherService && !hasFallbackServiceValue) {
      return { error: 'Servico nao encontrado. Selecione outro servico ou cadastre novamente.' };
    }

    if (!paymentMethods.includes(body.paymentMethod)) {
      return { error: 'Forma de pagamento invalida.' };
    }

    const totalCents = Number(body.totalCents || service?.priceCents || 0);
    if (totalCents <= 0) {
      return { error: 'Informe um valor valido.' };
    }


    const targetBarbershop = state.barbershops.find((item) => item.id === targetBarbershopId);
    const paymentSettings = normalizePaymentSettings(targetBarbershop?.paymentSettings);
    const selectedPaymentSetting = paymentSettings[body.paymentMethod] || defaultPaymentSettings[body.paymentMethod];
    if (!selectedPaymentSetting?.enabled) {
      return { error: 'Forma de pagamento desativada nas configuracoes.' };
    }
    const paymentFeePercent = Number(selectedPaymentSetting.feePercent || 0);
    const paymentFeeCents = Math.round((totalCents * paymentFeePercent) / 100);

    const commissionCents = calculateCommissionCents({
      totalCents,
      commissionType: professional.commissionType,
      commissionValue: professional.commissionValue,
    });

    const appointment = {
      id: `att-${Date.now()}`,
      barbershopId: professional.barbershopId || targetBarbershopId,
      professionalId: professional.id,
      professionalName: professional.name,
      serviceId: service?.id || 'other',
      serviceName: service?.name || body.serviceName || 'Outro',
      paymentMethod: body.paymentMethod,
      paymentFeePercent,
      paymentFeeCents,
      totalCents,
      commissionCents,
      netForShopCents: totalCents - commissionCents,
      netAfterPaymentFeeCents: totalCents - commissionCents - paymentFeeCents,
      businessDate: normalizeBusinessDate(body.businessDate) || localDateKey(new Date()),
      createdAt: body.createdAt || new Date().toISOString(),
    };

    state.appointments.push(appointment);
    schedulePersist();
    return appointment;
  }

  listAppointments(barbershopId, user) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.appointments
      .filter((item) => item.barbershopId === targetBarbershopId && (user?.role !== 'barber' || item.professionalId === user.professionalId))
      .slice()
      .reverse();
  }

  deleteAppointment(appointmentId, authUser) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      return { error: 'Atendimento nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, appointment.barbershopId)) {
      return denyAccess();
    }

    state.appointments = state.appointments.filter((item) => item.id !== appointmentId);
    schedulePersist();
    return { message: 'Atendimento excluido.' };
  }

  listSchedules(barbershopId, user) {
    const targetBarbershopId = getTargetBarbershopId(barbershopId);
    return state.schedules
      .filter((item) => item.barbershopId === targetBarbershopId && (user?.role !== 'barber' || item.professionalId === user.professionalId))
      .slice()
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  createSchedule(body, authUser) {
    const targetBarbershopId = authUser?.role === 'admin'
      ? getTargetBarbershopId(body.barbershopId)
      : authUser?.barbershopId || '';
    const professional =
      (authUser?.role === 'barber' && authUser.professionalId
        ? state.professionals.find((item) => item.id === authUser.professionalId && item.barbershopId === targetBarbershopId)
        : null) ||
      state.professionals.find((item) => item.id === body.professionalId && item.barbershopId === targetBarbershopId) ||
      ensureOwnerProfessional(targetBarbershopId);

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
      barbershopId: professional.barbershopId || targetBarbershopId,
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

  deleteSchedule(scheduleId, authUser) {
    const schedule = state.schedules.find((item) => item.id === scheduleId);
    if (!schedule) {
      return { error: 'Agendamento nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, schedule.barbershopId)) {
      return denyAccess();
    }

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

  updateCost(costId, body, authUser) {
    const cost = state.costs.find((item) => item.id === costId);

    if (!cost) {
      return { error: 'Custo nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, cost.barbershopId)) {
      return denyAccess();
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

  deleteCost(costId, authUser) {
    const cost = state.costs.find((item) => item.id === costId);
    if (!cost) {
      return { error: 'Custo nao encontrado.' };
    }

    if (!canAccessBarbershop(authUser, cost.barbershopId)) {
      return denyAccess();
    }

    state.costs = state.costs.filter((item) => item.id !== costId);
    schedulePersist();
    return { message: 'Custo removido.' };
  }

  getReport({ period, date, month, barbershopId, user }) {
    const targetBarbershopId = user?.role === 'admin'
      ? getTargetBarbershopId(barbershopId)
      : user?.barbershopId || '';

    if (!targetBarbershopId) {
      return buildReport([]);
    }

    const filtered = state.appointments.filter((appointment) => {
      if (appointment.barbershopId !== targetBarbershopId) {
        return false;
      }

      if (user?.role === 'barber' && appointment.professionalId !== user.professionalId) {
        return false;
      }

      if (period === 'daily') {
        const targetDate = date || new Date().toISOString().slice(0, 10);
        return appointmentDateKey(appointment) === targetDate;
      }

      const targetMonth = month || new Date().toISOString().slice(0, 7);
      return appointmentDateKey(appointment).slice(0, 7) === targetMonth;
    });

    return buildReport(filtered);
  }

  getProfessionalCommission({ professionalId, month, user }) {
    const professional = state.professionals.find((item) => item.id === professionalId);
    if (!professional) {
      return { error: 'Profissional nao encontrado.' };
    }

    if (user?.role === 'barber' && user.professionalId !== professionalId) {
      return denyAccess();
    }

    if (user?.role !== 'admin' && professional.barbershopId !== user?.barbershopId) {
      return denyAccess();
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const appointments = state.appointments.filter(
      (appointment) =>
        appointment.barbershopId === professional.barbershopId &&
        appointment.professionalId === professionalId &&
        appointmentDateKey(appointment).slice(0, 7) === targetMonth,
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

module.exports = { BarberShopService, initializePersistentState, legalDocumentVersion };

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET obrigatorio em producao.');
  }
  return secret || 'dev-secret-local-only';
}

function extractBearerToken(authHeader) {
  const value = String(authHeader || '').trim();
  if (!value.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return value.slice(7).trim();
}

function isPasswordHash(password) {
  return /^\$2[aby]\$/.test(String(password || ''));
}

function hashPassword(password) {
  return bcrypt.hashSync(String(password || ''), 10);
}

function verifyPassword(password, storedPassword) {
  const stored = String(storedPassword || '');
  if (!stored) {
    return false;
  }

  if (isPasswordHash(stored)) {
    return bcrypt.compareSync(String(password || ''), stored);
  }

  return stored === String(password || '');
}

function migratePasswordHashes() {
  let changed = false;
  for (const user of state.users) {
    if (user.password && !isPasswordHash(user.password)) {
      user.password = hashPassword(user.password);
      changed = true;
    }
  }

  return changed;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    professionalId: user.professionalId,
    barbershopId: user.barbershopId,
  };
}

function canAccessBarbershop(user, barbershopId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Boolean(barbershopId) && user.barbershopId === barbershopId;
}

function denyAccess() {
  return { error: 'Acesso nao autorizado.' };
}
function checkRateLimit(key, options) {
  const now = Date.now();
  cleanupRateLimitBuckets(now);
  const limit = Number(options.limit || 10);
  const windowMs = Number(options.windowMs || 60 * 1000);
  const blockMs = Number(options.blockMs || windowMs);
  const current = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs, blockedUntil: 0 };

  if (current.blockedUntil && current.blockedUntil > now) {
    return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
  }

  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + windowMs;
    current.blockedUntil = 0;
  }

  current.count += 1;
  if (current.count > limit) {
    current.blockedUntil = now + blockMs;
    rateLimitBuckets.set(key, current);
    return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
  }

  rateLimitBuckets.set(key, current);
  return null;
}

function clearRateLimit(key) {
  rateLimitBuckets.delete(key);
}

function cleanupRateLimitBuckets(now) {
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    const expiredWindow = bucket.resetAt + rateLimitCleanupMs < now;
    const expiredBlock = !bucket.blockedUntil || bucket.blockedUntil + rateLimitCleanupMs < now;
    if (expiredWindow && expiredBlock) {
      rateLimitBuckets.delete(key);
    }
  }
}

function addSecurityEvent(type, details = {}) {
  if (!Array.isArray(state.securityEvents)) {
    state.securityEvents = [];
  }

  state.securityEvents.push({
    id: 'sec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    type,
    details,
    createdAt: new Date().toISOString(),
  });

  if (state.securityEvents.length > 300) {
    state.securityEvents = state.securityEvents.slice(-300);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function normalizeText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePartnerCode(code) {
  return String(code || '').trim().toUpperCase();
}

function buildCouponSummary(barbershops) {
  const summary = {};

  for (const barbershop of barbershops) {
    const code = normalizePartnerCode(barbershop.partnerCode) || 'CLIENTE PROPRIO';
    const partner = validPartnerCodes[code];
    const item = summary[code] || {
      code,
      label: partner?.label || 'Cliente próprio',
      count: 0,
      partnerCommissionCents: partner?.partnerCommissionCents || 0,
    };
    item.count += 1;
    summary[code] = item;
  }

  return Object.values(summary).sort((a, b) => b.count - a.count);
}

function ensurePaymentDueDate(barbershop) {
  if (!barbershop.paymentDueDate) {
    barbershop.paymentDueDate = nextBillingDate(new Date());
    schedulePersist();
  }

  return barbershop.paymentDueDate;
}

function getPaymentStatus(barbershop) {
  if (Number(barbershop.monthlyPriceCents || 0) <= 0) {
    return 'non_paying';
  }

  const dueDate = ensurePaymentDueDate(barbershop);
  const daysLeft = daysUntil(dueDate);

  if (daysLeft < 0) {
    return 'overdue';
  }

  if (daysLeft <= 7) {
    return 'near_due';
  }

  return 'ok';
}

function nextBillingDate(date) {
  const current = date instanceof Date ? date : new Date(date);
  const next = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
  return localDateKey(next);
}

function daysUntil(date) {
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target - current) / 86400000);
}

function normalizeBusinessDate(date) {
  const value = String(date || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function appointmentDateKey(appointment) {
  return appointment.businessDate || localDateKey(appointment.createdAt);
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
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

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'barbearia';
}

function uniqueBarbershopSlug(name) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 2;

  while (state.barbershops.some((item) => (item.publicSlug || slugify(item.name)) === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function findBarbershopBySlug(slug) {
  const rawSlug = String(slug || '').trim();
  const normalizedSlug = slugify(rawSlug);
  return state.barbershops.find((item) => {
    const itemSlug = item.publicSlug || slugify(item.name);
    return item.id === rawSlug || itemSlug === normalizedSlug || slugify(item.id) === normalizedSlug;
  }) || null;
}
function findBarbershop(barbershopId) {
  return state.barbershops.find((item) => item.id === barbershopId) || state.barbershop || null;
}

function getTargetBarbershopId(barbershopId) {
  return barbershopId || state.barbershop?.id || '';
}

function ensureOwnerProfessional(barbershopId) {
  const targetBarbershopId = getTargetBarbershopId(barbershopId);
  if (!targetBarbershopId) {
    return null;
  }

  const owner = state.users.find(
    (user) => user.role === 'owner' && user.barbershopId === targetBarbershopId,
  );
  if (!owner) {
    return null;
  }

  const existing =
    state.professionals.find((professional) => professional.id === owner.professionalId) ||
    state.professionals.find((professional) => professional.ownerUserId === owner.id);
  if (existing) {
    owner.professionalId = existing.id;
    return existing;
  }

  const professional = {
    id: `pro-owner-${Date.now()}`,
    barbershopId: targetBarbershopId,
    name: owner.name,
    email: owner.email,
    contact: '',
    color: '#f97316',
    commissionType: 'percentage',
    commissionValue: 0,
    ownerUserId: owner.id,
    active: true,
  };

  owner.professionalId = professional.id;
  state.professionals.push(professional);
  schedulePersist();
  return professional;
}

function ensureDefaultServices(barbershopId) {
  const targetBarbershopId = getTargetBarbershopId(barbershopId);
  if (!targetBarbershopId) {
    return;
  }

  const hasServices = state.services.some((service) => service.barbershopId === targetBarbershopId);
  if (hasServices) {
    return;
  }

  state.services.push(
    {
      id: `svc-${Date.now()}-1`,
      barbershopId: targetBarbershopId,
      name: 'Corte',
      priceCents: 3500,
      active: true,
    },
    {
      id: `svc-${Date.now()}-2`,
      barbershopId: targetBarbershopId,
      name: 'Barba',
      priceCents: 2500,
      active: true,
    },
  );
  schedulePersist();
}

function normalizeWhatsAppPhone(contact) {
  let digits = String(contact || '').replace(/\D/g, '');

  if (digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return '';
  }

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return '';
  }

  return `55${digits}`;
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
function normalizePaymentSettings(settings = {}) {
  return paymentMethods.reduce((acc, method) => {
    const current = settings?.[method] || {};
    const fallback = defaultPaymentSettings[method];
    acc[method] = {
      enabled: current.enabled === undefined ? fallback.enabled : Boolean(current.enabled),
      feePercent: Math.max(0, Number(current.feePercent ?? fallback.feePercent ?? 0)),
    };
    return acc;
  }, {});
}
