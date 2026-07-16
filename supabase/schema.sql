-- Time Tasks / SevenChat
-- Execute no Postgres do Supabase self-hosted antes do primeiro uso.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  date date not null,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  calendar text not null default 'pessoal' check (calendar in ('pessoal', 'trabalho', 'saude', 'estudos', 'social')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_range check (
    all_day = true or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists events_user_date_idx on public.events (user_id, date);
alter table public.events enable row level security;

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own" on public.events for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.events to authenticated;
revoke all on public.events from anon;
