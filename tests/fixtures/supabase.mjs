import http from "node:http";
import { randomUUID } from "node:crypto";
const user = {
  id: "a0a0a0a0-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "garden@example.test",
  email_confirmed_at: new Date().toISOString(),
};
const token = [
  "eyJhbGciOiJIUzI1NiJ9",
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url"),
  "fixture",
].join(".");
let gardens = [
  {
    id: "garden-1",
    user_id: user.id,
    name: "Front Yard Garden",
    year: 2026,
    location: "Plainfield, IL",
    hardiness_zone: "5b",
    created_at: new Date().toISOString(),
  },
];
let spaces = [];
let syncedState = [];
let failNext = false;
function send(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  let body = "";
  for await (const c of req) body += c;
  let payload = {};
  try {
    payload = JSON.parse(body || "{}");
  } catch {}
  const u = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") return send(res, 204, null);
  if (u.pathname === "/control/fail") {
    failNext = true;
    return send(res, 200, {});
  }
  if (u.pathname === "/control/stale") {
    if (spaces[0])
      spaces[0].updated_at = new Date(Date.now() + 5000).toISOString();
    return send(res, 200, {});
  }
  if (u.pathname === "/control/state")
    return send(res, 200, { gardens, spaces, syncedState });
  if (u.pathname.startsWith("/auth/v1/token"))
    return send(res, 200, {
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "fixture-refresh",
      user,
    });
  if (u.pathname === "/auth/v1/user") return send(res, 200, user);
  if (u.pathname === "/auth/v1/signup")
    return send(res, 200, { user, session: null });
  if (u.pathname === "/auth/v1/logout") return send(res, 204, null);
  if(u.pathname==="/rest/v1/rpc/garden_os_save_state"){
    const current=syncedState.find(row=>row.key===payload.p_key && row.user_id===user.id);
    if((!current&&payload.p_version!==0)||(current&&current.version!==payload.p_version))return send(res,409,{code:"40001",message:"State changed on another device"});
    const record={user_id:user.id,key:payload.p_key,value:payload.p_value,version:(current?.version??0)+1,updated_at:new Date().toISOString()};
    syncedState=syncedState.filter(row=>row!==current);syncedState.push(record);return send(res,200,[record]);
  }
  const table = u.pathname.split("/").pop();
  if (!["gardens", "growing_spaces", "garden_os_state"].includes(table)) return send(res, 404, {});
  let list = table === "gardens" ? gardens : table === "garden_os_state" ? syncedState : spaces;
  const matches = (row) =>
    Array.from(u.searchParams.entries()).every(([key, value]) => {
      if (["select", "order", "limit"].includes(key)) return true;
      if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
      if (value.startsWith("in."))
        return value.slice(4, -1).split(",").includes(String(row[key]));
      return true;
    });
  if (req.method === "GET") return send(res, 200, list.filter(matches));
  if (failNext) {
    failNext = false;
    return send(res, 403, {
      code: "42501",
      message: "Fixture permission denied",
    });
  }
  if (req.method === "POST") {
    const items = (Array.isArray(payload) ? payload : [payload]).map((p) => ({
      id: randomUUID(),
      user_id: table === "gardens" ? user.id : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...p,
    }));
    if (req.headers.prefer?.includes("resolution=merge-duplicates")) {
      for (const item of items) {
        const existing = list.find(row => row.id === item.id);
        if (existing) Object.assign(existing, item);
        else list.push(item);
      }
    } else list.push(...items);
    return send(
      res,
      201,
      req.headers.accept?.includes("object+json") ? items[0] : items,
    );
  }
  if (req.method === "PATCH") {
    const edited = list.filter(matches);
    for (const row of edited)
      Object.assign(row, payload, { updated_at: new Date().toISOString() });
    return send(
      res,
      200,
      req.headers.accept?.includes("object+json")
        ? (edited[0] ?? null)
        : edited,
    );
  }
  return send(res, 405, {});
});
server.listen(54321, "127.0.0.1");
