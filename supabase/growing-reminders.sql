-- Run once in Garden OS Project > SQL Editor. Does not change gardens or growing_spaces.
begin;
create table if not exists public.garden_reminder_devices (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null,
 subscription jsonb not null,
 tasks jsonb not null default '[]'::jsonb check (jsonb_typeof(tasks)='array'),
 updated_at timestamptz not null default now(),
 last_sent_day date,
 last_test_at timestamptz,
 unique(user_id,endpoint)
);
alter table public.garden_reminder_devices enable row level security;
revoke all on public.garden_reminder_devices from anon;
grant select,insert,update,delete on public.garden_reminder_devices to authenticated;
grant all on public.garden_reminder_devices to service_role;
drop policy if exists garden_reminders_owner on public.garden_reminder_devices;
create policy garden_reminders_owner on public.garden_reminder_devices for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
commit;
