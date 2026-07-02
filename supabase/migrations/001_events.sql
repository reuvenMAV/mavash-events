-- MAVASH Events — Phase 1: owner events table
-- Run in Supabase SQL Editor or: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  tenant_id text not null,
  slug text not null,
  name text not null,
  type text not null default 'other',
  date text not null default '',
  venue text not null default '',
  tagline text not null default '',
  theme_json jsonb not null default '{"primary":"#1e3a5f","accent":"#c9a227","background":"#faf8f5"}'::jsonb,
  public_token text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists events_tenant_id_idx on public.events (tenant_id);
create index if not exists events_slug_idx on public.events (slug);
create index if not exists events_public_token_idx on public.events (public_token);

alter table public.events enable row level security;

-- Server uses service role (bypasses RLS). Policies for future direct client access:
create policy "tenants read own events"
  on public.events for select
  using (tenant_id = current_setting('app.tenant_id', true));

create policy "tenants insert own events"
  on public.events for insert
  with check (tenant_id = current_setting('app.tenant_id', true));

comment on table public.events is 'Owner-created events; guest RSVP/photos may still use GAS until phase 2';
