-- Additive, private operational history. Apply before deploying the dispatcher.
-- No subscription, garden, existing claim or delivery status is changed.
begin;
create table if not exists public.garden_email_dispatch_runs (
 id uuid primary key,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null check (status in ('running','completed','attention')),
 summary jsonb not null default '{}'::jsonb
);
create index if not exists garden_email_dispatch_runs_started on public.garden_email_dispatch_runs(started_at desc);
create table if not exists public.garden_weekly_email_deliveries (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 scheduled_day date not null,
 preference_fingerprint text not null,
 recipient_hash text,
 status text not null check (status in ('pending','accepted','retryable','rejected','unknown','cancelled')),
 attempts integer not null check (attempts between 1 and 3),
 version integer not null default 1 check (version > 0),
 attempt_id uuid not null,
 last_attempt_at timestamptz not null,
 next_attempt_at timestamptz,
 run_id uuid not null references public.garden_email_dispatch_runs(id),
 reason text,
 provider_status integer,
 provider_id text,
 primary key (user_id, week_start)
);
alter table public.garden_email_dispatch_runs enable row level security;
alter table public.garden_weekly_email_deliveries enable row level security;
-- Supabase may grant ALL through default privileges; reset every app role first.
revoke all on public.garden_email_dispatch_runs, public.garden_weekly_email_deliveries from public, anon, authenticated, service_role;
grant select, insert, update on public.garden_email_dispatch_runs, public.garden_weekly_email_deliveries to service_role;
-- No client policies: only the existing server service role may access these tables.
commit;
