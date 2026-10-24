import Image from "next/image";
import { getPortraitArt } from "@/lib/plant-art";
import type { VaultPlant } from "@/components/PlantVault";
const flowers: Record<string, string> = {
  dahlia: "dahlias",
  zinnia: "zinnias",
  cosmos: "cosmos",
  lisianthus: "lisianthus",
  snapdragon: "snapdragons",
  alyssum: "sweet-alyssum",
  sunflower: "",
  calendula: "calendula",
  yarrow: "yarrow",
};
/** Use illustrations only, never a saved photograph or a speculative cultivar image. */
export default function CalendarPlantArt({ plant }: { plant: VaultPlant }) {
  const art = getPortraitArt(plant.name, plant.variety);
  const flower = Object.entries(flowers).find(([name]) =>
    plant.name.toLowerCase().includes(name),
  )?.[1];
  if (art?.illustration)
    return (
      <div
        className="calendar-plant-art"
        role="img"
        aria-label={`Representative botanical illustration of ${plant.name}`}
      >
        <div
          style={{
            backgroundImage: `url("${art.src}")`,
            backgroundSize: art.standalone ? "contain" : "400% 400%",
            backgroundPosition: art.standalone
              ? "center"
              : `${(art.column * 100) / 3}% ${(art.row * 100) / 3}%`,
          }}
        />
      </div>
    );
  return flower ? (
    <Image
      className="calendar-plant-art"
      src={`/cut-flowers/${flower}.webp`}
      alt={`Botanical illustration of ${plant.name}`}
      width={100}
      height={100}
      sizes="85px"
    />
  ) : null;
}
