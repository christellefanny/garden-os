import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { isMonitoringOwner, readEmailReport, readTrafficReport } from "../lib/owner-monitoring.ts";

test("owner gate rejects missing configuration, unconfirmed accounts and other users", () => {
  const owner = { email: "owner@example.com", email_confirmed_at: "2026-01-01" };
  assert.equal(isMonitoringOwner(owner, undefined), false);
  assert.equal(isMonitoringOwner(null, owner.email), false);
  assert.equal(isMonitoringOwner({ email: owner.email }, owner.email), false);
  assert.equal(isMonitoringOwner(owner, "other@example.com"), false);
  assert.equal(isMonitoringOwner(owner, "OWNER@example.com"), true);
});

test("provider errors never become zero totals or expose provider response bodies", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("private provider detail", { status: 403 });
    const emails = await readEmailReport("test-key");
    assert.equal(emails.available, false);
    assert.match(emails.message, /read access/);
    assert.ok(!JSON.stringify(emails).includes("private provider detail"));
    const traffic = await readTrafficReport("test-key");
    assert.equal(traffic.available, false);
    assert.equal(traffic.visitors, undefined);
    assert.equal((await readTrafficReport(undefined)).available, false);
  } finally { globalThis.fetch = original; }
});

test("email report filters unrelated senders and retains provider delivery status", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ has_more: true, data: [
      { id: "1", from: "Sage from Garden Atelier <sage@mygardenatelier.com>", to: ["user@example.com"], last_event: "delivered" },
      { id: "2", from: "Other <other@example.com>", last_event: "sent" },
      { id: "3", from: "Garden Atelier <onboarding@resend.dev>", last_event: "bounced" },
      { id: "4", from: "bad@mygardenatelier.com.attacker.example", last_event: "sent" },
    ] });
    const report = await readEmailReport("test-key");
    assert.equal(report.available, true);
    assert.deepEqual(report.records.map(r => [r.id, r.status]), [["1", "delivered"], ["3", "bounced"]]);
    assert.equal(report.hasMore, true);
  } finally { globalThis.fetch = original; }
});

test("traffic uses seven UTC dates including current day and preserves real zeroes", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      const params = new URL(url).searchParams;
      assert.equal(params.get("since"), "2026-10-28T00:00:00.000Z");
      assert.equal(params.get("until"), "2026-11-04T00:00:00.000Z");
      return Response.json({ data: { visitors: 0, pageviews: 0 } });
    };
    const result = await readTrafficReport("test-key", new Date("2026-11-03T12:00:00Z"));
    assert.equal(result.available, true);
    assert.equal(result.visitors, 0);
  } finally { globalThis.fetch = original; }
});

test("monitoring API blocks unauthorized reads before any database or provider access", async () => {
  const source = await readFile(new URL("../app/api/owner/monitoring/route.ts", import.meta.url), "utf8");
  let current = null;
  let reads = 0;
  const unavailable = () => { reads++; throw new Error("Should not be accessed"); };
  globalThis.__ownerTest = { authenticated: async () => current, adminDatabase: unavailable, isMonitoringOwner, readEmailReport: unavailable, readTrafficReport: unavailable };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
    .replace(/import\s*\{([^}]+)\}\s*from\s*"[^"]+";/g, (_, names) => `const {${names}} = globalThis.__ownerTest;`);
  const { GET } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
  const saved = process.env.GARDEN_OWNER_EMAIL;
  process.env.GARDEN_OWNER_EMAIL = "owner@example.com";
  try {
    assert.equal((await GET(new Request("https://example.com"))).status, 401);
    current = { user: { email: "other@example.com", email_confirmed_at: "2026-01-01" } };
    const denied = await GET(new Request("https://example.com"));
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get("Cache-Control"), "private, no-store");
    assert.equal(reads, 0);
  } finally {
    if (saved === undefined) delete process.env.GARDEN_OWNER_EMAIL; else process.env.GARDEN_OWNER_EMAIL = saved;
    delete globalThis.__ownerTest;
  }
});
