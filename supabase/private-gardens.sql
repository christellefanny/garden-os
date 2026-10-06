-- Run after creating your Garden OS account. Replace the email below.
-- Transactional and additive. Existing gardens/spaces/notes remain intact.
begin;

alter table public.gardens add column if not exists user_id uuid references auth.users(id);
alter table public.gardens alter column user_id set default auth.uid();

do $$
declare
  owner_email text := 'YOUR_SIGN_IN_EMAIL';
  owner_uuid uuid;
begin
  select id into owner_uuid from auth.users where lower(email) = lower(owner_email);
  if owner_uuid is null then
    raise exception 'Create your Garden OS account first, then replace YOUR_SIGN_IN_EMAIL with that account email.';
  end if;
  update public.gardens set user_id = owner_uuid where user_id is null;
end $$;

alter table public.gardens alter column user_id set not null;
create index if not exists gardens_user_id_idx on public.gardens(user_id);
create index if not exists growing_spaces_garden_id_idx on public.growing_spaces(garden_id);

alter table public.gardens enable row level security;
alter table public.growing_spaces enable row level security;
revoke all on public.gardens, public.growing_spaces from public, anon;
grant select, insert, update on public.gardens, public.growing_spaces to authenticated;

-- Restrictive gates prevent any older permissive policy from exposing another
-- person's records. Existing unrelated policies are preserved.
drop policy if exists garden_os_private_gate on public.gardens;
create policy garden_os_private_gate on public.gardens as restrictive
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists garden_os_owner_access on public.gardens;
create policy garden_os_owner_access on public.gardens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists garden_os_private_gate on public.growing_spaces;
create policy garden_os_private_gate on public.growing_spaces as restrictive
  for all to authenticated
  using (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = (select auth.uid())))
  with check (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = (select auth.uid())));
drop policy if exists garden_os_owner_access on public.growing_spaces;
create policy garden_os_owner_access on public.growing_spaces
  for all to authenticated
  using (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = (select auth.uid())))
  with check (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = (select auth.uid())));

commit;

-- Optional cleanup of the exact temporary verification garden created by Codex.
-- No personal garden matches this ID/name pair.
-- delete from public.growing_spaces where garden_id = '1eb853b3-1bad-41b7-ae84-9c409c125541';
-- delete from public.gardens where id = '1eb853b3-1bad-41b7-ae84-9c409c125541'
--   and name = 'Garden OS verification (temporary)';
