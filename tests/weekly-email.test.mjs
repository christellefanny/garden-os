import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import {
  emailPreferenceKey,
  validEmailPreferences,
  unsubscribeToken,
  readUnsubscribeToken,
  renderWeeklyEmail,
} from "../lib/weekly-email.ts";
import { weekBounds } from "../lib/weekly-brief.ts";
const owner = "a0a0a0a0-0000-4000-8000-000000000001",
  nonce = "b0b0b0b0-0000-4000-8000-000000000001";
const preference = { enabled: true, day: 1, gardenId: "g1", nonce };
const brief = {
  start: "2026-10-19",
  end: "2026-10-25",
  garden: "<script>alert(1)</script>",
  location: "Plainfield, IL",
  summary: "Check soil before watering.",
  priorities: [
    {
      title: "Check lettuce",
      when: "This week",
      why: "Growing indoors",
      plants: ["Lettuce"],
      steps: ["Check moisture"],
      sources: [],
    },
  ],
  prepare: [],
  savedTasks: [],
  limitations: ["Check actual conditions."],
};
async function compile(file, mapping) {
  const source = await readFile(new URL("../" + file, import.meta.url), "utf8");
  const code = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(/import[\s\S]*?from "([^"]+)";/g, (line, name) =>
      mapping[name] ? `const {${mapping[name]}}=globalThis.__emailTest;` : line,
    );
  return import(
    "data:text/javascript;base64," +
      Buffer.from(code + "\n//" + Math.random()).toString("base64")
  );
}
test("unsubscribe tokens reject tampering, malformed tokens, wrong secrets and changed subscriptions", () => {
  const token = unsubscribeToken(owner, nonce, "secret");
  assert.deepEqual(readUnsubscribeToken(token, "secret"), {
    userId: owner,
    nonce,
  });
  assert.equal(readUnsubscribeToken(token, "wrong"), null);
  assert.equal(readUnsubscribeToken(token + "x", "secret"), null);
  assert.equal(readUnsubscribeToken("", "secret"), null);
  assert.equal(readUnsubscribeToken("test." + "é".repeat(43), "secret"), null);
  assert.notEqual(readUnsubscribeToken(token, "secret").nonce, "new-nonce");
  assert.ok(validEmailPreferences(preference));
  assert.ok(!validEmailPreferences({ ...preference, day: 7 }));
});
test("email escapes user content and includes actual priorities, calendar and unsubscribe", () => {
  const mail = renderWeeklyEmail(
    brief,
    "https://garden.example",
    "https://garden.example/unsubscribe?t=x",
  );
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.ok(mail.html.includes("Check lettuce"));
  assert.ok(mail.html.includes("Check moisture"));
  assert.ok(mail.text.includes("Unsubscribe:"));
  assert.ok(mail.html.includes("view=calendar"));
});
function database() {
  const records = [
    {
      user_id: owner,
      key: emailPreferenceKey(owner),
      value: structuredClone(preference),
      version: 1,
    },
  ];
  return {
    records,
    auth: {
      admin: {
        getUserById: async (id) => ({
          data: {
            user: {
              id,
              email: "owner@example.test",
              email_confirmed_at: "2026-01-01",
            },
          },
        }),
      },
    },
    from() {
      let operation = "select",
        body,
        filters = [],
        isLike = false;
      const q = {
        select() {
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        like() {
          isLike = true;
          return q;
        },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return q;
        },
        insert(v) {
          operation = "insert";
          body = v;
          return q;
        },
        update(v) {
          operation = "update";
          body = v;
          return q;
        },
        delete() {
          operation = "delete";
          return q;
        },
        maybeSingle() {
          return q.then((r) => ({ ...r, data: r.data?.[0] || null }));
        },
        then(resolve) {
          let matched = records.filter(
            (r) =>
              filters.every((f) => f(r)) &&
              (!isLike || r.key.startsWith("garden-os-weekly-email-")),
          );
          if (operation === "insert") {
            if (
              records.some(
                (r) => r.user_id === body.user_id && r.key === body.key,
              )
            )
              return Promise.resolve({ error: { code: "23505" } }).then(
                resolve,
              );
            records.push({ ...body, version: 1 });
            matched = [body];
          }
          if (operation === "update")
            matched.forEach((r) => Object.assign(r, body));
          if (operation === "delete")
            for (const r of matched) records.splice(records.indexOf(r), 1);
          return Promise.resolve({
            data: structuredClone(matched),
            error: null,
          }).then(resolve);
        },
      };
      return q;
    },
  };
}
test("email dispatch uses Auth email, explicit consent, weekly claims and provider rejection handling", async () => {
  const db = database(),
    sends = [];
  let reject = false,
    timeout = false;
  globalThis.__emailTest = {
    adminDatabase: () => db,
    loadBriefContext: async () => ({}),
    generateWeeklyBrief: async () => brief,
    emailPreferenceKey,
    validEmailPreferences,
    unsubscribeToken,
    renderWeeklyEmail,
    localDay: () => "2026-10-19",
    weekBounds,
  };
  const emailDispatch = await compile("lib/weekly-email-server.ts", {
    "./reminders-server": "adminDatabase",
    "./weekly-brief-server": "loadBriefContext,generateWeeklyBrief",
    "./weekly-email":
      "emailPreferenceKey,renderWeeklyEmail,unsubscribeToken,validEmailPreferences",
    "./growing-calendar": "localDay",
    "./weekly-brief": "weekBounds",
  });
  const originalFetch = globalThis.fetch,
    old = { ...process.env };
  Object.assign(process.env, {
    RESEND_API_KEY: "fixture",
    GARDEN_EMAIL_FROM: "Garden <test@example.test>",
    SUPABASE_SERVICE_ROLE_KEY: "fixture",
    CRON_SECRET: "fixture",
    VERCEL_ENV: "production",
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    sends.push(JSON.parse(options.body));
    if (timeout) throw new Error("unknown outcome");
    return reject
      ? Response.json({ error: "rate limit" }, { status: 429 })
      : Response.json({ id: "fixture-receipt" });
  };
  try {
    const results = await Promise.all([
      emailDispatch.dispatchWeeklyEmails(),
      emailDispatch.dispatchWeeklyEmails(),
    ]);
    assert.equal(
      results.reduce((n, r) => n + r.sent, 0),
      1,
    );
    assert.equal(sends.length, 1);
    assert.deepEqual(sends[0].to, ["owner@example.test"]);
    assert.ok(sends[0].headers["List-Unsubscribe"]);
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).sent, 0);
    db.records.splice(1);
    reject = true;
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).failed, 1);
    assert.equal(db.records.length, 1);
    reject = false;
    timeout = true;
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).failed, 1);
    assert.equal(db.records.length, 2);
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).sent, 0);
    db.records.splice(1);
    db.records[0].value.enabled = false;
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).sent, 0);
    db.records[0].value.enabled = true;
    process.env.VERCEL_ENV = "preview";
    assert.equal((await emailDispatch.dispatchWeeklyEmails()).sent, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env))
      if (!(key in old)) delete process.env[key];
    Object.assign(process.env, old);
    delete globalThis.__emailTest;
  }
});
test("email settings require authentication, prevent other-garden subscriptions and report absent provider", async () => {
  let authenticated = false,
    ready = false,
    owned = false,
    saves = [];
  const db = {
    from() {
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        maybeSingle: async () => ({
          data: owned ? { id: "g1" } : null,
          error: null,
        }),
      };
      return q;
    },
    rpc: async (...args) => {
      saves.push(args);
      return { data: [{ version: 2 }], error: null };
    },
  };
  globalThis.__emailTest = {
    authenticated: async () =>
      authenticated
        ? {
            db,
            user: {
              id: owner,
              email: "owner@example.test",
              email_confirmed_at: "confirmed",
            },
          }
        : null,
    emailReady: () => ready,
    emailPreferenceKey,
    validEmailPreferences,
  };
  const route = await compile("app/api/weekly-email/route.ts", {
    "@/lib/reminders-server": "authenticated",
    "@/lib/weekly-email-server": "emailReady",
    "@/lib/weekly-email": "emailPreferenceKey,validEmailPreferences",
  });
  const request = (values = {}) =>
    new Request("http://fixture/api/weekly-email", {
      method: "POST",
      body: JSON.stringify({
        enabled: true,
        day: 1,
        gardenId: "someone-elses",
        version: 0,
        ...values,
      }),
    });
  try {
    assert.equal((await route.POST(request())).status, 401);
    authenticated = true;
    assert.equal((await route.POST(request())).status, 503);
    ready = true;
    assert.equal((await route.POST(request())).status, 400);
    assert.equal(saves.length, 0);
    owned = true;
    assert.equal(
      (
        await route.POST(
          request({ gardenId: "g1", to: "attacker@example.test" }),
        )
      ).status,
      200,
    );
    assert.ok(!JSON.stringify(saves).includes("attacker"));
    assert.equal((await route.POST(request({ day: 9 }))).status, 400);
  } finally {
    delete globalThis.__emailTest;
  }
});
test("unsubscribe confirmation is read-only and POST changes only the matching consent version", async () => {
  const db = database();
  const token = unsubscribeToken(owner, nonce, "fixture");
  globalThis.__emailTest = {
    adminDatabase: () => db,
    emailSecret: () => "fixture",
    emailPreferenceKey,
    readUnsubscribeToken,
  };
  const route = await compile("app/api/weekly-email/unsubscribe/route.ts", {
    "@/lib/reminders-server": "adminDatabase",
    "@/lib/weekly-email-server": "emailSecret",
    "@/lib/weekly-email": "emailPreferenceKey,readUnsubscribeToken",
  });
  const old = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture";
  try {
    const url = "https://fixture/api/weekly-email/unsubscribe?token=" + token;
    assert.equal((await route.GET(new Request(url))).status, 200);
    assert.equal(db.records[0].value.enabled, true);
    assert.equal(
      (await route.POST(new Request(url, { method: "POST" }))).status,
      200,
    );
    assert.equal(db.records[0].value.enabled, false);
    assert.equal(db.records[0].version, 2);
    db.records[0].value = {
      ...preference,
      nonce: "c0c0c0c0-0000-4000-8000-000000000001",
    };
    assert.equal(
      (await route.POST(new Request(url, { method: "POST" }))).status,
      409,
    );
    assert.equal(db.records[0].value.enabled, true);
    assert.equal(
      (await route.POST(new Request(url + "tampered", { method: "POST" })))
        .status,
      400,
    );
  } finally {
    if (old === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = old;
    delete globalThis.__emailTest;
  }
});
