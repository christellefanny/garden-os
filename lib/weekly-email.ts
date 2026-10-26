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
  contactEmail = process.env.GARDEN_CONTACT_EMAIL || "",
) {
  const calendarUrl = `${origin}/?view=calendar&brief=weekly`;
  const preferencesUrl = `${origin}/?view=calendar`;
  const contact = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(
    contactEmail.trim(),
  )
    ? contactEmail.trim()
    : "";
  const planningNote =
    "This is a planning-calendar step, not a forecast or observed plant stage.";
  const why = (action: BriefAction) =>
    action.why.trim() === planningNote ? "" : action.why;
  const month = Number(brief.start.slice(5, 7));
  const seasonalArt =
    month >= 3 && month <= 5
      ? "lettuce"
      : month >= 6 && month <= 8
        ? "tomato"
        : month >= 9 && month <= 11
          ? "garlic"
          : "kale";
  const dateRange = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(
    new Date(`${brief.start}T12:00:00Z`),
    new Date(`${brief.end}T12:00:00Z`),
  );
  const usedArt = new Set([seasonalArt]);
  const artRules: [RegExp, string][] = [
    [/\blettuce\b/i, "lettuce"],
    [/\btomato(?:es)?\b/i, "tomato"],
    [/\bgarlic\b/i, "garlic"],
    [/\bkale\b/i, "kale"],
    [/\bpeas?\b/i, "peas"],
    [/\bdahlias?\b/i, "dahlia"],
    [/\bzinnias?\b/i, "zinnia"],
    [/\bpeppers?\b/i, "pepper"],
  ];
  function actionArt(action: BriefAction) {
    if (usedArt.size >= 4) return "";
    for (const plant of action.plants) {
      for (const [pattern, name] of artRules) {
        if (!pattern.test(plant) || usedArt.has(name)) continue;
        if (
          name === "pepper" &&
          /habanero|hot|jalape|serrano|chili|cayenne|scotch/i.test(plant)
        )
          continue;
        usedArt.add(name);
        return name;
      }
    }
    return "";
  }
  const sections: [string, BriefAction[]][] = [
    ["Your garden priorities", brief.priorities],
    ["A little preparation", brief.prepare.slice(0, 3)],
    ["Your saved reminders", brief.savedTasks.slice(0, 5)],
  ];
  const text = [
    `Garden Atelier · ${dateRange}`,
    `${brief.garden} · ${brief.location}`,
    brief.summary,
    ...sections.flatMap(([title, items]) =>
      items.length
        ? [
            title,
            ...items.map((a) =>
              [
                a.title + " · " + a.when,
                why(a),
                a.plants.join(", "),
                ...a.steps,
              ]
                .filter(Boolean)
                .join("\n"),
            ),
          ]
        : [],
    ),
    ...brief.limitations,
    `Open your calendar: ${calendarUrl}`,
    "Happy growing,\nGarden Atelier\nPlan · Grow · Record · Be Inspired",
    contact ? `Contact us: ${contact}` : "",
    `Visit Garden Atelier: ${origin}`,
    "You’re receiving this because you subscribed to weekly Garden Atelier emails.",
    `Manage email preferences: ${preferencesUrl}`,
    `Unsubscribe: ${unsubscribe}`,
    `© ${brief.start.slice(0, 4)} Garden Atelier`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Your garden this week · Garden Atelier</title></head>
<body style="margin:0;background:#f8f4eb;color:#344a37;font:16px/1.6 Georgia,serif">
<div style="max-width:600px;margin:auto;padding:30px 24px;word-break:break-word">
  <p style="margin:0 0 24px;text-align:center"><a href="${escape(origin)}"><img src="${escape(origin)}/garden-atelier-logo.png" width="192" height="99" alt="Garden Atelier" style="display:block;width:192px;height:99px;margin:auto;border:0"></a></p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:1px solid #ded7c7;border-bottom:1px solid #ded7c7;margin-bottom:22px"><tr>
    <td valign="middle" style="padding:22px 12px 22px 0"><p style="margin:0 0 10px;font:11px/1.6 Arial,sans-serif;letter-spacing:1.5px;color:#65705d">YOUR WEEK IN THE GARDEN</p><h1 style="margin:0;font:30px/1.25 Georgia,serif;font-weight:400">A little care for the week ahead</h1></td>
    <td valign="middle" align="right" width="30%" style="padding:14px 0"><img src="${escape(origin)}/email/${seasonalArt}.jpg" width="120" alt="Seasonal botanical illustration of ${seasonalArt}" style="display:block;width:100%;max-width:120px;height:auto;border:0;border-radius:10px"></td>
  </tr></table>
  <p style="font:13px/1.6 Arial,sans-serif;color:#65705d">${escape(brief.garden)} · ${escape(dateRange)}</p>
  <p>${escape(brief.summary)}</p>
  ${sections
    .map(([title, items]) =>
      items.length
        ? `<h2 style="font-weight:400">${title}</h2>${items
            .map((a) => {
              const art = actionArt(a);
              return `<div style="background:#fffdf8;padding:18px;margin:12px 0;border-radius:10px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td valign="top">
      <h3 style="margin:0;font:20px/1.35 Georgia,serif">${escape(a.title)}</h3>
      <p style="font:13px/1.5 Arial,sans-serif">${escape(a.when)}${a.plants.length ? " · " + escape(a.plants.join(", ")) : ""}</p>
    </td>${art ? `<td width="84" align="right" valign="top"><img src="${escape(origin)}/email/${art}.jpg" width="72" height="72" alt="Botanical illustration of ${art}" style="display:block;width:72px;height:72px;border:0;border-radius:8px"></td>` : ""}</tr></table>
    ${why(a) ? `<p>${escape(why(a))}</p>` : ""}
    <ul style="padding-left:22px">${a.steps.map((step) => `<li>${escape(step)}</li>`).join("")}</ul>
  </div>`;
            })
            .join("")}`
        : "",
    )
    .join("")}
  <p style="margin:28px 0"><a href="${escape(calendarUrl)}" style="display:inline-block;background:#825069;color:#fff;padding:12px 20px;border-radius:7px;text-decoration:none">Open my growing calendar</a></p>
  ${brief.limitations.map((l) => `<p style="font:13px/1.5 Arial,sans-serif">${escape(l)}</p>`).join("")}
  <div style="margin:32px 0 24px;padding-top:24px;border-top:1px solid #e1d9ca">
    <p style="margin:0 0 6px;font-style:italic">Happy growing,</p>
    <p style="margin:0;color:#344a37;font:30px/1.25 Georgia,serif">Garden Atelier</p>
    <p style="margin:8px 0 18px;color:#65705d;font:12px/1.6 Arial,sans-serif;letter-spacing:.6px">Plan · Grow · Record · Be Inspired</p>
    <p style="margin:0;font:13px/1.8 Arial,sans-serif">${contact ? `<a href="mailto:${escape(contact)}" style="color:#825069;text-decoration:underline">${escape(contact)}</a><br>` : ""}<a href="${escape(origin)}" style="color:#825069;text-decoration:underline">Visit Garden Atelier</a></p>
  </div>
  <div style="border-top:1px solid #e1d9ca;padding-top:18px;color:#65705d;font:12px/1.7 Arial,sans-serif">
    <p style="margin:0 0 12px">You’re receiving this because you subscribed to weekly Garden Atelier emails.</p>
    <p style="margin:0 0 12px"><a href="${escape(preferencesUrl)}" style="color:#825069">Manage email preferences</a> &nbsp;·&nbsp; <a href="${escape(unsubscribe)}" style="color:#825069">Unsubscribe</a></p>
    <p style="margin:0">© ${escape(brief.start.slice(0, 4))} Garden Atelier</p>
  </div>
</div></body></html>`;
  return {
    subject: `Your garden this week · ${brief.start}`,
    html,
    text,
    ...(contact ? { reply_to: contact } : {}),
  };
}
