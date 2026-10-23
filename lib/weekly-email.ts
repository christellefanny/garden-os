import { createHmac, timingSafeEqual } from "node:crypto";
import type { WeeklyBrief, BriefAction } from "./weekly-brief";
export type EmailPreferences = {
  enabled: boolean;
  day: number;
  gardenId: string;
  nonce: string;
};
export function validEmailPreferences(
  value: unknown,
): value is EmailPreferences {
  if (!value || typeof value !== "object") return false;
  const p = value as EmailPreferences;
  return (
    typeof p.enabled === "boolean" &&
    Number.isInteger(p.day) &&
    p.day >= 0 &&
    p.day <= 6 &&
    typeof p.gardenId === "string" &&
    p.gardenId.length <= 100 &&
    typeof p.nonce === "string" &&
    /^[a-f0-9-]{36}$/.test(p.nonce)
  );
}
export function emailPreferenceKey(userId: string) {
  return `garden-os-weekly-email-${userId}`;
}
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function unsubscribeToken(
  userId: string,
  nonce: string,
  secret: string,
) {
  const payload = Buffer.from(JSON.stringify({ userId, nonce })).toString(
    "base64url",
  );
  return (
    payload +
    "." +
    createHmac("sha256", secret).update(payload).digest("base64url")
  );
}
export function readUnsubscribeToken(
  token: string,
  secret: string,
): { userId: string; nonce: string } | null {
  if (!secret || token.length > 1000) return null;
  const [payload, signature, extra] = token.split(".");
  if (
    !payload ||
    !signature ||
    extra ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  )
    return null;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString());
    return /^[a-f0-9-]{36}$/.test(p.userId) && /^[a-f0-9-]{36}$/.test(p.nonce)
      ? p
      : null;
  } catch {
    return null;
  }
}
export function renderWeeklyEmail(
  brief: WeeklyBrief,
  origin: string,
  unsubscribe: string,
) {
  const sections: [string, BriefAction[]][] = [
    ["Your garden priorities", brief.priorities],
    ["A little preparation", brief.prepare.slice(0, 3)],
    ["Your saved reminders", brief.savedTasks.slice(0, 5)],
  ];
  const text = [
    `Garden Atelier · ${brief.start}–${brief.end}`,
    `${brief.garden} · ${brief.location}`,
    brief.summary,
    ...sections.flatMap(([title, items]) =>
      items.length
        ? [
            title,
            ...items.map(
              (a) =>
                `${a.title} · ${a.when}\n${a.why}\n${a.plants.join(", ")}\n${a.steps.join("\n")}`,
            ),
          ]
        : [],
    ),
    ...brief.limitations,
    `Open your calendar: ${origin}/?view=calendar&brief=weekly`,
    `Unsubscribe: ${unsubscribe}`,
  ].join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f8f4eb;color:#344a37;font:16px/1.6 Georgia,serif"><div style="max-width:600px;margin:auto;padding:36px 24px"><p style="letter-spacing:2px;font:12px Arial,sans-serif">GARDEN ATELIER</p><h1 style="font-weight:400">A little care for the week ahead</h1><p>${escape(brief.garden)} · ${escape(brief.start)}–${escape(brief.end)}</p><p>${escape(brief.summary)}</p>${sections.map(([title, items]) => (items.length ? `<h2 style="font-weight:400">${title}</h2>${items.map((a) => `<div style="background:#fffdf8;padding:18px;margin:12px 0;border-radius:10px"><h3 style="margin:0;font-weight:400">${escape(a.title)}</h3><p style="font:13px Arial,sans-serif">${escape(a.when)}${a.plants.length ? " · " + escape(a.plants.join(", ")) : ""}</p><p>${escape(a.why)}</p><ul>${a.steps.map((s) => `<li>${escape(s)}</li>`).join("")}</ul></div>`).join("")}` : "")).join("")}<p><a href="${escape(origin)}/?view=calendar&amp;brief=weekly" style="display:inline-block;background:#825069;color:#fff;padding:12px 20px;border-radius:7px;text-decoration:none">Open my growing calendar</a></p>${brief.limitations.map((l) => `<p style="font:13px/1.5 Arial,sans-serif">${escape(l)}</p>`).join("")}<p style="font:12px/1.6 Arial,sans-serif">Based on your saved plants, planning dates, and available weather. Check local conditions before planting or watering.</p><p style="font:12px Arial,sans-serif"><a href="${escape(unsubscribe)}">Unsubscribe from weekly emails</a></p></div></body></html>`;
  return { subject: `Your garden this week · ${brief.start}`, html, text };
}
