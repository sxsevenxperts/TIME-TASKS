-- Tabela para armazenar tokens OAuth de integrações de calendário
create table if not exists public.time_tasks_calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'apple')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text not null,
  calendar_name text not null default '',
  is_active boolean not null default true,
  last_sync_at timestamptz,
  sync_errors text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, calendar_id)
);

-- Campos adicionais em time_tasks_events para rastreio de sincronização
alter table public.time_tasks_events add column if not exists external_id text;
alter table public.time_tasks_events add column if not exists external_source text check (external_source in ('google', 'apple', null));
alter table public.time_tasks_events add column if not exists external_calendar_id text;
alter table public.time_tasks_events add column if not exists synced_at timestamptz;
alter table public.time_tasks_events add column if not exists is_syncing boolean not null default false;

create index if not exists time_tasks_calendar_integrations_user_provider_idx on public.time_tasks_calendar_integrations (user_id, provider);
create index if not exists time_tasks_events_external_idx on public.time_tasks_events (user_id, external_source, external_id);

-- RLS para integrações
alter table public.time_tasks_calendar_integrations enable row level security;
drop policy if exists "time_tasks_calendar_integrations_select_own" on public.time_tasks_calendar_integrations;
create policy "time_tasks_calendar_integrations_select_own" on public.time_tasks_calendar_integrations for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_calendar_integrations_insert_own" on public.time_tasks_calendar_integrations;
create policy "time_tasks_calendar_integrations_insert_own" on public.time_tasks_calendar_integrations for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_calendar_integrations_update_own" on public.time_tasks_calendar_integrations;
create policy "time_tasks_calendar_integrations_update_own" on public.time_tasks_calendar_integrations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_calendar_integrations_delete_own" on public.time_tasks_calendar_integrations;
create policy "time_tasks_calendar_integrations_delete_own" on public.time_tasks_calendar_integrations for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_calendar_integrations to authenticated;
revoke all on public.time_tasks_calendar_integrations from anon;
