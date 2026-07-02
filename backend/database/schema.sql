create table barbershops (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  owner_name varchar(120) not null,
  contact varchar(40),
  partner_code varchar(40),
  logo_url text,
  panel_color varchar(20) not null default '#ffffff',
  text_color varchar(20) not null default '#111827',
  accent_color varchar(20) not null default '#111827',
  schedule_start_hour integer not null default 8,
  schedule_end_hour integer not null default 18,
  schedule_slot_minutes integer not null default 60,
  status varchar(20) not null default 'trial' check (status in ('trial', 'active', 'blocked', 'canceled')),
  admin_notes text,
  monthly_price_cents integer not null default 2990,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  name varchar(120) not null,
  email varchar(160) not null unique,
  password_hash text not null,
  role varchar(20) not null check (role in ('admin', 'owner', 'barber')),
  created_at timestamptz not null default now()
);

create table partner_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null unique,
  name varchar(120) not null,
  monthly_price_cents integer not null default 2990,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into partner_codes (code, name, monthly_price_cents)
values ('BRAGA', 'Parceiro Braga', 0)
on conflict (code) do nothing;

create table password_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  code varchar(6) not null,
  attempts integer not null default 0,
  expired_count integer not null default 0,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table professionals (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  user_id uuid references users(id),
  name varchar(120) not null,
  email varchar(160),
  commission_type varchar(20) not null check (commission_type in ('percentage', 'fixed')),
  commission_value numeric(10, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  name varchar(120) not null,
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  professional_id uuid not null references professionals(id),
  service_id uuid not null references services(id),
  payment_method varchar(20) not null check (
    payment_method in ('cash', 'pix', 'credit_card', 'debit_card')
  ),
  total_cents integer not null check (total_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  net_for_shop_cents integer not null check (net_for_shop_cents >= 0),
  created_at timestamptz not null default now()
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  professional_id uuid not null references professionals(id),
  client_name varchar(120) not null,
  client_contact varchar(40),
  service_name varchar(120),
  starts_at timestamptz not null,
  notes text,
  status varchar(20) not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table costs (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id),
  icon varchar(40) not null default 'home',
  description varchar(160) not null,
  amount_cents integer not null check (amount_cents >= 0),
  type varchar(20) not null check (type in ('variable', 'fixed')),
  created_at timestamptz not null default now()
);

create index appointments_barbershop_created_at_idx
  on appointments (barbershop_id, created_at);

create index appointments_professional_created_at_idx
  on appointments (professional_id, created_at);
