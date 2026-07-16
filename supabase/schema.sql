-- Time Tasks / SX
-- Schema idempotente para o Supabase self-hosted do EasyPanel.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Acesso exclusivo ao aplicativo dentro do Auth compartilhado
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.time_tasks_members enable row level security;
drop policy if exists "time_tasks_members_select_own" on public.time_tasks_members;
create policy "time_tasks_members_select_own" on public.time_tasks_members for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_members_insert_own" on public.time_tasks_members;
create policy "time_tasks_members_insert_own" on public.time_tasks_members for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.time_tasks_members to authenticated;
revoke all on public.time_tasks_members from anon;

create or replace function public.register_time_tasks_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'time-tasks' then
    insert into public.time_tasks_members (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_time_tasks_user_created on auth.users;
create trigger on_time_tasks_user_created
  after insert on auth.users
  for each row execute function public.register_time_tasks_member();

-- ---------------------------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  date date not null,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  calendar text not null default 'pessoal' check (calendar in ('pessoal', 'trabalho', 'saude', 'estudos', 'social')),
  description text not null default '',
  reminder_minutes integer not null default 0 check (reminder_minutes between 0 and 10080),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_range check (
    all_day = true or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

alter table public.time_tasks_events add column if not exists reminder_minutes integer not null default 0;
alter table public.time_tasks_events add column if not exists notified_at timestamptz;

-- Preserva os eventos do primeiro lançamento sem alterar a tabela legada.
-- O bloco condicional também permite provisionar uma instância nova, onde
-- public.events nunca existiu.
do $$
begin
  if to_regclass('public.events') is not null then
    execute $migration$
      insert into public.time_tasks_events (
        id, user_id, title, date, start_time, end_time, all_day, calendar,
        description, reminder_minutes, notified_at, created_at, updated_at
      )
      select
        id, user_id, title, date, start_time, end_time, all_day, calendar,
        coalesce(description, ''), 0, null, created_at, updated_at
      from public.events
      on conflict (id) do nothing
    $migration$;
  end if;
end;
$$;

-- Usuários que já possuíam eventos antes desta versão pertencem ao aplicativo.
insert into public.time_tasks_members (user_id)
select distinct user_id from public.time_tasks_events
on conflict (user_id) do nothing;

create index if not exists time_tasks_events_user_date_idx on public.time_tasks_events (user_id, date);
alter table public.time_tasks_events enable row level security;

drop policy if exists "time_tasks_events_select_own" on public.time_tasks_events;
create policy "time_tasks_events_select_own" on public.time_tasks_events for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_events_insert_own" on public.time_tasks_events;
create policy "time_tasks_events_insert_own" on public.time_tasks_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_events_update_own" on public.time_tasks_events;
create policy "time_tasks_events_update_own" on public.time_tasks_events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_events_delete_own" on public.time_tasks_events;
create policy "time_tasks_events_delete_own" on public.time_tasks_events for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_events to authenticated;
revoke all on public.time_tasks_events from anon;

-- ---------------------------------------------------------------------------
-- Preferências por usuário
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  language text not null default 'pt-BR' check (language in ('pt-BR', 'en-US', 'es-ES')),
  timezone text not null default 'America/Fortaleza',
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  hour_24 boolean not null default true,
  week_starts_on integer not null default 1 check (week_starts_on between 0 and 6),
  default_calendar text not null default 'pessoal' check (default_calendar in ('pessoal', 'trabalho', 'saude', 'estudos', 'social')),
  calendar_visibility jsonb not null default '{"pessoal":true,"trabalho":true,"saude":true,"estudos":true,"social":true}'::jsonb,
  browser_notifications boolean not null default false,
  event_notifications boolean not null default true,
  sound_enabled boolean not null default true,
  verse_notifications boolean not null default true,
  verse_morning_time time not null default '08:00',
  verse_afternoon_time time not null default '16:00',
  smart_response boolean not null default true,
  voice_input boolean not null default true,
  smart_sync boolean not null default true,
  default_duration integer not null default 60 check (default_duration between 5 and 1440),
  default_reminder integer not null default 0 check (default_reminder between 0 and 10080),
  all_day_reminder integer not null default 540 check (all_day_reminder between 0 and 10080),
  conflict_check boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.time_tasks_settings add column if not exists verse_notifications boolean not null default true;
alter table public.time_tasks_settings add column if not exists verse_morning_time time not null default '08:00';
alter table public.time_tasks_settings add column if not exists verse_afternoon_time time not null default '16:00';

alter table public.time_tasks_settings enable row level security;
drop policy if exists "time_tasks_settings_select_own" on public.time_tasks_settings;
create policy "time_tasks_settings_select_own" on public.time_tasks_settings for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_settings_insert_own" on public.time_tasks_settings;
create policy "time_tasks_settings_insert_own" on public.time_tasks_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_settings_update_own" on public.time_tasks_settings;
create policy "time_tasks_settings_update_own" on public.time_tasks_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_settings_delete_own" on public.time_tasks_settings;
create policy "time_tasks_settings_delete_own" on public.time_tasks_settings for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_settings to authenticated;
revoke all on public.time_tasks_settings from anon;

-- ---------------------------------------------------------------------------
-- Sementes (tarefas rápidas)
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  notes text not null default '',
  due_at timestamptz,
  reminder_at timestamptz,
  completed boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_tasks_seeds_user_due_idx on public.time_tasks_seeds (user_id, completed, due_at);
alter table public.time_tasks_seeds enable row level security;
drop policy if exists "time_tasks_seeds_select_own" on public.time_tasks_seeds;
create policy "time_tasks_seeds_select_own" on public.time_tasks_seeds for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_seeds_insert_own" on public.time_tasks_seeds;
create policy "time_tasks_seeds_insert_own" on public.time_tasks_seeds for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_seeds_update_own" on public.time_tasks_seeds;
create policy "time_tasks_seeds_update_own" on public.time_tasks_seeds for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_seeds_delete_own" on public.time_tasks_seeds;
create policy "time_tasks_seeds_delete_own" on public.time_tasks_seeds for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_seeds to authenticated;
revoke all on public.time_tasks_seeds from anon;

-- ---------------------------------------------------------------------------
-- Páginas públicas de agendamento e reservas
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_booking_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  owner_name text not null default '',
  duration_minutes integer not null default 30 check (duration_minutes between 10 and 480),
  timezone text not null default 'America/Fortaleza',
  availability jsonb not null default '{"weekdays":[1,2,3,4,5],"start":"09:00","end":"17:00"}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_tasks_booking_pages_user_idx on public.time_tasks_booking_pages (user_id);
alter table public.time_tasks_booking_pages enable row level security;
drop policy if exists "time_tasks_booking_pages_select_own_or_public" on public.time_tasks_booking_pages;
create policy "time_tasks_booking_pages_select_own_or_public" on public.time_tasks_booking_pages for select to authenticated
  using ((select auth.uid()) = user_id or active = true);
drop policy if exists "time_tasks_booking_pages_select_public" on public.time_tasks_booking_pages;
create policy "time_tasks_booking_pages_select_public" on public.time_tasks_booking_pages for select to anon
  using (active = true);
drop policy if exists "time_tasks_booking_pages_insert_own" on public.time_tasks_booking_pages;
create policy "time_tasks_booking_pages_insert_own" on public.time_tasks_booking_pages for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_booking_pages_update_own" on public.time_tasks_booking_pages;
create policy "time_tasks_booking_pages_update_own" on public.time_tasks_booking_pages for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_booking_pages_delete_own" on public.time_tasks_booking_pages;
create policy "time_tasks_booking_pages_delete_own" on public.time_tasks_booking_pages for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_booking_pages to authenticated;
revoke all on public.time_tasks_booking_pages from anon;
grant select (id, title, slug, description, owner_name, duration_minutes, timezone, availability, active)
  on public.time_tasks_booking_pages to anon;

create table if not exists public.time_tasks_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_page_id uuid not null references public.time_tasks_booking_pages(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) > 0),
  guest_email text not null check (position('@' in guest_email) > 1),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text not null default '',
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_range check (ends_at > starts_at)
);

