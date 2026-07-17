-- Triggers e central de notificações (Fase 6) — versão corrigida em 17/07/2026.
-- Idempotente, com grants explícitos e escrita restrita ao próprio usuário.
-- O bloco canônico equivalente vive em supabase/schema.sql.

create table if not exists public.time_tasks_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  type text not null check (type in ('weather', 'summary', 'reminder')),
  enabled boolean not null default true,
  condition jsonb not null default '{}'::jsonb,
  action jsonb not null default '{}'::jsonb,
  schedule text not null default 'daily',
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists time_tasks_triggers_user_idx on public.time_tasks_triggers (user_id);
create index if not exists time_tasks_triggers_enabled_idx on public.time_tasks_triggers (enabled);
create index if not exists time_tasks_triggers_next_run_idx on public.time_tasks_triggers (next_run_at);

alter table public.time_tasks_triggers enable row level security;

-- Remove as políticas da primeira versão (nomes antigos) e as recria com padrão do projeto.
drop policy if exists "Users can see own triggers" on public.time_tasks_triggers;
drop policy if exists "Users can create own triggers" on public.time_tasks_triggers;
drop policy if exists "Users can update own triggers" on public.time_tasks_triggers;
drop policy if exists "Users can delete own triggers" on public.time_tasks_triggers;

drop policy if exists "time_tasks_triggers_select_own" on public.time_tasks_triggers;
create policy "time_tasks_triggers_select_own" on public.time_tasks_triggers for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_triggers_insert_own" on public.time_tasks_triggers;
create policy "time_tasks_triggers_insert_own" on public.time_tasks_triggers for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_triggers_update_own" on public.time_tasks_triggers;
create policy "time_tasks_triggers_update_own" on public.time_tasks_triggers for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_triggers_delete_own" on public.time_tasks_triggers;
create policy "time_tasks_triggers_delete_own" on public.time_tasks_triggers for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_triggers to authenticated;
revoke all on public.time_tasks_triggers from anon;

create table if not exists public.time_tasks_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_id uuid references public.time_tasks_triggers(id) on delete set null,
  type text not null check (type in ('trigger', 'reminder', 'verse', 'system')),
  title text not null check (char_length(trim(title)) > 0),
  message text not null default '',
  icon text,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists time_tasks_notifications_user_created_idx on public.time_tasks_notifications (user_id, created_at desc);
create index if not exists time_tasks_notifications_user_read_idx on public.time_tasks_notifications (user_id, read);

alter table public.time_tasks_notifications enable row level security;

-- A política antiga "System can insert notifications" usava with check (true)
-- e permitia escrita anônima em qualquer usuário. O worker do executor usará
-- service_role (que ignora RLS); usuários autenticados só escrevem para si.
drop policy if exists "Users can see own notifications" on public.time_tasks_notifications;
drop policy if exists "System can insert notifications" on public.time_tasks_notifications;
drop policy if exists "Users can update own notifications" on public.time_tasks_notifications;
drop policy if exists "Users can delete own notifications" on public.time_tasks_notifications;

drop policy if exists "time_tasks_notifications_select_own" on public.time_tasks_notifications;
create policy "time_tasks_notifications_select_own" on public.time_tasks_notifications for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_notifications_insert_own" on public.time_tasks_notifications;
create policy "time_tasks_notifications_insert_own" on public.time_tasks_notifications for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_notifications_update_own" on public.time_tasks_notifications;
create policy "time_tasks_notifications_update_own" on public.time_tasks_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "time_tasks_notifications_delete_own" on public.time_tasks_notifications;
create policy "time_tasks_notifications_delete_own" on public.time_tasks_notifications for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_notifications to authenticated;
revoke all on public.time_tasks_notifications from anon;
