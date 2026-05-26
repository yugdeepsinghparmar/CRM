-- ============================================================
-- Enterprise Sales Control Tower — Supabase Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Cleanup partial schema from earlier failed runs
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
drop function if exists public.current_sales_manager_id();

drop table if exists public.followups cascade;
drop table if exists public.revenue cascade;
drop table if exists public.targets cascade;
drop table if exists public.activities cascade;
drop table if exists public.meetings cascade;
drop table if exists public.leads cascade;
drop table if exists public.sales_managers cascade;
drop table if exists public.users cascade;

create extension if not exists "pgcrypto";

-- ── Users (mirrors auth.users) ──────────────────────────────
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid references auth.users(id) on delete cascade,
  full_name       text not null default '',
  email           text unique not null,
  role            text not null default 'sales_manager'
                  check (role in ('admin', 'sales_manager')),
  created_at      timestamptz not null default now()
);

-- ── Sales Managers ──────────────────────────────────────────
create table if not exists public.sales_managers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  name        text not null,
  email       text unique not null,
  active_from date not null default current_date,
  target_from date not null default current_date,
  status      text not null default 'Active',
  created_at  timestamptz not null default now()
);

-- ── Leads ───────────────────────────────────────────────────
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  lead_date             date not null default current_date,
  sales_manager_id      uuid not null references public.sales_managers(id) on delete cascade,
  client_name           text not null,
  brand_name            text,
  city                  text not null,
  contact_person        text,
  contact_number        text,
  client_type           text not null check (client_type in ('PPU','NPU')),
  outlets               integer not null default 1 check (outlets >= 0),
  lead_source           text,
  meeting_type          text check (meeting_type in ('Physical','Virtual','Call')),
  stage                 text not null default 'Lead'
                        check (stage in ('Lead','Qualified','Demo Scheduled','Demo Done','Negotiation','Closed Won','Closed Lost')),
  status                text not null default 'Open'
                        check (status in ('Open','Won','Lost')),
  deal_value            numeric(14,2) generated always as (
                          outlets * case when client_type = 'PPU' then 5000 else 30000 end
                        ) stored,
  follow_up_date        date,
  expected_closure_date date,
  remarks               text,
  next_action           text,
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

-- ── Meetings ────────────────────────────────────────────────
create table if not exists public.meetings (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  sales_manager_id uuid not null references public.sales_managers(id) on delete cascade,
  meeting_date     date not null,
  meeting_type     text not null check (meeting_type in ('Physical','Virtual','Call')),
  status           text not null default 'Planned'
                   check (status in ('Planned','Done','Cancelled')),
  notes            text,
  created_at       timestamptz not null default now()
);

-- ── Activities ──────────────────────────────────────────────
create table if not exists public.activities (
  id               uuid primary key default gen_random_uuid(),
  sales_manager_id uuid not null references public.sales_managers(id) on delete cascade,
  lead_id          uuid references public.leads(id) on delete cascade,
  activity_date    date not null default current_date,
  type             text not null,
  summary          text,
  created_at       timestamptz not null default now()
);

-- ── Targets ─────────────────────────────────────────────────
create table if not exists public.targets (
  id               uuid primary key default gen_random_uuid(),
  sales_manager_id uuid not null references public.sales_managers(id) on delete cascade,
  period_type      text not null check (period_type in ('Monthly','Quarterly')),
  period_start     date not null,
  client_type      text not null check (client_type in ('PPU','NPU')),
  outlet_target    integer not null default 0,
  brand_target     integer not null default 0,
  target_value     numeric(14,2) not null,
  created_at       timestamptz not null default now(),
  unique (sales_manager_id, period_type, period_start, client_type)
);

-- ── Revenue ─────────────────────────────────────────────────
create table if not exists public.revenue (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  sales_manager_id uuid not null references public.sales_managers(id) on delete cascade,
  client_type      text not null check (client_type in ('PPU','NPU')),
  amount           numeric(14,2) not null,
  revenue_date     date not null,
  created_at       timestamptz not null default now()
);

-- ── Follow-ups ──────────────────────────────────────────────
create table if not exists public.followups (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  sales_manager_id uuid not null references public.sales_managers(id) on delete cascade,
  due_date         date not null,
  status           text not null default 'Pending'
                   check (status in ('Pending','Closed','Overdue')),
  next_action      text,
  created_at       timestamptz not null default now()
);

-- ── Auth trigger: auto-create user profile on signup ────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (auth_user_id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'sales_manager')
  )
  on conflict (email) do update set auth_user_id = excluded.auth_user_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Helper functions ────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (select role = 'admin' from public.users where auth_user_id = auth.uid() limit 1),
    false
  )
$$;

create or replace function public.current_sales_manager_id()
returns uuid language sql stable as $$
  select sm.id from public.sales_managers sm
  join public.users u on u.id = sm.user_id
  where u.auth_user_id = auth.uid()
  limit 1
$$;

