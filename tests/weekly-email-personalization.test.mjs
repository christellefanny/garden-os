import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import * as email from "../lib/weekly-email.ts";

const owner = "a0a0a0a0-0000-4000-8000-000000000001";
const legacy = { enabled: true, day: 1, gardenId: "garden-1", nonce: "b0b0b0b0-0000-4000-8000-000000000001" };
const brief = {
  start: "2026-11-02", end: "2026-11-08", garden: "Kitchen garden", location: "Plainfield, IL",
  summary: "Check soil before watering.", priorities: [], prepare: [], savedTasks: [], limitations: [],
};

test("first names accept international and multi-word names, but reject invalid values", () => {
  for (const name of ["Élodie", "李", "Jean-Luc", "D’Arcy", "Mary Jane", "A".repeat(80)]) {
    assert.equal(email.validFirstName(name), true, name);
    assert.equal(email.validEmailPreferences({ ...legacy, firstName: name }), true);
  }
  for (const name of ["", "  ", "A".repeat(81), "Ada\nB", "Ada\u0000", "Ada\u2028B", 12, null, {}]) {
    assert.equal(email.validFirstName(name), false, String(name));
    assert.equal(email.validEmailPreferences({ ...legacy, firstName: name }), false);
  }
  assert.equal(email.validEmailPreferences(legacy), true, "No backfill is required for existing subscribers");
});

test("HTML and text emails open with the saved name and safely fall back for legacy subscribers", () => {
  const render = name => email.renderWeeklyEmail(brief, "https://garden.example", "https://garden.example/unsubscribe", "contact@garden.example", name);
  const personalized = render("  Élodie  ");
  assert.ok(personalized.text.startsWith("Hello Élodie,\n\n"));
  assert.match(personalized.html, />Hello Élodie,<\/p>/);
  assert.ok(personalized.html.indexOf("Hello Élodie,") < personalized.html.indexOf("YOUR WEEK IN THE GARDEN"));
  assert.equal(personalized.reply_to, "contact@garden.example", "Existing contact argument stays compatible");
  for (const name of [undefined, "", "  ", "A".repeat(81), "Ada\nB"]) {
    assert.ok(render(name).text.startsWith("Hello there,\n\n"));
    assert.match(render(name).html, />Hello there,<\/p>/);
  }
  const escaped = render("<img src=x onerror=alert(1)> & O'Neil");
  assert.ok(!escaped.html.includes("<img src=x"));
  assert.match(escaped.html, /Hello &lt;img src=x onerror=alert\(1\)&gt; &amp; O&#39;Neil,/);
  assert.match(escaped.text, /^Hello <img src=x onerror=alert\(1\)> & O'Neil,/);
});

async function compile(file, dependencies) {
  const source = await readFile(new URL("../" + file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/import[\s\S]*?from "([^"]+)";/g, (line, name) =>
    dependencies[name] ? `const {${dependencies[name]}} = globalThis.__personalizedEmailTest;` : line);
  return import("data:text/javascript;base64," + Buffer.from(code + "\n//" + Math.random()).toString("base64"));
}

test("subscription API reads legacy preferences without writes and validates, saves and returns a first name", async () => {
  let record = { value: { ...legacy }, version: 1 };
  let signedIn = true;
  const saves = [];
  const db = {
    from(table) {
      const q = {
        select() { return q; }, eq() { return q; },
        async maybeSingle() { return { data: table === "gardens" ? { id: "garden-1" } : record, error: null }; },
      };
      return q;
    },
    async rpc(name, args) {
      assert.equal(name, "garden_os_save_state");
      assert.equal(args.p_key, email.emailPreferenceKey(owner));
      if (args.p_version !== (record?.version || 0)) return { data: null, error: { code: "40001" } };
      saves.push(args);
      record = { value: args.p_value, version: (record?.version || 0) + 1 };
      return { data: [{ version: record.version }], error: null };
    },
  };
  globalThis.__personalizedEmailTest = {
    ...email, emailReady: () => true,
    authenticated: async () => signedIn ? { db, user: { id: owner, email: "owner@example.test", email_confirmed_at: "confirmed" } } : null,
  };
  const route = await compile("app/api/weekly-email/route.ts", {
    "@/lib/reminders-server": "authenticated", "@/lib/weekly-email-server": "emailReady",
    "@/lib/weekly-email": "emailPreferenceKey,validEmailPreferences,validDeliveryEmail,validFirstName",
  });
  const request = values => new Request("http://fixture/api/weekly-email", {
    method: "POST", body: JSON.stringify({ enabled: true, day: 1, gardenId: "garden-1", email: "owner@example.test", version: record?.version || 0, ...values }),
  });
  try {
    const old = structuredClone(record);
    const loaded = await route.GET(new Request("http://fixture/api/weekly-email"));
    assert.equal(loaded.status, 200);
    assert.equal((await loaded.json()).preferences.firstName, "");
    assert.deepEqual(record, old);
    assert.equal(saves.length, 0);
    for (const name of [undefined, "", "   ", null, 42, "A".repeat(81), "Ada\nB"]) {
      assert.equal((await route.POST(request({ firstName: name }))).status, 400);
    }
    assert.equal(saves.length, 0, "Invalid names must not mutate the saved subscription");
    const disabled = await route.POST(request({ enabled: false }));
    assert.equal(disabled.status, 200, "Nameless existing subscribers can still opt out");
    assert.equal(record.value.enabled, false);
    assert.equal(record.value.firstName, undefined);
    const saved = await route.POST(request({ firstName: "  Élodie  " }));
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).preferences.firstName, "Élodie");
    assert.equal(record.value.firstName, "Élodie");
    assert.equal(record.value.email, "owner@example.test");
    assert.equal(record.value.day, legacy.day);
    assert.equal(email.validEmailPreferences(record.value), true);
    const reread = await route.GET(new Request("http://fixture/api/weekly-email"));
    assert.equal((await reread.json()).preferences.firstName, "Élodie");
    const version = record.version;
    assert.equal((await route.POST(request({ firstName: "Other", version: version - 1 }))).status, 409);
    assert.equal(record.value.firstName, "Élodie", "Stale saves cannot replace the name");
    signedIn = false;
    assert.equal((await route.GET(new Request("http://fixture/api/weekly-email"))).status, 401);
    assert.equal((await route.POST(request({ firstName: "Other" }))).status, 401);
  } finally {
    delete globalThis.__personalizedEmailTest;
  }
});

