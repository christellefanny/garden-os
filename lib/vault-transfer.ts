import type { VaultPlant } from "../components/PlantVault";

export function readVaultBackup(text: string): VaultPlant[] {
  const value = JSON.parse(text);
  if (value?.garden_os_plant_vault !== 1 || !Array.isArray(value.plants) || value.plants.length > 10000)
    throw new Error("Choose a Garden OS Plant Vault backup file.");
  const ids = new Set<string>();
  for (const p of value.plants) {
    if (!p || ["id", "name", "variety", "category", "source", "year", "notes"].some(k => typeof p[k] !== "string") || !p.id.trim() || !p.name.trim() || ids.has(p.id) || !Array.isArray(p.statuses) || p.statuses.some((s: unknown) => typeof s !== "string") || (p.photoUrl !== undefined && typeof p.photoUrl !== "string"))
      throw new Error("This backup contains invalid plant records. Nothing was imported.");
    ids.add(p.id);
  }
  return value.plants.map((p: VaultPlant) => ({ id:p.id, name:p.name, variety:p.variety, category:p.category, statuses:[...p.statuses], source:p.source, year:p.year, notes:p.notes, photoUrl:p.photoUrl }));
}

const identity = (p: VaultPlant) => `${p.name.trim().toLowerCase()}\u0000${p.variety.trim().toLowerCase()}`;
export function mergeVaultPlants(current: VaultPlant[], incoming: VaultPlant[]) {
  const plants = current.map(p => ({...p, statuses:[...p.statuses]}));
  let added = 0;
  for (const p of incoming) {
    const existing = plants.find(x => identity(x) === identity(p));
    if (existing) {
      existing.statuses = [...new Set([...existing.statuses, ...p.statuses])];
      if (p.notes && !existing.notes.includes(p.notes)) existing.notes = [existing.notes,p.notes].filter(Boolean).join("\n\n");
      existing.source ||= p.source; existing.year ||= p.year; existing.photoUrl ||= p.photoUrl;
    } else {
      plants.push({...p, id:plants.some(x=>x.id===p.id) ? crypto.randomUUID() : p.id, statuses:[...p.statuses]});
      added++;
    }
  }
  return {plants, added};
}
