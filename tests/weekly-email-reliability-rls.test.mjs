import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const owner = "00000000-0000-4000-8000-000000000001";
const run = "00000000-0000-4000-8000-000000000002";
const attempt = "00000000-0000-4000-8000-000000000003";
const tables = ["garden_email_dispatch_runs", "garden_weekly_email_deliveries"];
const runInsert = `insert into public.garden_email_dispatch_runs(id,status) values ('${run}','running')`;
const deliveryInsert = `insert into public.garden_weekly_email_deliveries(user_id,week_start,scheduled_day,preference_fingerprint,status,attempts,attempt_id,last_attempt_at,run_id) values ('${owner}','2026-11-02','2026-11-02','fixture','pending',1,'${attempt}',now(),'${run}')`;
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values ('${owner}');`);
  // Match Supabase's broad default table grants, not only a bare PostgreSQL DB.
  await db.exec("alter default privileges in schema public grant all on tables to anon, authenticated, service_role;");
  const sql = fs.readFileSync(new URL("../supabase/weekly-email-reliability.sql", import.meta.url), "utf8");
  await db.exec(sql);
  await db.exec(sql);
  return db;
}

test("email reliability migration reruns, isolates private records, and grants service-only read/write", async () => {
  const db = await fixture();
  try {
    await db.exec(`set role service_role; ${runInsert}; ${deliveryInsert};`);
    for (const table of tables) {
      assert.equal((await db.query(`select * from public.${table}`)).rows.length, 1);
    }
    assert.equal((await db.query("update public.garden_email_dispatch_runs set status='completed' returning id")).rows.length, 1);
    assert.equal((await db.query("update public.garden_weekly_email_deliveries set status='accepted',version=version+1 returning user_id")).rows.length, 1);
    for (const table of tables) await assert.rejects(db.exec(`delete from public.${table}`), /permission denied/);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role; set role ${role};`);
      for (const table of tables) {
        await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
        await assert.rejects(db.exec(`update public.${table} set status='pending'`), /permission denied/);
        await assert.rejects(db.exec(`delete from public.${table}`), /permission denied/);
        await assert.rejects(db.exec(`truncate public.${table}`), /permission denied/);
      }
      await assert.rejects(db.exec(runInsert), /permission denied/);
      await assert.rejects(db.exec(deliveryInsert), /permission denied/);
    }
    // Even accidental table grants do not expose rows: there are no client policies.
    await db.exec(`reset role; grant select,insert,update,delete on public.garden_email_dispatch_runs,public.garden_weekly_email_deliveries to authenticated; set role authenticated;`);
    for (const table of tables) {
      assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0);
      assert.equal((await db.query(`update public.${table} set status='accepted' returning *`)).rows.length, 0);
      assert.equal((await db.query(`delete from public.${table} returning *`)).rows.length, 0);
    }
    await assert.rejects(db.exec(runInsert), /row-level security/);
    await assert.rejects(db.exec(deliveryInsert), /row-level security/);
  } finally { await db.close(); }
});

test("email reliability constraints preserve unique weekly claims and valid bounded states", async () => {
  const db = await fixture();
  try {
    await db.exec(`set role service_role; ${runInsert}; ${deliveryInsert};`);
    await assert.rejects(db.exec(runInsert), /duplicate key/);
    await assert.rejects(db.exec(deliveryInsert), /duplicate key/);
    for (const statement of [
      "update public.garden_email_dispatch_runs set status='invalid'",
      "update public.garden_weekly_email_deliveries set status='invalid'",
      "update public.garden_weekly_email_deliveries set attempts=0",
      "update public.garden_weekly_email_deliveries set attempts=4",
      "update public.garden_weekly_email_deliveries set version=0",
    ]) await assert.rejects(db.exec(statement), /check constraint/);
    for (const column of ["week_start", "scheduled_day", "preference_fingerprint", "attempt_id", "last_attempt_at", "run_id"]) {
      await assert.rejects(db.exec(`update public.garden_weekly_email_deliveries set ${column}=null`), /not-null constraint/);
    }
    await assert.rejects(db.exec("update public.garden_weekly_email_deliveries set run_id='00000000-0000-4000-8000-000000000099'"), /foreign key/);
    await assert.rejects(db.exec("update public.garden_weekly_email_deliveries set user_id='00000000-0000-4000-8000-000000000099'"), /foreign key/);
    for (const status of ["pending", "accepted", "retryable", "rejected", "unknown", "cancelled"]) {
      await db.exec(`update public.garden_weekly_email_deliveries set status='${status}'`);
    }
    await db.exec("update public.garden_weekly_email_deliveries set attempts=3,version=2");
  } finally { await db.close(); }
});
