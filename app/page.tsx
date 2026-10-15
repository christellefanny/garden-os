import GardenApp from "@/components/GardenApp";
import SeasonProvider from "@/components/seasonal/SeasonProvider";
import { getSeason } from "@/lib/seasons";

export default function Home() {
  return (
    <SeasonProvider initialSeason={getSeason(new Date())}>
      <GardenApp />
    </SeasonProvider>
  );
}
