-- ================================================================
-- LINE auto-approve bot: payer bank info + donations table
-- Safe to run multiple times (idempotent).
-- ================================================================

-- donations table may only exist in production already; create if missing
create table if not exists donations (
  id           serial primary key,
  display_name text not null,
  user_id      uuid references users(id) on delete set null,
  amount       numeric not null default 0,
  slip_path    text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at  timestamptz,
  created_at   timestamptz default now()
);

-- payer's own bank account info, entered at submit time so the LINE bot
-- can match an incoming bank-transfer notification to this request
alter table payment_requests add column if not exists payer_name text;
alter table payment_requests add column if not exists payer_bank text;

alter table donations add column if not exists payer_name text;
alter table donations add column if not exists payer_bank text;

create index if not exists idx_payment_requests_status_amount on payment_requests(status, amount);
create index if not exists idx_donations_status_amount on donations(status, amount);
