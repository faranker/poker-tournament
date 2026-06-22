-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  email      text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id);

-- ── subscriptions ──────────────────────────────────────────
create table if not exists public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  plan       text not null default 'free',   -- 'free' | 'cash_pro' | 'full_pro'
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── export_logs ─────────────────────────────────────────────
create table if not exists public.export_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  month      text not null,                  -- 'YYYY-MM'
  count      int  not null default 0,
  unique(user_id, month)
);

-- ── RLS policies ────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.export_logs   enable row level security;

-- users can only read/write their own rows
create policy "own subscription" on public.subscriptions
  for all using (auth.uid() = user_id);

create policy "own export logs" on public.export_logs
  for all using (auth.uid() = user_id);

-- ── auto-insert free subscription on signup ─────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions(user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
