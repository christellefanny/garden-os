/** Visual planning objects. Decorations are illustrations, never garden plant records. */
export const customPlantGroups = ["Vegetables", "Flowers", "Herbs", "Other"] as const;
export type CustomPlantGroup = typeof customPlantGroups[number];
export type Decoration = { id: string; plantId: string; x: number; y: number; customName?: string; customGroup?: CustomPlantGroup };
export type LayoutItem = {
  id: string; name: string; kind: "Bed" | "Container" | "Path" | "Border" | "Wall";
  x: number; y: number; w: number; h: number; spaceId: string; color?: string;
  decorations?: Decoration[];
  groundCover?: GroundCoverId;
  containerStyle?: string;
  wallStyle?: string;
  wallRotation?: number;
};
export type PhotoLayoutSource = { method: "photo"; focus?: "mixed" | "beds" | "containers"; image?: string; aspectRatio?: number; widthFeet?: number; depthFeet?: number; notes: string; reviewedAt: string };
export type Layout = { id: string; name: string; coverImage?: string; items: LayoutItem[]; color?: string; groundCover?: GroundCoverId; source?: PhotoLayoutSource };
export type GroundCoverId = "mulch" | "gravel" | "stone";
export const groundCovers = [
  {id:"mulch",name:"Bark mulch",src:"/layout-inspiration/ground-mulch-watercolor.webp",color:"#d9c8ac"},
  {id:"gravel",name:"Gravel & pebbles",src:"/layout-inspiration/ground-gravel-watercolor.webp",color:"#ede4d0"},
  {id:"stone",name:"Stepping stones",src:"/layout-inspiration/ground-stone-watercolor.webp",color:"#dbdccf"},
] as const;
export function surfaceAppearance(value:unknown) {
  const cover=groundCovers.find(c=>c.id===value);
  return cover ? {backgroundImage:`url("${cover.src}")`,backgroundSize:"170px 170px",backgroundRepeat:"repeat",backgroundColor:cover.color,backgroundBlendMode:"soft-light"} : {};
}
/** Infer a closed garden extent from beds and border hints, without filling the whole workspace. */
export function gardenFootprint(items:readonly Pick<LayoutItem,"kind"|"x"|"y"|"w"|"h">[]) {
  const valid=items.filter(i=>[i.x,i.y,i.w,i.h].every(Number.isFinite)&&i.w>0&&i.h>0);
  const growing=valid.filter(i=>i.kind!=="Path");
  const basis=growing.length?growing:valid;
  if(!basis.length)return null;
  const left=Math.max(0,Math.min(100,Math.min(...basis.map(i=>i.x)))),top=Math.max(0,Math.min(100,Math.min(...basis.map(i=>i.y))));
  const right=Math.min(100,Math.max(...basis.map(i=>i.x+i.w))),bottom=Math.min(100,Math.max(...basis.map(i=>i.y+i.h)));
  if(right<=left||bottom<=top)return null;
  return {left:`${left}%`,top:`${top}%`,width:`${right-left}%`,height:`${bottom-top}%`};
}
/** Square botanical stamps use canvas units, not the short edge of a thin border. */
export function plantStampStyle(item:Pick<LayoutItem,"x"|"y"|"w"|"h">,plant:Pick<Decoration,"x"|"y">) {
  const preferred=Math.min(12,Math.max(8,Math.min(item.w,item.h)*.42));
  const size=`clamp(44px, ${preferred}cqw, 112px)`,half=`clamp(22px, ${preferred/2}cqw, 56px)`;
  return {width:size,height:size,left:`clamp(calc(${half} - ${item.x}cqw), ${plant.x}%, calc(${100-item.x}cqw - ${half}))`,top:`clamp(calc(${half} - ${item.y}cqw), ${plant.y}%, calc(${100-item.y}cqw - ${half}))`};
}
export const designPlants = [
  {id:"tomato",name:"Tomato",group:"Vegetables",src:"/planting-now/tomato.webp"},
  {id:"pepper",name:"Pepper",group:"Vegetables",src:"/planting-now/pepper.webp"},
  {id:"lettuce",name:"Lettuce",group:"Vegetables",src:"/planting-now/lettuce.webp"},
  {id:"garlic",name:"Garlic",group:"Vegetables",src:"/planting-now/garlic.webp"},
  {id:"spinach",name:"Spinach",group:"Vegetables",src:"/planting-now/spinach.webp"},
  {id:"radish",name:"Radish",group:"Vegetables",src:"/planting-now/radish.webp"},
  {id:"kale",name:"Kale",group:"Vegetables",src:"/planting-now/kale.webp"},
  {id:"peas",name:"Peas",group:"Vegetables",src:"/planting-now/peas.webp"},
  {id:"beans",name:"Bush beans",group:"Vegetables",src:"/planting-now/beans.webp"},
  {id:"carrot",name:"Carrot",group:"Vegetables",src:"/layout-inspiration/carrot.webp"},
  {id:"cucumber",name:"Cucumber",group:"Vegetables",src:"/layout-inspiration/cucumber.webp"},
  {id:"broccoli",name:"Broccoli",group:"Vegetables",src:"/layout-inspiration/broccoli.webp"},
  {id:"okra",name:"Okra",group:"Vegetables",src:"/layout-inspiration/okra.webp"},
  {id:"dahlia",name:"Dahlia",group:"Flowers",src:"/layout-inspiration/dahlia-transparent.webp"},
  {id:"zinnia",name:"Zinnia",group:"Flowers",src:"/layout-inspiration/zinnia-transparent.webp"},
  {id:"cosmos",name:"Cosmos",group:"Flowers",src:"/layout-inspiration/cosmos-transparent.webp"},
  {id:"snapdragon",name:"Snapdragon",group:"Flowers",src:"/layout-inspiration/snapdragon-transparent.webp"},
  {id:"lisianthus",name:"Lisianthus",group:"Flowers",src:"/layout-inspiration/lisianthus-transparent.webp"},
  {id:"marigold",name:"Marigold",group:"Flowers",src:"/layout-inspiration/marigold-transparent.webp"},
  {id:"alyssum",name:"Sweet alyssum",group:"Flowers",src:"/layout-inspiration/alyssum-transparent.webp"},
] as const;
export type LayoutTemplate = {id:string;name:string;description:string;image:string;summary:string;items:Omit<LayoutItem,"id"|"spaceId">[]};
const stamps=(...ids:string[])=>ids.map((plantId,i)=>({id:`stamp-${i}`,plantId,x:25+(i%2)*50,y:25+Math.floor(i/2)*50}));
const bed=(name:string,x:number,y:number,w:number,h:number,...plants:string[]):Omit<LayoutItem,"id"|"spaceId">=>({name,kind:"Bed",x,y,w,h,decorations:stamps(...plants)});
export const layoutTemplates: LayoutTemplate[] = [
  {id:"vegetable",name:"Four-bed vegetable garden",description:"Four generous beds, a central cross path, and flowers along the back. An inviting starting point for a kitchen garden.",image:"/conservatory/vegetable-garden-example.webp",summary:"4 beds · Cross paths · Flower border",items:[
    {name:"Main path",kind:"Path",x:46,y:8,w:8,h:84},{name:"Cross path",kind:"Path",x:8,y:46,w:84,h:8},
    bed("Tomato bed",12,13,30,29,"tomato","tomato","tomato","tomato"),bed("Leafy greens",58,13,30,29,"lettuce","kale","lettuce","spinach"),
    bed("Roots & little harvests",12,58,30,29,"carrot","radish","carrot","radish"),bed("Peppers & beans",58,58,30,29,"pepper","beans","pepper","beans"),
    {name:"Flower border",kind:"Border",x:10,y:1,w:80,h:8,decorations:stamps("alyssum","dahlia")},
  ]},
  {id:"courtyard",name:"Compact courtyard garden",description:"Two long beds and five pots frame a clear walkway with an open front entrance. Make the most of a smaller garden without crowding it.",image:"/layout-inspiration/courtyard-open-entry.webp",summary:"2 beds · 5 pots · Open entrance",items:[
    {name:"Courtyard path",kind:"Path",x:46,y:8,w:8,h:92},bed("Climbing crops",12,20,29,60,"tomato","peas","beans","cucumber"),bed("Everyday harvests",59,20,29,60,"lettuce","radish","pepper","spinach"),
    ...[15,42,69].flatMap((x,i)=>[8,84].map((y,j)=>({name:`Patio pot ${i*2+j+1}`,kind:"Container" as const,x,y,w:12,h:12,decorations:stamps(j?"alyssum":"lettuce")}))).filter(item=>!(item.x===42&&item.y===84)).map((item,i)=>({...item,name:`Patio pot ${i+1}`,containerStyle:["terracotta","ivory","glazed","urn","grow-bag"][i]})),
  ]},
  {id:"cutting",name:"A garden for bouquets",description:"Four flower beds gathered around simple paths. Mix colors and textures, then make the arrangement your own.",image:"/layout-inspiration/cutting.webp",summary:"4 beds · Cutting flowers · Cross paths",items:[
    {name:"Flower garden path",kind:"Path",x:46,y:6,w:8,h:88},{name:"Cross path",kind:"Path",x:8,y:46,w:84,h:8},
    bed("Raspberry & blush",12,12,30,30,"dahlia","lisianthus","dahlia","lisianthus"),bed("Soft summer flowers",58,12,30,30,"cosmos","snapdragon","cosmos","lisianthus"),
    bed("Petals for picking",12,58,30,30,"zinnia","dahlia","zinnia","dahlia"),bed("Airy finishing flowers",58,58,30,30,"alyssum","snapdragon","alyssum","cosmos"),
  ]},
];
export function instantiateLayout(template:LayoutTemplate|undefined,name:string,uuid:()=>string=()=>crypto.randomUUID()):Layout {
  return {id:uuid(),name,items:template?.items.map(item=>({...item,id:uuid(),spaceId:"",decorations:item.decorations?.map(plant=>({...plant,id:uuid()}))}))??[]};
}
export function rotateItem<T extends Pick<LayoutItem,"x"|"y"|"w"|"h"> & {decorations?:Decoration[];kind?:LayoutItem["kind"];wallRotation?:number}>(item:T):T {
  return {...item,...(item.kind==="Wall"?{wallRotation:((item.wallRotation??0)+90)%360}:{}),x:Math.max(0,Math.min(100-item.h,item.x+(item.w-item.h)/2)),y:Math.max(0,Math.min(100-item.w,item.y+(item.h-item.w)/2)),w:item.h,h:item.w,...(item.decorations?{decorations:safeDecorations(item.decorations).map(plant=>({...plant,x:100-plant.y,y:plant.x}))}:{})};
}
/** Custom plants are named visual markers, never invented botanical art or real plant records. */
export function decorationAppearance(plant:Decoration):{name:string;group:string;src?:string} {
  if(plant.plantId==="custom")return {name:plant.customName??"Custom plant",group:plant.customGroup??"Other"};
  return designPlants.find(p=>p.id===plant.plantId)??{name:"Plant",group:"Other"};
}
function copyPosition(source:{x:number;y:number},occupied:readonly {x:number;y:number}[],min:number,maxX:number,maxY:number,step:number){
  const bounded=(n:number,max:number)=>Math.max(min,Math.min(max,n));
  for(let ring=1;ring<=25;ring++)for(const [dx,dy] of [[1,1],[1,0],[0,1],[-1,-1],[-1,0],[0,-1],[1,-1],[-1,1]]){
    const x=bounded(source.x+dx*step*ring,maxX),y=bounded(source.y+dy*step*ring,maxY);
    if(!occupied.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01))return {x,y};
  }
  return {x:bounded(source.x,maxX),y:bounded(source.y,maxY)};
}
export function duplicateDecoration(plant:Decoration,siblings:readonly Decoration[],uuid:()=>string=()=>crypto.randomUUID()):Decoration {
  return {...plant,id:uuid(),...copyPosition(plant,siblings,12,88,88,14)};
}
/** A copy must never point at the original's growing-space records. */
export function duplicateLayoutItem(item:LayoutItem,siblings:readonly LayoutItem[],uuid:()=>string=()=>crypto.randomUUID()):LayoutItem {
  const base=item.name.replace(/ \(copy(?: \d+)?\)$/,""),names=new Set(siblings.map(s=>s.name));
  let number=1,name:string;
  do{const suffix=number===1?" (copy)":` (copy ${number})`;name=base.slice(0,100-suffix.length)+suffix;number++;}while(names.has(name));
  return {...item,id:uuid(),name,spaceId:"",...copyPosition(item,siblings,0,100-item.w,100-item.h,4),...(item.decorations?{decorations:safeDecorations(item.decorations).map(plant=>({...plant,id:uuid()}))}:{})};
}
export function safeDecorations(value:unknown):Decoration[] {
  if(!Array.isArray(value))return [];
  return value.filter((d):d is Decoration=>d&&typeof d.id==="string"&&(designPlants.some(p=>p.id===d.plantId)||(d.plantId==="custom"&&typeof d.customName==="string"&&d.customName.trim().length>0&&d.customName.length<=80&&customPlantGroups.includes(d.customGroup)))&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&d.x>=0&&d.x<=100&&d.y>=0&&d.y<=100);
}
