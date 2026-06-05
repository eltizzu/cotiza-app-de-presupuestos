-- Cotiza Supabase schema
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi negocio',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  logo_url text not null default '',
  currency text not null default 'EUR',
  tax_rate numeric(7, 3) not null default 21,
  margin_rate numeric(7, 3) not null default 20,
  next_quote_number integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type text not null default 'Otro',
  unit text not null default 'unidad',
  unit_price numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  variable text not null check (variable in ('area', 'quantity', 'linear')),
  factor numeric(14, 6) not null default 0,
  unit text not null default 'unidad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.template_lines (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  price_id uuid references public.prices(id) on delete set null,
  rule_id uuid references public.rules(id) on delete set null,
  variable text check (variable in ('area', 'quantity', 'linear')),
  factor numeric(14, 6) not null default 1,
  multiplier numeric(14, 6) not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  number text not null,
  client_name text not null default '',
  work_address text not null default '',
  validity text not null default '15 dias',
  quote_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  status_updated_at timestamptz not null default now(),
  notes text not null default '',
  cost_total numeric(14, 4) not null default 0,
  margin_total numeric(14, 4) not null default 0,
  before_tax_total numeric(14, 4) not null default 0,
  tax_total numeric(14, 4) not null default 0,
  grand_total numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, number)
);

create table if not exists public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  name text not null,
  quantity numeric(14, 4) not null default 0,
  unit text not null default 'unidad',
  unit_price numeric(14, 4) not null default 0,
  source jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists prices_business_id_idx on public.prices(business_id);
create index if not exists rules_business_id_idx on public.rules(business_id);
create index if not exists templates_business_id_idx on public.templates(business_id);
create index if not exists template_lines_template_id_idx on public.template_lines(template_id);
create index if not exists clients_business_id_idx on public.clients(business_id);
create index if not exists quotes_business_id_status_idx on public.quotes(business_id, status);
create index if not exists quote_lines_quote_id_idx on public.quote_lines(quote_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists prices_set_updated_at on public.prices;
create trigger prices_set_updated_at before update on public.prices
for each row execute function public.set_updated_at();

drop trigger if exists rules_set_updated_at on public.rules;
create trigger rules_set_updated_at before update on public.rules
for each row execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.prices enable row level security;
alter table public.rules enable row level security;
alter table public.templates enable row level security;
alter table public.template_lines enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;

drop policy if exists "business owner access" on public.businesses;
drop policy if exists "prices owner access" on public.prices;
drop policy if exists "rules owner access" on public.rules;
drop policy if exists "templates owner access" on public.templates;
drop policy if exists "template lines owner access" on public.template_lines;
drop policy if exists "clients owner access" on public.clients;
drop policy if exists "quotes owner access" on public.quotes;
drop policy if exists "quote lines owner access" on public.quote_lines;

create policy "business owner access" on public.businesses
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "prices owner access" on public.prices
for all using (exists (
  select 1 from public.businesses b where b.id = prices.business_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = prices.business_id and b.owner_id = auth.uid()
));

create policy "rules owner access" on public.rules
for all using (exists (
  select 1 from public.businesses b where b.id = rules.business_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = rules.business_id and b.owner_id = auth.uid()
));

create policy "templates owner access" on public.templates
for all using (exists (
  select 1 from public.businesses b where b.id = templates.business_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = templates.business_id and b.owner_id = auth.uid()
));

create policy "template lines owner access" on public.template_lines
for all using (exists (
  select 1
  from public.templates t
  join public.businesses b on b.id = t.business_id
  where t.id = template_lines.template_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1
  from public.templates t
  join public.businesses b on b.id = t.business_id
  where t.id = template_lines.template_id and b.owner_id = auth.uid()
));

create policy "clients owner access" on public.clients
for all using (exists (
  select 1 from public.businesses b where b.id = clients.business_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = clients.business_id and b.owner_id = auth.uid()
));

create policy "quotes owner access" on public.quotes
for all using (exists (
  select 1 from public.businesses b where b.id = quotes.business_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = quotes.business_id and b.owner_id = auth.uid()
));

create policy "quote lines owner access" on public.quote_lines
for all using (exists (
  select 1
  from public.quotes q
  join public.businesses b on b.id = q.business_id
  where q.id = quote_lines.quote_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1
  from public.quotes q
  join public.businesses b on b.id = q.business_id
  where q.id = quote_lines.quote_id and b.owner_id = auth.uid()
));