create unique index if not exists time_tasks_bookings_confirmed_slot_idx
  on public.time_tasks_bookings (booking_page_id, starts_at)
  where status = 'confirmed';
create index if not exists time_tasks_bookings_page_date_idx on public.time_tasks_bookings (booking_page_id, starts_at);
alter table public.time_tasks_bookings enable row level security;

drop policy if exists "time_tasks_bookings_owner_select" on public.time_tasks_bookings;
create policy "time_tasks_bookings_owner_select" on public.time_tasks_bookings for select to authenticated
  using (exists (
    select 1 from public.time_tasks_booking_pages page
    where page.id = booking_page_id and page.user_id = (select auth.uid())
  ));
drop policy if exists "time_tasks_bookings_public_insert" on public.time_tasks_bookings;
create policy "time_tasks_bookings_public_insert" on public.time_tasks_bookings for insert to anon, authenticated
  with check (exists (
    select 1 from public.time_tasks_booking_pages page
    where page.id = booking_page_id and page.active = true
  ));
drop policy if exists "time_tasks_bookings_owner_update" on public.time_tasks_bookings;
create policy "time_tasks_bookings_owner_update" on public.time_tasks_bookings for update to authenticated
  using (exists (
    select 1 from public.time_tasks_booking_pages page
    where page.id = booking_page_id and page.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.time_tasks_booking_pages page
    where page.id = booking_page_id and page.user_id = (select auth.uid())
  ));
