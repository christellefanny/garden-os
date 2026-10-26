import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const owner = '11111111-1111-4111-8111-111111111111';
const friend = '22222222-2222-4222-8222-222222222222';
const garden = '33333333-3333-4333-8333-333333333333';
const space = '44444444-4444-4444-8444-444444444444';
const schema = `
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users(id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  insert into auth.users values ('${owner}','owner@example.test'),('${friend}','friend@example.test');
  create table public.gardens(id uuid primary key default gen_random_uuid(),name text,year int,location text,hardiness_zone text);
  create table public.growing_spaces(id uuid primary key default gen_random_uuid(),garden_id uuid references public.gardens(id),name text,notes text);
  insert into public.gardens(id,name,year) values('${garden}','Existing Garden',2026);
  insert into public.growing_spaces values('${space}','${garden}','Existing Bed','Keep original notes');
  grant all on public.gardens, public.growing_spaces to anon, authenticated;
  alter table public.gardens enable row level security;
  create policy legacy_allow_all on public.gardens for all to authenticated using(true) with check(true);
  alter table public.growing_spaces enable row level security;
  create policy legacy_allow_all on public.growing_spaces for all to authenticated using(true) with check(true);
`;

test('private setup preserves legacy data and enforces two-account ownership despite older permissive policies', async () => {
  const db = new PGlite();
  try {
    await db.exec(schema);
    const migration = (await readFile(new URL('../supabase/private-gardens.sql',import.meta.url),'utf8')).replace(/owner_email text := '[^']*'/, "owner_email text := 'owner@example.test'");
    await db.exec(migration);
    await db.exec(migration); // Idempotent rerun.
    assert.equal((await db.query('select notes from growing_spaces')).rows[0].notes, 'Keep original notes');
    await db.exec(`set role authenticated; select set_config('app.uid','${owner}',false);`);
    assert.equal((await db.query('select id from gardens')).rows.length, 1);
    assert.equal((await db.query('select id from growing_spaces')).rows.length, 1);
    await db.exec("update growing_spaces set notes = 'Owner edit';");
    await assert.rejects(db.exec(`update gardens set user_id='${friend}' where id='${garden}'`), /row-level security/);
    await db.exec(`select set_config('app.uid','${friend}',false);`);
    assert.equal((await db.query('select id from gardens')).rows.length, 0);
    assert.equal((await db.query('select id from growing_spaces')).rows.length, 0);
    await assert.rejects(db.exec(`insert into growing_spaces(garden_id,name) values('${garden}','Unauthorized bed')`), /row-level security/);
    const own = await db.query("insert into gardens(name,year) values('Friend Garden',2027) returning id,user_id");
    assert.equal(own.rows[0].user_id, friend);
    await db.exec(`insert into growing_spaces(garden_id,name) values('${own.rows[0].id}','Friend Bed');`);
    assert.equal((await db.query('select id from gardens')).rows.length, 1);
    assert.equal((await db.query('select id from growing_spaces')).rows.length, 1);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select * from gardens'), /permission denied/);
    await assert.rejects(db.exec("insert into gardens(name,year) values('Anonymous',2026)"), /permission denied/);
  } finally { await db.close(); }
});

test('private setup rolls back if the owner account has not been created', async () => {
  const db = new PGlite();
  try {
    await db.exec(schema);
    const migration = await readFile(new URL('../supabase/private-gardens.sql',import.meta.url),'utf8');
    await assert.rejects(db.exec(migration), /Create your Garden OS account first/);
    await db.exec('rollback;');
    assert.equal((await db.query("select column_name from information_schema.columns where table_name='gardens' and column_name='user_id'")).rows.length, 0);
    assert.equal((await db.query('select name from gardens')).rows[0].name,'Existing Garden');
  } finally { await db.close(); }
});
