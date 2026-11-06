import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { emailPreferenceKey, validEmailPreferences, renderWeeklyEmail, unsubscribeToken } from "../lib/weekly-email.ts";
import { localDay } from "../lib/growing-calendar.ts";
import { weekBounds } from "../lib/weekly-brief.ts";
const owner = "a0a0a0a0-0000-4000-8000-000000000001";
const pref = { enabled: true, day: 1, gardenId: "g1", nonce: "b0b0b0b0-0000-4000-8000-000000000001" };
const monday = "2026-11-09T14:00:00Z";
const tuesday = "2026-11-10T14:00:00Z";
const ledgers = "garden_weekly_email_deliveries", audits = "garden_email_dispatch_runs";
function database() {
  const tables = { garden_os_state: [{ user_id: owner, key: emailPreferenceKey(owner), value: structuredClone(pref) }], [ledgers]: [], [audits]: [] };
  const db = { tables, fail: () => false, accountEmail: "owner@example.test", confirmed: true,
    auth: { admin: { getUserById: async () => ({ data: { user: { email: db.accountEmail, email_confirmed_at: db.confirmed ? "confirmed" : null } }, error: null }) } },
    from(table) {
      let operation = "select", body, filters = [], order, limit = Infinity;
      const q = {
        select: () => q, order(k) { order = k; return q; }, limit(n) { limit = n; return q; },
        like(k, pattern) { filters.push(r => r[k]?.startsWith(pattern.slice(0, -1))); return q; },
        eq(k, v) { filters.push(r => r[k] === v); return q; },
        gt(k, v) { filters.push(r => r[k] > v); return q; },
        insert(v) { operation = "insert"; body = structuredClone(v); return q; },
        update(v) { operation = "update"; body = structuredClone(v); return q; },
        maybeSingle() { return q.then(r => ({ ...r, data: r.data?.[0] || null })); },
        then(resolve, reject) {
          if (db.fail(table, operation, body)) return Promise.resolve({ data: null, error: { code: "fixture_failure" } }).then(resolve, reject);
          const rows = tables[table] || [];
          let matched = rows.filter(r => filters.every(f => f(r)));
          if (order) matched.sort((a, b) => String(a[order]).localeCompare(String(b[order])));
          matched = matched.slice(0, limit);
          if (operation === "insert") {
            const exists = rows.some(r => table === audits ? r.id === body.id : r.user_id === body.user_id && (table === ledgers ? r.week_start === body.week_start : r.key === body.key));
            if (exists) return Promise.resolve({ data: null, error: { code: "23505" } }).then(resolve, reject);
            rows.push(body); matched = [body];
          }
          if (operation === "update") matched.forEach(r => Object.assign(r, body));
          return Promise.resolve({ data: structuredClone(matched), error: null }).then(resolve, reject);
        },
      }; return q;
    },
  }; return db;
}
async function compile(file, mapping) {
  const source = await readFile(new URL("../" + file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
    .replace(/import[\s\S]*?from "([^"]+)";/g, (line, name) => mapping[name] ? `const {${mapping[name]}}=globalThis.__reliabilityTest;` : line);
  return import("data:text/javascript;base64," + Buffer.from(code + "\n//" + Math.random()).toString("base64"));
}
async function fixture(work) {
  const db = database(), requests = [], logs = [];
  const config = { response: () => Response.json({ id: "provider-id" }), prepare: async () => ({}), generate: async () => ({ start: "2026-11-09", end: "2026-11-15", garden: "Garden", location: "IL", summary: "Inspect", priorities: [], prepare: [], savedTasks: [], limitations: [] }) };
  globalThis.__reliabilityTest = { adminDatabase: () => db, loadBriefContext: (...args) => config.prepare(...args), generateWeeklyBrief: (...args) => config.generate(...args), emailPreferenceKey, validEmailPreferences, renderWeeklyEmail, unsubscribeToken, localDay, weekBounds };
  const mod = await compile("lib/weekly-email-server.ts", {
    "./reminders-server": "adminDatabase", "./weekly-brief-server": "loadBriefContext,generateWeeklyBrief",
    "./weekly-email": "emailPreferenceKey,validEmailPreferences,renderWeeklyEmail,unsubscribeToken", "./growing-calendar": "localDay", "./weekly-brief": "weekBounds",
  });
  const old = { ...process.env }, oldFetch = globalThis.fetch, oldError = console.error;
  Object.assign(process.env, { RESEND_API_KEY: "fixture-secret", GARDEN_EMAIL_FROM: "Garden <sender@example.test>", SUPABASE_SERVICE_ROLE_KEY: "fixture", CRON_SECRET: "fixture", VERCEL_ENV: "production" });
  globalThis.fetch = async (url, options) => { assert.equal(url, "https://api.resend.com/emails"); requests.push({ body: JSON.parse(options.body), key: options.headers["Idempotency-Key"] }); return config.response(); };
  console.error = (...args) => logs.push(args);
  try { await work({ db, config, requests, logs, mod, run: date => mod.dispatchWeeklyEmails(new Date(date || monday)) }); }
  finally {
    globalThis.fetch = oldFetch; console.error = oldError;
    for (const key of Object.keys(process.env)) if (!(key in old)) delete process.env[key];
    Object.assign(process.env, old); delete globalThis.__reliabilityTest;
  }
}
test("initial overlapping runs and accepted records prevent duplicate mail; audit contains only safe metadata", async () => fixture(async ({ db, requests, run, mod }) => {
  const results = await Promise.all([run(), run()]);
  assert.equal(results.reduce((n, r) => n + r.sent, 0), 1);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].body.to, ["owner@example.test"]);
  assert.equal(db.tables[ledgers][0].status, "accepted");
  assert.equal(db.tables[ledgers][0].provider_id, "provider-id");
  assert.equal(db.tables.garden_os_state[1].value.status, "pending"); // rollback barrier
  assert.equal((await run()).sent, 0);
  assert.equal(db.tables[audits].every(r => r.finished_at), true);
  assert.equal(mod.emailDispatchHealthy(results.find(r => r.sent)), true);
  const audit = JSON.stringify(db.tables[audits]);
  for (const privateText of ["owner@example.test", "fixture-secret", "List-Unsubscribe", "Garden <"]) assert.equal(audit.includes(privateText), false);
}));
test("scheduled dispatch uses the saved personalized greeting and a safe legacy fallback", async () => {
  for (const firstName of [undefined, "Élodie & O’Neil"]) {
    await fixture(async ({ db, requests, run }) => {
      if (firstName) db.tables.garden_os_state[0].value.firstName = firstName;
      assert.equal((await run()).sent, 1);
      assert.ok(requests[0].body.text.startsWith(firstName ? `Hello ${firstName},` : "Hello there,"));
      assert.ok(requests[0].body.html.includes(firstName ? "Hello Élodie &amp; O’Neil," : "Hello there,"));
      if (firstName) assert.equal(JSON.stringify(db.tables[audits]).includes(firstName), false);
    });
  }
});
test("429 retries once after cooldown with CAS, new idempotency key and unchanged subscription", async () => fixture(async ({ db, config, requests, run }) => {
  config.response = () => Response.json({}, { status: 429 });
  assert.equal((await run()).failed, 1);
  assert.equal(db.tables[ledgers][0].status, "retryable");
  assert.equal((await run()).sent, 0);
  config.response = () => Response.json({ id: "retry-success" });
  const result = await Promise.all([run(tuesday), run(tuesday)]);
  assert.equal(result.reduce((n, r) => n + r.sent, 0), 1);
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].key, requests[1].key);
  assert.equal(db.tables[ledgers][0].attempts, 2);
  assert.equal(db.tables.garden_os_state[0].value.day, 1);
}));
test("timeouts, transport failures, 5xx, 408, 409, malformed receipts and rejected 4xx never auto-resend", async () => {
  for (const response of [() => { throw new Error("private error"); }, () => Response.json({}, { status: 500 }), () => Response.json({}, { status: 408 }), () => Response.json({}, { status: 409 }), () => Response.json({}), () => Response.json({}, { status: 403 })]) {
    await fixture(async ({ config, requests, run, db }) => {
      config.response = response;
      assert.equal((await run()).failed, 1);
      assert.ok(["unknown", "rejected"].includes(db.tables[ledgers][0].status));
      assert.equal((await run(tuesday)).sent, 0);
      assert.equal(requests.length, 1);
    });
  }
});
test("missing audit table fails closed, and preview does not touch state", async () => fixture(async ({ db, requests, run }) => {
  db.fail = table => table === audits;
  const result = await run();
  assert.equal(result.reasons.audit_start_failed, 1);
  assert.equal(requests.length, 0);
  process.env.VERCEL_ENV = "preview";
  assert.equal((await run()).reasons.non_production, 1);
  assert.equal(db.tables[ledgers].length, 0);
}));
test("post-acceptance persistence failure holds pending; audit completion failure is visible", async () => fixture(async ({ db, requests, run }) => {
  db.fail = (table, op, body) => table === ledgers && op === "update" && body.status === "accepted";
  const result = await run();
  assert.equal(result.sent, 1);
  assert.equal(result.reasons.outcome_save_failed, 1);
  assert.equal(db.tables[ledgers][0].status, "pending");
  db.fail = (table, op) => table === audits && op === "update";
  assert.equal((await run(tuesday)).reasons.audit_finish_failed, 1);
  assert.equal(requests.length, 1);
}));
test("legacy claims are never retry authority and block duplicate sends", async () => {
  for (const status of ["pending", "sent", "retryable"]) await fixture(async ({ db, requests, run }) => {
    db.tables.garden_os_state.push({ user_id: owner, key: `garden-os-weekly-delivery-${owner}-2026-11-09`, value: { status } });
    assert.equal((await run()).reasons.legacy_claim_held, 1);
    assert.equal(requests.length, 0);
    assert.equal(db.tables[ledgers].length, 0);
  });
});
test("preparation failure is retryable but fresh next-day subscriptions are not backfilled", async () => fixture(async ({ config, requests, run }) => {
  assert.equal((await run(tuesday)).sent, 0);
  config.prepare = async () => { throw new Error("private garden error"); };
  assert.equal((await run()).reasons.preparation_failed, 1);
  assert.equal(requests.length, 0);
  config.prepare = async () => ({});
  assert.equal((await run(tuesday)).sent, 1);
}));
test("subscription field changes and unsubscribe prevent pending retries", async () => {
  for (const change of [{ nonce: "c0c0c0c0-0000-4000-8000-000000000001" }, { email: "new@example.test" }, { firstName: "Élodie" }, { gardenId: "g2" }, { day: 2 }, { enabled: false }]) {
    await fixture(async ({ db, config, requests, run }) => {
      config.response = () => Response.json({}, { status: 429 }); await run();
      Object.assign(db.tables.garden_os_state[0].value, change);
      config.response = () => Response.json({ id: "unexpected" });
      assert.equal((await run(tuesday)).sent, 0);
      assert.equal(requests.length, 1);
    });
  }
});
test("final consent is validated even if a client changes fields without rotating nonce", async () => {
  for (const change of [{ email: "changed@example.test" }, { firstName: "Changed" }]) {
    await fixture(async ({ db, config, requests, run }) => {
      config.generate = async () => { Object.assign(db.tables.garden_os_state[0].value, change); return {}; };
      assert.equal((await run()).reasons.subscription_changed, 1);
      assert.equal(requests.length, 0);
    });
  }
});
test("Auth fallback recipient change cancels a retry", async () => fixture(async ({ db, config, requests, run }) => {
  config.response = () => Response.json({}, { status: 429 }); await run();
  db.accountEmail = "changed@example.test";
  assert.equal((await run(tuesday)).reasons.recipient_changed, 1);
  assert.equal(requests.length, 1);
}));
test("three-attempt limit is enforced and exhausted attempts require review", async () => fixture(async ({ config, requests, run, db }) => {
  config.response = () => Response.json({}, { status: 429 });
  await run(); await run(tuesday);
  assert.equal((await run("2026-11-11T14:00:00Z")).reasons.attempts_exhausted, 1);
  assert.equal(db.tables[ledgers][0].status, "rejected");
  assert.equal((await run("2026-11-12T14:00:00Z")).sent, 0);
  assert.equal(requests.length, 3);
}));
test("Sunday failure retries Monday against the original week key", async () => fixture(async ({ db, config, requests, run }) => {
  db.tables.garden_os_state[0].value.day = 0;
  config.response = () => Response.json({}, { status: 429 });
  await run("2026-11-08T14:00:00Z");
  config.response = () => Response.json({ id: "sunday-retry" });
  assert.equal((await run(monday)).sent, 1);
  assert.equal(db.tables[ledgers][0].week_start, "2026-11-02");
  assert.equal(requests.every(r => r.key.includes("2026-11-02")), true);
}));
test("subscription scan paginates past 200 records", async () => fixture(async ({ db, requests, run }) => {
  db.tables.garden_os_state = Array.from({ length: 205 }, (_, i) => {
    const user = String(i).padStart(36, "0");
    return { user_id: user, key: emailPreferenceKey(user), value: { ...pref, enabled: i === 204 } };
  });
  assert.equal((await run()).sent, 1);
  assert.equal(requests.length, 1);
}));
test("dispatch route reports email failure as 503 and retains email results when phone setup fails", async () => fixture(async ({ db, mod }) => {
  let email = { ready: true, runId: "run", sent: 0, failed: 1, skipped: 0, reviewRequired: 0, deferred: 0, reasons: {} };
  let phoneReady = false;
  Object.assign(globalThis.__reliabilityTest, { dispatchWeeklyEmails: async () => email, emailDispatchHealthy: mod.emailDispatchHealthy, remindersReady: () => phoneReady, sendReminder: () => {}, setupError: () => Response.json({ error: "Phone setup required." }, { status: 503 }), groupReminders: () => [], weeklyDue: () => false });
  const route = await compile("app/api/reminders/dispatch/route.ts", {
    "@/lib/weekly-email-server": "dispatchWeeklyEmails,emailDispatchHealthy", "@/lib/reminders-server": "adminDatabase,remindersReady,sendReminder,setupError", "@/lib/reminder-groups": "groupReminders", "@/lib/weekly-brief-server": "generateWeeklyBrief,loadBriefContext", "@/lib/weekly-brief": "weeklyDue", "@/lib/growing-calendar": "localDay",
  });
  const req = () => new Request("https://garden.example/api/reminders/dispatch", { headers: { authorization: "Bearer fixture" } });
  assert.equal((await route.GET(new Request("https://garden.example"))).status, 401);
  const failed = await route.GET(req()); assert.equal(failed.status, 503); assert.equal((await failed.json()).ok, false);
  email = { ...email, failed: 0, sent: 1 };
  assert.equal((await route.GET(req())).status, 200);
  phoneReady = true;
  db.fail = (table, operation) => table === "garden_reminder_devices" && operation === "select";
  const phoneFailure = await route.GET(req());
  assert.equal(phoneFailure.status, 503);
  assert.equal(phoneFailure.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await phoneFailure.json(), { ok: false, email, phoneReady: false, error: "Phone setup required." });
}));
