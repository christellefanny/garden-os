-- Additive Garden OS 2.0 migration. No existing garden, vault, or layout is deleted.
begin;
create table if not exists public.garden_os_state (
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null check(length(key) between 1 and 250),
 value jsonb not null,
 version integer not null default 1 check(version > 0),
 updated_at timestamptz not null default now(),
 primary key(user_id,key)
);
alter table public.garden_os_state enable row level security;
revoke all on public.garden_os_state from public, anon;
grant select,insert,update on public.garden_os_state to authenticated;
drop policy if exists garden_os_state_owner on public.garden_os_state;
create policy garden_os_state_owner on public.garden_os_state to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists garden_os_state_private_gate on public.garden_os_state;
create policy garden_os_state_private_gate on public.garden_os_state as restrictive to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create or replace function public.garden_os_save_state(p_key text,p_value jsonb,p_version integer)
returns setof public.garden_os_state language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_key not like 'garden-os-%' or position(auth.uid()::text in p_key)=0 or octet_length(p_value::text)>1500000 then raise exception 'Invalid state' using errcode='22023'; end if;
 if p_version=0 then
  return query insert into public.garden_os_state(user_id,key,value) values(auth.uid(),p_key,p_value) returning *;
 else
  return query update public.garden_os_state set value=p_value,version=version+1,updated_at=now() where user_id=auth.uid() and key=p_key and version=p_version returning *;
  if not found then raise exception 'State changed on another device' using errcode='40001'; end if;
 end if;
end $$;
revoke all on function public.garden_os_save_state(text,jsonb,integer) from public,anon;
grant execute on function public.garden_os_save_state(text,jsonb,integer) to authenticated;
commit;
