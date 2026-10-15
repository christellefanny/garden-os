import { authenticated } from "@/lib/reminders-server";
import {
  generateWeeklyBrief,
  loadBriefContext,
} from "@/lib/weekly-brief-server";
export const maxDuration = 60;
export async function GET(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json(
      { error: "Sign in to read your weekly garden briefing." },
      { status: 401 },
    );
  const gardenId = new URL(request.url).searchParams.get("garden") || undefined;
  if (gardenId && gardenId.length > 100)
    return Response.json({ error: "Invalid garden." }, { status: 400 });
  try {
    return Response.json(
      await generateWeeklyBrief(
        await loadBriefContext(auth.db, auth.user.id, gardenId),
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message : "Could not prepare the briefing.",
      },
      { status: 503 },
    );
  }
}