drop policy if exists "time_tasks_bookings_owner_delete" on public.time_tasks_bookings;
create policy "time_tasks_bookings_owner_delete" on public.time_tasks_bookings for delete to authenticated
  using (exists (
    select 1 from public.time_tasks_booking_pages page
    where page.id = booking_page_id and page.user_id = (select auth.uid())
  ));

grant select, update, delete on public.time_tasks_bookings to authenticated;
grant insert (booking_page_id, guest_name, guest_email, starts_at, ends_at, notes)
  on public.time_tasks_bookings to anon, authenticated;
revoke all on public.time_tasks_bookings from anon;
grant insert (booking_page_id, guest_name, guest_email, starts_at, ends_at, notes)
  on public.time_tasks_bookings to anon;

-- ---------------------------------------------------------------------------
-- Histórico da SX
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_sx_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(trim(content)) > 0),
  action text,
  created_at timestamptz not null default now()
);

create index if not exists time_tasks_sx_messages_user_created_idx on public.time_tasks_sx_messages (user_id, created_at desc);
alter table public.time_tasks_sx_messages enable row level security;
drop policy if exists "time_tasks_sx_messages_select_own" on public.time_tasks_sx_messages;
create policy "time_tasks_sx_messages_select_own" on public.time_tasks_sx_messages for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_sx_messages_insert_own" on public.time_tasks_sx_messages;
create policy "time_tasks_sx_messages_insert_own" on public.time_tasks_sx_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_sx_messages_delete_own" on public.time_tasks_sx_messages;
create policy "time_tasks_sx_messages_delete_own" on public.time_tasks_sx_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.time_tasks_sx_messages to authenticated;
revoke all on public.time_tasks_sx_messages from anon;

-- ---------------------------------------------------------------------------
-- Histórico de versículos entregues (impede repetição por usuário)
-- ---------------------------------------------------------------------------
create table if not exists public.time_tasks_verse_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_key text not null,
  reference text not null,
  verse_text text not null,
  period text not null check (period in ('morning', 'afternoon')),
  delivery_date date not null,
  delivered_at timestamptz not null default now(),
  unique (user_id, verse_key),
  unique (user_id, delivery_date, period)
);

create index if not exists time_tasks_verse_deliveries_user_date_idx
  on public.time_tasks_verse_deliveries (user_id, delivery_date desc);
alter table public.time_tasks_verse_deliveries enable row level security;
drop policy if exists "time_tasks_verse_deliveries_select_own" on public.time_tasks_verse_deliveries;
create policy "time_tasks_verse_deliveries_select_own" on public.time_tasks_verse_deliveries for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_verse_deliveries_insert_own" on public.time_tasks_verse_deliveries;
create policy "time_tasks_verse_deliveries_insert_own" on public.time_tasks_verse_deliveries for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.time_tasks_verse_deliveries to authenticated;
revoke all on public.time_tasks_verse_deliveries from anon;

-- Migração segura de usuários que já tinham dados em qualquer camada do app.
insert into public.time_tasks_members (user_id)
select user_id from public.time_tasks_settings
union select user_id from public.time_tasks_seeds
union select user_id from public.time_tasks_booking_pages
union select user_id from public.time_tasks_sx_messages
union select user_id from public.time_tasks_verse_deliveries
on conflict (user_id) do nothing;
