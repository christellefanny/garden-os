import type { SpaceDetails } from "./garden";
import type { VaultPlant } from "../components/PlantVault";
import { getPortraitArt } from "./plant-art.ts";
export function validPhotoUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
export function spacePortraitCandidates(
  details: SpaceDetails,
  vault: VaultPlant[],
) {
  const current = details.plants.filter((p) => p.status !== "Finished");
  const plants = current.length ? current : details.plants;
  return plants
    .map((p) => {
      const record =
        vault.find((v) => v.id === p.vaultPlantId) ||
        vault.find(
          (v) =>
            v.name.trim().toLowerCase() === p.name.trim().toLowerCase() &&
            v.variety.trim().toLowerCase() === p.variety.trim().toLowerCase(),
        );
      const name = record?.name || p.name,
        variety = record?.variety || p.variety;
      return {
        id: p.id,
        name,
        variety,
        photoUrl: validPhotoUrl(record?.photoUrl) ? record.photoUrl : undefined,
        art: getPortraitArt(name, variety),
      };
    })
    .sort((a, b) => Number(!!b.photoUrl) - Number(!!a.photoUrl));
}