-- ── Row Level Security ───────────────────────────────────────
alter table public.users           enable row level security;
alter table public.sales_managers  enable row level security;
alter table public.leads           enable row level security;
alter table public.meetings        enable row level security;
alter table public.activities      enable row level security;
alter table public.targets         enable row level security;
alter table public.revenue         enable row level security;
alter table public.followups       enable row level security;

-- users
drop policy if exists "admins manage users" on public.users;
drop policy if exists "users view own profile" on public.users;
create policy "admins manage users"      on public.users for all    using (public.is_admin()) with check (public.is_admin());
create policy "users view own profile"   on public.users for select using (auth_user_id = auth.uid());

-- sales_managers
drop policy if exists "admins manage managers" on public.sales_managers;
drop policy if exists "managers view own row" on public.sales_managers;
create policy "admins manage managers"   on public.sales_managers for all    using (public.is_admin()) with check (public.is_admin());
create policy "managers view own row"    on public.sales_managers for select using (id = public.current_sales_manager_id());

-- leads
drop policy if exists "admins manage leads" on public.leads;
drop policy if exists "managers read own leads" on public.leads;
drop policy if exists "managers insert leads" on public.leads;
drop policy if exists "managers update leads" on public.leads;
create policy "admins manage leads"      on public.leads for all    using (public.is_admin()) with check (public.is_admin());
create policy "managers read own leads"  on public.leads for select using (sales_manager_id = public.current_sales_manager_id());
create policy "managers insert leads"    on public.leads for insert with check (sales_manager_id = public.current_sales_manager_id());
create policy "managers update leads"    on public.leads for update using (sales_manager_id = public.current_sales_manager_id());

-- meetings
drop policy if exists "admins manage meetings" on public.meetings;
drop policy if exists "managers own meetings" on public.meetings;
create policy "admins manage meetings"   on public.meetings for all using (public.is_admin()) with check (public.is_admin());
create policy "managers own meetings"    on public.meetings for all using (sales_manager_id = public.current_sales_manager_id()) with check (sales_manager_id = public.current_sales_manager_id());

-- activities
drop policy if exists "admins manage activities" on public.activities;
drop policy if exists "managers own activities" on public.activities;
create policy "admins manage activities" on public.activities for all using (public.is_admin()) with check (public.is_admin());
create policy "managers own activities"  on public.activities for all using (sales_manager_id = public.current_sales_manager_id()) with check (sales_manager_id = public.current_sales_manager_id());

-- targets
drop policy if exists "admins manage targets" on public.targets;
drop policy if exists "managers view targets" on public.targets;
create policy "admins manage targets"    on public.targets for all    using (public.is_admin()) with check (public.is_admin());
create policy "managers view targets"    on public.targets for select using (sales_manager_id = public.current_sales_manager_id());

-- revenue
drop policy if exists "admins manage revenue" on public.revenue;
drop policy if exists "managers view revenue" on public.revenue;
create policy "admins manage revenue"    on public.revenue for all    using (public.is_admin()) with check (public.is_admin());
create policy "managers view revenue"    on public.revenue for select using (sales_manager_id = public.current_sales_manager_id());

-- followups
drop policy if exists "admins manage followups" on public.followups;
drop policy if exists "managers own followups" on public.followups;
create policy "admins manage followups"  on public.followups for all using (public.is_admin()) with check (public.is_admin());
create policy "managers own followups"   on public.followups for all using (sales_manager_id = public.current_sales_manager_id()) with check (sales_manager_id = public.current_sales_manager_id());

-- ── Realtime ─────────────────────────────────────────────────
-- Enable realtime via Supabase dashboard: Database > Replication > Tables
-- Or run this only if supabase_realtime publication exists:
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.leads;
    alter publication supabase_realtime add table public.meetings;
    alter publication supabase_realtime add table public.activities;
    alter publication supabase_realtime add table public.followups;
  end if;
end $$;

-- ── Seed: sample sales managers ─────────────────────────────
insert into public.sales_managers (id, name, email, active_from, target_from, status) values
  ('00000000-0000-0000-0000-000000000101', 'Soniya', 'soniya@sales.local', '2026-01-01', '2026-01-01', 'Active'),
  ('00000000-0000-0000-0000-000000000102', 'Rishi',  'rishi@sales.local',  '2026-01-01', '2026-01-01', 'Active')
on conflict (email) do nothing;

-- ── Seed: targets ────────────────────────────────────────────
insert into public.targets (sales_manager_id, period_type, period_start, client_type, outlet_target, brand_target, target_value)
select id, 'Monthly', '2026-05-01', 'PPU', 30, 0, 150000 from public.sales_managers where status = 'Active'
on conflict do nothing;

insert into public.targets (sales_manager_id, period_type, period_start, client_type, outlet_target, brand_target, target_value)
select id, 'Quarterly', '2026-04-01', 'NPU', 90, 3, 2700000 from public.sales_managers where status = 'Active'
on conflict do nothing;
