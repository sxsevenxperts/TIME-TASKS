-- Tabela para rastreio de sincronizações
create table if not exists public.time_tasks_sync_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references time_tasks_calendar_integrations(id) on delete cascade,
  user_id uuid not null,
  provider text not null,
  status text not null check (status in ('success', 'error', 'partial')),
  events_synced integer not null default 0,
  events_created integer not null default 0,
  events_updated integer not null default 0,
  error_message text,
  sync_duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists time_tasks_sync_logs_integration_idx on public.time_tasks_sync_logs (integration_id);
create index if not exists time_tasks_sync_logs_user_created_idx on public.time_tasks_sync_logs (user_id, created_at desc);

-- RLS para logs
alter table public.time_tasks_sync_logs enable row level security;
drop policy if exists "time_tasks_sync_logs_select_own" on public.time_tasks_sync_logs;
create policy "time_tasks_sync_logs_select_own" on public.time_tasks_sync_logs for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.time_tasks_sync_logs to authenticated;
revoke all on public.time_tasks_sync_logs from anon;
