import type {Space} from "./garden";
export type BedPlant = { id:string; name:string; variety:string; quantity:string; notes:string }; 
export type Bed = { plants?:BedPlant[]; id:string; name:string; emoji:string; x:number;y:number;w:number;h:number; color:string; notes:string };
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

export function layoutSpaceDrafts(beds: Bed[], existing: Space[]) {
 const used = new Set<string>();
 const nonPepper = beds.filter(b => !/pepper/i.test(`${b.id} ${b.name}`));
 return nonPepper.flatMap(bed => {
  const sameName = beds.filter(b => b.name.trim().toLowerCase() === bed.name.trim().toLowerCase());
  const suffix = sameName.length > 1 ? ` (${sameName.indexOf(bed)+1})` : "";
  const name = `${bed.name.trim()}${suffix}`;
  const match = existing.find(space => {
   if(used.has(space.id)) return false;
   try {if(JSON.parse(space.notes ?? "null")?.sourceLayoutId === bed.id) return true;} catch { /* Keep unsupported records intact. */ }
   return [name,bed.name.trim()].some(candidate => candidate.toLowerCase() === space.name.trim().toLowerCase());
  });
  if(match){used.add(match.id);return [];}
  return [{name,type:bed.id === "flowers" || bed.id === "herbs" ? "In-ground Bed" : "Raised Bed",length_feet:null,width_feet:null,depth_feet:null,diameter_inches:null,sun_exposure:null,irrigation:null,soil_type:null,notes:JSON.stringify({garden_os:1,notes:[bed.notes,...(bed.plants??[]).map(p=>`${p.name}${p.variety ? ` · ${p.variety}`:""}${p.quantity ? ` · ${p.quantity}`:""}${p.notes ? ` — ${p.notes}`:""}`)].filter(Boolean).join("\n"),plants:[],entries:[],sourceLayoutId:bed.id})}];
 });
}
