-- Poker Tournament — full schema
-- Run this once on a fresh Neon (or any Postgres) database

-- Users
create table if not exists users (
  id            serial primary key,
  email         text unique not null,
  username      text unique not null,
  password      text not null,
  role          text not null default 'user',
  bg_image      text,
  reset_token   text,
  reset_expires timestamptz,
  created_at    timestamptz default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id         serial primary key,
  user_id    integer not null references users(id) on delete cascade,
  plan       text not null default 'free',
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Game sessions (cloud save)
create table if not exists game_sessions (
  user_id    text primary key,
  game_state jsonb not null,
  updated_at timestamptz default now()
);

-- Game history
create table if not exists game_history (
  id         serial primary key,
  user_id    integer not null references users(id) on delete cascade,
  game_state jsonb not null,
  saved_at   timestamptz default now()
);

-- Payment requests
create table if not exists payment_requests (
  id                              serial primary key,
  user_id                         integer not null references users(id) on delete cascade,
  plan                            text not null,
  billing_cycle                   text not null,
  amount                          numeric(10,2) not null,
  status                          text not null default 'awaiting_transfer',
  expected_from_bank              text,
  expected_from_account_number    text,
  payment_window_expires_at       timestamptz,
  approved_at                     timestamptz,
  created_at                      timestamptz default now()
);

-- Donations
create table if not exists donations (
  id          serial primary key,
  user_id     integer references users(id) on delete set null,
  amount      numeric(10,2),
  status      text not null default 'awaiting_transfer',
  from_bank   text,
  from_account text,
  approved_at timestamptz,
  created_at  timestamptz default now()
);

-- Auto-give 1-day full_pro trial on new user registration
create or replace function give_trial_plan()
returns trigger language plpgsql as $$
begin
  insert into subscriptions (user_id, plan, expires_at)
  values (new.id, 'full_pro', now() + interval '1 day');
  return new;
end;
$$;

drop trigger if exists after_user_register on users;
create trigger after_user_register
  after insert on users
  for each row execute function give_trial_plan();
