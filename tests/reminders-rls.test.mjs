import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("reminder migration reruns and isolates two accounts from anonymous access", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('app.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`,
    );
    const sql = fs.readFileSync(
      new URL("../supabase/growing-reminders.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.exec(
      `set role authenticated;select set_config('app.uid','00000000-0000-4000-8000-000000000001',false);insert into public.garden_reminder_devices(user_id,endpoint,subscription) values ('00000000-0000-4000-8000-000000000001','https://example.test/device','{}');`,
    );
    assert.equal(
      (await db.query("select * from public.garden_reminder_devices")).rows
        .length,
      1,
    );
    await db.exec(
      `select set_config('app.uid','00000000-0000-4000-8000-000000000002',false);`,
    );
    assert.equal(
      (await db.query("select * from public.garden_reminder_devices")).rows
        .length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update public.garden_reminder_devices set tasks='[]' returning id",
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        `insert into public.garden_reminder_devices(user_id,endpoint,subscription) values ('00000000-0000-4000-8000-000000000001','other','{}');`,
      ),
    );
    await db.exec("reset role;set role anon;");
    await assert.rejects(
      db.query("select * from public.garden_reminder_devices"),
    );
  } finally {
    await db.close();
  }
});