test("preview uses the saved first name, not request-supplied recipient details", async () => {
  let subscription = { ...legacy, firstName: "Élodie", email: "garden-inbox@example.test" };
  const sends = [];
  const db = {
    from() {
      let key;
      const q = { select() { return q; }, eq(field, value) { if (field === "key") key = value; return q; },
        async maybeSingle() { return { data: key === email.emailPreferenceKey(owner) ? { value: subscription } : null, error: null }; } };
      return q;
    },
    async rpc() { return { data: [{ version: 1 }], error: null }; },
  };
  globalThis.__personalizedEmailTest = {
    ...email, authenticated: async () => ({ db, user: { id: owner, email: "owner@example.test", email_confirmed_at: "confirmed" } }),
    emailReady: () => true, emailOrigin: () => "https://garden.example", emailSecret: () => "fixture",
    loadBriefContext: async () => ({}), generateWeeklyBrief: async () => brief,
  };
  const route = await compile("app/api/weekly-email/test/route.ts", {
    "@/lib/reminders-server": "authenticated", "@/lib/weekly-email-server": "emailReady,emailOrigin,emailSecret",
    "@/lib/weekly-email": "emailPreferenceKey,validEmailPreferences,renderWeeklyEmail,unsubscribeToken",
    "@/lib/weekly-brief-server": "loadBriefContext,generateWeeklyBrief",
  });
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    sends.push(JSON.parse(options.body));
    return Response.json({ id: "fixture-receipt" });
  };
  try {
    const request = () => new Request("http://fixture/api/weekly-email/test", { method: "POST", body: JSON.stringify({ firstName: "Wrong", to: "wrong@example.test" }) });
    assert.equal((await route.POST(request())).status, 200);
    assert.ok(sends[0].text.startsWith("Hello Élodie,"));
    assert.match(sends[0].html, />Hello Élodie,<\/p>/);
    assert.deepEqual(sends[0].to, ["garden-inbox@example.test"]);
    subscription = { ...legacy };
    assert.equal((await route.POST(request())).status, 200);
    assert.ok(sends[1].text.startsWith("Hello there,"));
    assert.deepEqual(sends[1].to, ["owner@example.test"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = originalEnv;
    delete globalThis.__personalizedEmailTest;
  }
});
