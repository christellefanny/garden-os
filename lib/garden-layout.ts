import type {Space} from "./garden";
export type BedPlant = { id:string; name:string; variety:string; quantity:string; notes:string }; 
export type Bed = { plants?:BedPlant[]; spaceId?:string; spaceType?:string; id:string; name:string; emoji:string; x:number;y:number;w:number;h:number; color:string; notes:string };
export const initialLayout:Bed[]=[
{id:"flowers",name:"Flowers",emoji:"🌸",x:18,y:2,w:79,h:11,color:"#b74b79",notes:"Flower border along the back."},
{id:"herbs",name:"Herbs",emoji:"🌿",x:2,y:16,w:13,h:78,color:"#397c44",notes:"Long herb border on the left."},
{id:"garlic",name:"Garlic",emoji:"🧄",x:25,y:20,w:18,h:26,color:"#639c53",notes:"After harvesting garlic: broccoli seedlings, then lettuce."},
{id:"green-peppers",name:"Green Peppers",emoji:"🫑",x:48,y:20,w:18,h:26,color:"#348c3e",notes:"Green bell peppers."},
{id:"okra",name:"Okra",emoji:"🌱",x:75,y:20,w:21,h:26,color:"#4b8640",notes:"Warm-season okra."},
{id:"tomatoes-left",name:"Tomatoes",emoji:"🍅",x:22,y:55,w:22,h:24,color:"#477f39",notes:"First tomato bed."},
{id:"tomatoes-middle",name:"Tomatoes",emoji:"🍅",x:48,y:55,w:18,h:37,color:"#477f39",notes:"Second tomato bed."},
{id:"hot-peppers-right",name:"Hot Peppers",emoji:"🌶️",x:76,y:53,w:20,h:20,color:"#447e3b",notes:"Hot peppers."},
{id:"hot-peppers-bottom",name:"Hot Peppers",emoji:"🌶️",x:70,y:79,w:28,h:16,color:"#447e3b",notes:"Second hot pepper bed."},
];

export function layoutSpaceDrafts(beds: Bed[], existing: Space[], excludePeppers = true) {
 const used = new Set<string>();
 const nonPepper = beds.filter(b => !excludePeppers || !/pepper/i.test(`${b.id} ${b.name}`));
 return nonPepper.flatMap(bed => {
  const sameName = beds.filter(b => b.name.trim().toLowerCase() === bed.name.trim().toLowerCase());
  const suffix = sameName.length > 1 ? ` (${sameName.indexOf(bed)+1})` : "";
  const name = `${bed.name.trim()}${suffix}`;
  const match = existing.find(space => {
   if(used.has(space.id)) return false;
   if(bed.spaceId === space.id) return true;
   try {if(JSON.parse(space.notes ?? "null")?.sourceLayoutId === bed.id) return true;} catch { /* Keep unsupported records intact. */ }
   return [name,bed.name.trim()].some(candidate => candidate.toLowerCase() === space.name.trim().toLowerCase());
  });
  if(match){used.add(match.id);return [];}
  return [{name,type:bed.spaceType ?? (bed.id === "flowers" || bed.id === "herbs" ? "In-ground Bed" : "Raised Bed"),length_feet:null,width_feet:null,depth_feet:null,diameter_inches:null,sun_exposure:null,irrigation:null,soil_type:null,notes:JSON.stringify({garden_os:1,notes:[bed.notes,...(bed.plants??[]).map(p=>`${p.name}${p.variety ? ` · ${p.variety}`:""}${p.quantity ? ` · ${p.quantity}`:""}${p.notes ? ` — ${p.notes}`:""}`)].filter(Boolean).join("\n"),plants:[],entries:[],sourceLayoutId:bed.id})}];
 });
}

export function nineBedLayout(saved: unknown): Bed[] {
 const entries = Array.isArray(saved) ? saved : [];
 return initialLayout.map(bed => ({...bed,...entries.find(entry => entry && entry.id === bed.id)}));
}
export function linkedLayoutSpaces(beds: Bed[], spaces: Space[]): Map<string,Space> {
 const result = new Map<string,Space>(), used = new Set<string>();
 const sourceId = (space: Space) => {try{return JSON.parse(space.notes ?? "null")?.sourceLayoutId;}catch{return undefined;}};
 // Explicit links and imported IDs take priority over name guesses.
 for(const bed of beds){const space=spaces.find(s=>!used.has(s.id)&&(bed.spaceId ? s.id===bed.spaceId : sourceId(s)===bed.id));if(space){result.set(bed.id,space);used.add(space.id);}}
 const normalized=(name:string)=>name.toLowerCase().replace(/\b(beds?|plants?)\b/g,"").replace(/[^a-z0-9]/g,"");
 for(const bed of beds){if(result.has(bed.id)||bed.spaceId)continue;const siblings=beds.filter(b=>b.name===bed.name);const names=[bed.name,`${bed.name} (${siblings.indexOf(bed)+1})`];if(bed.id==="green-peppers")names.push("Bell Peppers","Green Pepper","Bell Pepper");const space=spaces.find(s=>!used.has(s.id)&&names.some(name=>normalized(name)===normalized(s.name)));if(space){result.set(bed.id,space);used.add(space.id);}}
 return result;
}
