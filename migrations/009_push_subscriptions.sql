-- 009 — Inscrições Web Push por aparelho
-- Cada linha é um aparelho/navegador inscrito para receber push do usuário.
-- O servidor (service role) lê as inscrições para enviar; o usuário gerencia
-- apenas as próprias linhas via RLS.

create table if not exists public.time_tasks_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) > 0),
  auth text not null,
  p256dh text not null,
  subscribed_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists time_tasks_push_subscriptions_user_idx
  on public.time_tasks_push_subscriptions (user_id);

alter table public.time_tasks_push_subscriptions enable row level security;

drop policy if exists "time_tasks_push_subscriptions_select_own" on public.time_tasks_push_subscriptions;
create policy "time_tasks_push_subscriptions_select_own" on public.time_tasks_push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "time_tasks_push_subscriptions_insert_own" on public.time_tasks_push_subscriptions;
create policy "time_tasks_push_subscriptions_insert_own" on public.time_tasks_push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "time_tasks_push_subscriptions_update_own" on public.time_tasks_push_subscriptions;
create policy "time_tasks_push_subscriptions_update_own" on public.time_tasks_push_subscriptions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "time_tasks_push_subscriptions_delete_own" on public.time_tasks_push_subscriptions;
create policy "time_tasks_push_subscriptions_delete_own" on public.time_tasks_push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.time_tasks_push_subscriptions to authenticated;
revoke all on public.time_tasks_push_subscriptions from anon;
