import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import GardenHeader from "@/components/GardenHeader";
import NewGardenModal from "@/components/NewGardenModal";
import GardenWorkspace from "@/components/GardenWorkspace";
import SeasonProvider from "@/components/seasonal/SeasonProvider";
import { SeasonalHero, SeasonalGuidanceHeading, SeasonalShortcuts } from "@/components/seasonal/SeasonalDashboard";
import { getSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: gardens, error } = await supabase.from("gardens").select("*").order("created_at", { ascending: false });
  const garden = gardens?.[0];
  const year = garden?.year ?? new Date().getFullYear();
  if (error) console.error("Error loading gardens:", error.message, error.code, error.details, error.hint);

  return (
    <SeasonProvider initialSeason={getSeason(new Date())}>
      <main className="seasonal-page min-h-screen text-[var(--foreground)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <GardenHeader gardenYear={year} />
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <SeasonalHero gardenName={garden?.name ?? "Backyard Garden"} gardenYear={year} spaces={4} />
            <Card className="seasonal-sage border p-7">
              <div className="flex items-center gap-3"><span className="text-3xl">🌿</span><div><p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Sage</p><SeasonalGuidanceHeading /></div></div>
              <p className="mt-5 leading-7 text-[var(--foreground)]/80">Your strawberry planter is nearing its recommended capacity. Avoid adding more plants unless you increase the container size.</p>
              <details className="mt-5"><summary className="seasonal-link cursor-pointer font-bold">Why?</summary><p className="seasonal-muted mt-3 text-sm leading-6">Crowded containers compete for water, nutrients, root space, and airflow. Keeping some room available helps plants stay healthier and makes watering easier to manage.</p></details>
            </Card>
          </section>
          <SeasonalShortcuts />
          <NewGardenModal />
          <GardenWorkspace />
        </div>
      </main>
    </SeasonProvider>
  );
}
