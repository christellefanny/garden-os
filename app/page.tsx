import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import GardenHeader from "@/components/GardenHeader";
import NewGardenModal from "@/components/NewGardenModal";
import SeasonProvider from "@/components/seasonal/SeasonProvider";
import { SeasonalHero, SeasonalGuidanceHeading, SeasonalShortcuts } from "@/components/seasonal/SeasonalDashboard";
import { getSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

const growingSpaces = [
  { id: 1, name: "Tomato Bed", type: "Raised Bed", size: "6 × 3 × 1 ft", plants: 7, capacity: 78, icon: "🍅" },
  { id: 2, name: "Pepper Bed", type: "Raised Bed", size: "5 × 2.5 × 1 ft", plants: 0, capacity: 0, icon: "🌶️" },
  { id: 3, name: "Blueberry Pot", type: "Container", size: "20-inch pot", plants: 1, capacity: 65, icon: "🫐" },
  { id: 4, name: "Strawberry Planter", type: "Container", size: "20-inch planter", plants: 5, capacity: 82, icon: "🍓" },
];

export default async function Home() {
  const { data: gardens, error } = await supabase
    .from("gardens")
    .select("*")
    .order("created_at", { ascending: false });

  const garden = gardens?.[0];

  if (error) {
    console.error("Error loading gardens:", error.message, error.code, error.details, error.hint);
  }

  return (
    <SeasonProvider initialSeason={getSeason(new Date())}>
      <main className="seasonal-page min-h-screen text-[var(--foreground)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <GardenHeader gardenYear={garden?.year ?? new Date().getFullYear()} />

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <SeasonalHero gardenName={garden?.name ?? "Backyard Garden"} gardenYear={garden?.year ?? new Date().getFullYear()} spaces={growingSpaces.length} />

            <Card className="seasonal-sage border p-7">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌿</span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Sage</p>
                  <SeasonalGuidanceHeading />
                </div>
              </div>
              <p className="mt-5 leading-7 text-[var(--foreground)]/80">
                Your strawberry planter is nearing its recommended capacity. Avoid adding more plants unless you increase the container size.
              </p>
              <button className="seasonal-link mt-5 font-bold hover:underline">Why? →</button>
            </Card>
          </section>

          <SeasonalShortcuts />

          <NewGardenModal />

          <section className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">My garden</p>
                <h2 className="seasonal-heading mt-1 text-3xl font-black">Growing Spaces</h2>
              </div>
              <button className="seasonal-button rounded-xl px-5 py-3 font-bold text-white shadow-sm transition">+ Add Growing Space</button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {growingSpaces.map((space) => <GrowingSpaceCard key={space.id} space={space} />)}
            </div>
          </section>

          <section className="seasonal-card mt-10 rounded-3xl border p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Planning tool</p>
                <h2 className="seasonal-heading mt-1 text-2xl font-black">Not sure how many plants will fit?</h2>
                <p className="seasonal-muted mt-2">Open the Plant Planner to test bed sizes and plant quantities before adding them to your garden.</p>
              </div>
              <button className="seasonal-outline shrink-0 rounded-xl border-2 px-5 py-3 font-bold transition">Open Plant Planner</button>
            </div>
          </section>
        </div>
      </main>
    </SeasonProvider>
  );
}

type GrowingSpace = {
  id: number;
  name: string;
  type: string;
  size: string;
  plants: number;
  capacity: number;
  icon: string;
};

function GrowingSpaceCard({ space }: { space: GrowingSpace }) {
  const isWarning = space.capacity >= 80;

  return (
    <article className="seasonal-card rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="seasonal-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl">{space.icon}</span>
          <div>
            <p className="seasonal-muted text-sm font-semibold">{space.type}</p>
            <h3 className="seasonal-heading text-xl font-black">{space.name}</h3>
          </div>
        </div>
        {isWarning && <span className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-bold text-amber-950">Check capacity</span>}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Size</p><p className="mt-1 font-bold">{space.size}</p></div>
        <div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Plants</p><p className="mt-1 font-bold">{space.plants === 0 ? "Empty" : space.plants}</p></div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="seasonal-muted text-sm font-semibold">Capacity</p>
          <p className={`text-sm font-bold ${isWarning ? "text-[var(--warning-text)]" : "text-[var(--primary)]"}`}>{space.capacity}%</p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10">
          <div className={`h-full rounded-full ${isWarning ? "bg-[var(--highlight)]" : "seasonal-progress"}`} style={{ width: `${Math.min(space.capacity, 100)}%` }} />
        </div>
      </div>

      <button className="seasonal-link mt-6 font-bold hover:underline">Open Space →</button>
    </article>
  );
}
