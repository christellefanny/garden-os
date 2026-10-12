import { NextResponse } from "next/server";
import { authenticated } from "@/lib/reminders-server";
export async function GET(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  const { data, error } = await auth.db
    .from("garden_os_state")
    .select("key,value,version")
    .eq("user_id", auth.user.id);
  if (error)
    return NextResponse.json(
      {
        error: "Cloud setup is not available. Local data remains safe.",
        setup: true,
      },
      { status: 503 },
    );
  return NextResponse.json({ records: data });
}
export async function PUT(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 1600000)
    return NextResponse.json(
      { error: "Backup is too large." },
      { status: 413 },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (
    typeof body.key !== "string" ||
    !body.key.startsWith("garden-os-") ||
    !body.key.includes(auth.user.id) ||
    body.key.length > 250 ||
    !Number.isInteger(body.version) ||
    body.version < 0 ||
    JSON.stringify(body.value ?? null).length > 1500000
  )
    return NextResponse.json({ error: "Invalid state." }, { status: 400 });
  const { data, error } = await auth.db.rpc("garden_os_save_state", {
    p_key: body.key,
    p_value: body.value,
    p_version: body.version,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === "40001" || error.code === "23505"
            ? "Changed on another device. Your local edit is preserved; review cloud conflicts in Settings."
            : "Could not sync. Your local edit is preserved.",
      },
      { status: error.code === "40001" || error.code === "23505" ? 409 : 503 },
    );
  return NextResponse.json({ record: data?.[0] });
}
