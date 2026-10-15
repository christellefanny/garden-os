import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { weeklyDue } from "../lib/weekly-brief.ts";
import { groupReminders } from "../lib/reminder-groups.ts";
const source = await readFile(
  new URL("../app/api/reminders/dispatch/route.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const mapping = {
  "@/lib/reminders-server":
    "adminDatabase, remindersReady, sendReminder, setupError",
  "@/lib/reminder-groups": "groupReminders",
  "@/lib/weekly-brief-server": "generateWeeklyBrief, loadBriefContext",
  "@/lib/weekly-brief": "weeklyDue",
  "@/lib/growing-calendar": "localDay",
};
const code = compiled.replace(
  /import[\s\S]*?from "([^"]+)";/g,
  (line, module) =>
    mapping[module]
      ? `const {${mapping[module]}}=globalThis.__weeklyDispatchTest;`
      : line,
);
async function runFixture({
  weekly = true,
  due = true,
  fail = false,
  brokenBrief = false,
} = {}) {
  const devices = [
    {
      id: "d1",
      user_id: "owner",
      subscription: { endpoint: "fixture" },
      tasks: due
        ? [{ id: "t", date: "2026-10-12", title: "Watering", plant: "Tomato" }]
        : [],
      last_sent_day: null,
    },
  ];
  const sends = [];
  let contexts = 0;
  const db = {
    from(table) {
      let update = null,
        deleted = false;
      const filters = {};
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
        in() {
          return q;
        },
        update(value) {
          update = value;
          return q;
        },
        delete() {
          deleted = true;
          return q;
        },
        eq(key, value) {
          filters[key] = value;
          return q;
        },
        or() {
          return q;
        },
        then(resolve) {
          if (table === "garden_os_state") {
            resolve({
              data: weekly
                ? [
                    {
                      user_id: "owner",
                      value: { weekly: { enabled: true, day: 1 } },
                    },
                  ]
                : [],
              error: null,
            });
            return;
          }
          const matched = devices.filter(
            (d) => !filters.id || d.id === filters.id,
          );
          if (deleted) {
            devices.splice(0, devices.length);
            resolve({ data: [], error: null });
            return;
          }
          if (update) {
            const eligible = matched.filter((d) =>
              update.last_sent_day === null
                ? d.last_sent_day === filters.last_sent_day
                : d.last_sent_day !== "2026-10-12",
            );
            for (const d of eligible) Object.assign(d, update);
            resolve({ data: eligible.map((d) => ({ id: d.id })), error: null });
            return;
          }
          resolve({ data: structuredClone(devices), error: null });
        },
      };
      return q;
    },
  };
  globalThis.__weeklyDispatchTest = {
    adminDatabase: () => db,
    remindersReady: () => true,
    setupError: () => Response.json({ error: "setup" }, { status: 503 }),
    localDay: () => "2026-10-12",
    weeklyDue,
    groupReminders,
    loadBriefContext: async () => {
      contexts++;
      if (brokenBrief) throw new Error("source unavailable");
      return { calendar: { weekly: { enabled: true, day: 1 } } };
    },
    generateWeeklyBrief: async () => ({
      priorities: [{ title: "Harvest usable tender crops" }],
    }),
    sendReminder: async (...args) => {
      sends.push(args);
      if (fail)
        throw Object.assign(new Error("push unavailable"), { statusCode: 500 });
    },
  };
  const routeModule = await import(
    "data:text/javascript;base64," +
      Buffer.from(code + `\n// fixture ${Math.random()}`).toString("base64")
  );
  const old = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "weekly-test-secret";
  try {
    return {
      devices,
      sends,
      contexts: () => contexts,
      request: () =>
        routeModule.GET(
          new Request("http://fixture/api/reminders/dispatch", {
            headers: { Authorization: "Bearer weekly-test-secret" },
          }),
        ),
      unauthorized: () =>
        routeModule.GET(new Request("http://fixture/api/reminders/dispatch")),
      restore: () => {
        if (old === undefined) delete process.env.CRON_SECRET;
        else process.env.CRON_SECRET = old;
        delete globalThis.__weeklyDispatchTest;
      },
    };
  } catch (e) {
    if (old === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = old;
    throw e;
  }
}
test("weekly and daily combine into one notification with briefing link, concurrent retry cannot duplicate", async () => {
  const f = await runFixture();
  try {
    assert.equal((await f.unauthorized()).status, 401);
    const [a, b] = await Promise.all([f.request(), f.request()]);
    const responses = await Promise.all([a.json(), b.json()]);
    assert.equal(
      responses.reduce((n, r) => n + r.sent, 0),
      1,
    );
    assert.equal(f.sends.length, 1);
    assert.equal(f.sends[0][1], "Your weekly garden priorities");
    assert.match(f.sends[0][2], /Harvest.*Watering/);
    assert.equal(f.sends[0][3].url, "/?view=calendar&brief=weekly");
  } finally {
    f.restore();
  }
});
test("weekly sends with no daily tasks, and disabled weekly preserves ordinary daily delivery", async () => {
  let f = await runFixture({ due: false });
  try {
    assert.equal((await (await f.request()).json()).weeklySent, 1);
  } finally {
    f.restore();
  }
  f = await runFixture({ weekly: false });
  try {
    assert.equal((await (await f.request()).json()).sent, 1);
    assert.equal(f.contexts(), 0);
    assert.equal(f.sends[0][3], undefined);
  } finally {
    f.restore();
  }
});
test("briefing failure does not break a daily reminder; failed push releases the claim", async () => {
  let f = await runFixture({ brokenBrief: true });
  try {
    const r = await (await f.request()).json();
    assert.equal(r.sent, 1);
    assert.equal(r.weeklyFailed, 1);
  } finally {
    f.restore();
  }
  f = await runFixture({ fail: true });
  try {
    const r = await (await f.request()).json();
    assert.equal(r.failed, 1);
    assert.equal(f.devices[0].last_sent_day, null);
  } finally {
    f.restore();
  }
});
