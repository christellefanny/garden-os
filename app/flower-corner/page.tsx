import Link from "next/link";
import FlowerCorner from "@/components/FlowerCorner";
import SeasonProvider from "@/components/seasonal/SeasonProvider";
import { getSeason } from "@/lib/seasons";

export const metadata = { title: "Flower Corner · Garden Atelier", description: "Explore flowers and ornamental foliage, planting timelines, flower care, cut flowers, bouquets and seed saving. No account required." };
export default function FlowerCornerPage() {
  return <SeasonProvider initialSeason={getSeason(new Date())}><main className="seasonal-page corner-public-page"><header className="corner-public-header"><Link href="/">Garden Atelier</Link><span>Planting · Care · Inspiration</span></header><FlowerCorner/></main></SeasonProvider>;
}
