-- ================================================================
-- Poker Tournament — Database Schema
-- Run this in psql or pgAdmin after creating the database
-- ================================================================

-- Users table (replaces Supabase auth.users)
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  username    text not null unique,
  password    text not null,
  created_at  timestamptz default now(),
  reset_token text,
  reset_expires timestamptz,
  bg_image text
);
alter table users add column if not exists bg_image text;

-- Subscriptions (plan management)
create table if not exists subscriptions (
  user_id    uuid primary key references users(id) on delete cascade,
  plan       text not null default 'free' check (plan in ('free','cash_pro','full_pro')),
  expires_at timestamptz,
  updated_at timestamptz default now()
);

-- Export logs (track free tier usage)
create table if not exists export_logs (
  id         serial primary key,
  user_id    uuid not null references users(id) on delete cascade,
  mode       text not null,
  exported_at timestamptz default now()
);

-- Payment requests (slip upload, and SCB auto-match)
create table if not exists payment_requests (
  id           serial primary key,
  user_id      uuid not null references users(id) on delete cascade,
  plan         text not null,
  billing_cycle text not null default 'monthly',
  amount       numeric not null,
  slip_path    text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at  timestamptz,
  created_at   timestamptz default now()
);

-- 2026-08-21 — SCB auto-match: a request starts as 'awaiting_transfer' with a
-- payment window; the line-forwarder-app webhook auto-approves it on a match,
-- or it becomes 'expired' and falls back to the existing slip-upload/admin flow.
alter table payment_requests add column if not exists expected_from_account_number text;
alter table payment_requests add column if not exists expected_from_bank text;
alter table payment_requests add column if not exists payment_window_expires_at timestamptz;
alter table payment_requests add column if not exists matched_transaction_key text unique;

alter table payment_requests drop constraint if exists payment_requests_status_check;
alter table payment_requests add constraint payment_requests_status_check
  check (status in ('awaiting_transfer','pending','expired','approved','rejected'));

-- Game sessions (persist game state per user)
create table if not exists game_sessions (
  user_id    text primary key,
  game_state jsonb not null,
  updated_at timestamptz default now()
);

-- Auto-insert trial plan when user registers (1 day trial)
create or replace function handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into subscriptions (user_id, plan, expires_at)
  values (new.id, 'full_pro', now() + interval '1 day');
  return new;
end;
$$;

drop trigger if exists on_user_created on users;
create trigger on_user_created
  after insert on users
  for each row execute function handle_new_user();

-- Indexes for performance
create index if not exists idx_export_logs_user_id on export_logs(user_id);
create index if not exists idx_export_logs_exported_at on export_logs(exported_at);
