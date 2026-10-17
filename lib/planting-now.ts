// Guest discovery is independent of accounts, saved gardens, and the visual season selector.
export type PlantingClimate = {
  version: 1; zip: string; place: string; zone: string; timezone: string;
  lastSpringFrost: string | null; firstFallFrost: string | null;
  meanHigh: number[]; meanLow: number[]; years: number; startYear: number; endYear: number;
  frostYears: number; forecast: { date: string; min: number; max: number }[]; resolvedAt: string;
};
export type PlantingCrop = {
  id: string; name: string; portrait: string; kind: "Vegetable" | "Herb" | "Flower";
  climate: "cool" | "warm" | "garlic"; seedDays: number; transplantDays?: number;
  springLead: number; indoorLead?: number; description: string; why: string; care: string; source: string;
};
const umn = "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/";
export const plantingCrops: PlantingCrop[] = [
  { id:"garlic", name:"Garlic", portrait:"Garlic", kind:"Vegetable", climate:"garlic", seedDays:0, springLead:0,
    description:"A bulb-forming allium grown from individual cloves. Fall planting is for a harvest next summer, not this autumn.", why:"Cool autumn soil supports root establishment before winter. Cold exposure helps suitable garlic varieties form bulbs.", care:"Use locally adapted seed garlic, plant in well-drained soil, and mulch after planting. Soil must still be workable; a first air frost is not the same as frozen ground.", source:"https://extension.illinois.edu/blogs/garden-scoop/2021-10-09-fall-garlic-planting" },
  { id:"lettuce", name:"Leaf lettuce", portrait:"Lettuce", kind:"Vegetable", climate:"cool", seedDays:60, transplantDays:35, springLead:28,
    description:"A leafy vegetable harvested leaf by leaf or as a small head. Early varieties and baby-leaf harvests may be quicker.", why:"Mild weather favors tender leaves. Summer heat can cause bitterness and bolting.", care:"Keep the seedbed evenly moist. A light frost may be tolerated, but new growth slows as light and temperatures decline.", source:umn+"growing-lettuce-endive-and-radicchio" },
  { id:"spinach", name:"Spinach", portrait:"Spinach", kind:"Vegetable", climate:"cool", seedDays:45, springLead:35,
    description:"A leafy green suited to cool conditions, generally grown directly from seed.", why:"It grows well in cool weather and tolerates frost once established. Long, hot days encourage bolting.", care:"This guide budgets time for a harvest before the usual first frost. Overwintering is a separate project requiring suitable varieties, establishment time, and often protection.", source:umn+"growing-spinach-and-swiss-chard" },
  { id:"radish", name:"Radishes", portrait:"Radish", kind:"Vegetable", climate:"cool", seedDays:35, springLead:28,
    description:"Quick-growing root vegetables. These timings refer to small spring radishes, not long-season daikon or winter radishes.", why:"Cool soil and steady moisture encourage good roots; hot weather can reduce quality.", care:"Sow directly where they will grow and thin promptly. Choose a variety with a short maturity time on its packet.", source:umn+"growing-radishes" },
  { id:"kale", name:"Kale", portrait:"Kale", kind:"Vegetable", climate:"cool", seedDays:65, transplantDays:45, springLead:28,
    description:"A leafy brassica harvested over several weeks. Nursery transplants can shorten the wait compared with seeds.", why:"Kale suits mild weather and established plants tolerate cold better than many vegetables.", care:"Harden off transplants and protect young plants from pests. Cold tolerance does not mean a new seedling will grow quickly in winter.", source:umn+"growing-kale" },
  { id:"peas", name:"Peas", portrait:"Peas", kind:"Vegetable", climate:"cool", seedDays:80, springLead:35,
    description:"A cool-season climbing or bush legume, including snap and shelling types.", why:"Peas benefit from an early start before summer heat. Pods and flowers are more vulnerable to frost than established leaves.", care:"Direct sow into workable soil and add support where needed. Fall crops need extra time as days shorten.", source:umn+"growing-peas" },
  { id:"tomato", name:"Tomatoes", portrait:"Tomato", kind:"Vegetable", climate:"warm", seedDays:140, transplantDays:80, springLead:-14, indoorLead:56,
    description:"A fruiting warm-season vegetable. Outdoor timings below use a sturdy nursery transplant, not a seed started today.", why:"Tomatoes need frost-free weather, warm soil, and mild nights to establish and produce fruit.", care:"Wait for nights consistently around 50°F or warmer, harden off plants, and provide support. Check variety-specific maturity dates.", source:umn+"growing-tomatoes" },
  { id:"pepper", name:"Peppers", portrait:"Pepper", kind:"Vegetable", climate:"warm", seedDays:170, transplantDays:90, springLead:-21, indoorLead:70,
    description:"Warm-season fruiting plants, including sweet and hot types. Some hot peppers take substantially longer than these planning figures.", why:"Peppers need a long warm season and dislike cold soil and cool nights.", care:"Use vigorous transplants after frost risk has eased and nights are reliably above about 55°F. Allow more time for fully colored fruit.", source:umn+"growing-peppers" },
  { id:"beans", name:"Bush beans", portrait:"Bush Beans", kind:"Vegetable", climate:"warm", seedDays:65, springLead:-14,
    description:"Compact snap beans usually sown directly outdoors. Dry beans and pole beans can require different timings.", why:"Warm soil helps seeds germinate; even a light frost can kill the plants.", care:"Wait for warm, workable soil. Sow a short-season variety and keep the planting evenly moist through flowering.", source:umn+"growing-beans" },
  { id:"basil", name:"Basil", portrait:"Basil", kind:"Herb", climate:"warm", seedDays:60, transplantDays:30, springLead:-21,
    description:"A tender leafy herb that can grow in an outdoor pot or indoors with adequate light and warmth.", why:"Basil thrives in warmth and is damaged by cold. Indoor growing avoids the outdoor frost window.", care:"Give an indoor plant a bright grow light if daylight is insufficient, good drainage, and a warm position away from cold windows.", source:umn+"growing-basil" },
  { id:"zinnia", name:"Zinnias", portrait:"Zinnia", kind:"Flower", climate:"warm", seedDays:75, transplantDays:50, springLead:-14,
    description:"Colorful warm-season annual flowers for beds, pollinators, and cutting.", why:"Zinnias grow quickly in warm soil and sunshine, but are frost-tender.", care:"Wait until soil is around 60°F or warmer. Give plants air circulation and water at soil level.", source:umn+"zinnia" },
  { id:"alyssum", name:"Sweet alyssum", portrait:"Sweet Alyssum", kind:"Flower", climate:"cool", seedDays:60, transplantDays:28, springLead:14,
    description:"A low, fragrant flowering plant often used along edges and in containers.", why:"Mild spring and autumn weather suits its flowering; high summer heat can reduce the display.", care:"For a shorter window, choose nursery plants already budding. Water to establish them and protect young plants from hard freezes.", source:"https://plants.ces.ncsu.edu/plants/lobularia-maritima/" },
  { id:"pansy", name:"Pansies", portrait:"Pansy", kind:"Flower", climate:"cool", seedDays:100, transplantDays:28, springLead:14,
    description:"Cool-season flowering plants. Nursery transplants provide color much sooner than starting seeds.", why:"Cool temperatures suit flowering, while summer heat often reduces performance.", care:"Use hardened-off nursery plants and allow several weeks to root before severe cold. Winter survival depends on variety, site, and protection.", source:"https://plants.ces.ncsu.edu/plants/viola-x-wittrockiana/" },
];
export type PlantingAdvice = { crop: PlantingCrop; status: "good" | "tight" | "indoors" | "wait" | "unknown"; badge: string; method: string; timing: string; explanation: string; daysAvailable?: number; daysNeeded?: number };
const DAY = 86400000;
export function validDay(value: string) { try { return /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value+"T12:00:00Z").toISOString().slice(0,10) === value; } catch { return false; } }
function stamp(day: string) { return Date.parse(day+"T12:00:00Z"); }
function add(day: string, days: number) { return new Date(stamp(day)+days*DAY).toISOString().slice(0,10); }
function distance(a: string, b: string) { return Math.round((stamp(b)-stamp(a))/DAY); }
export function plantingDay(climate?: PlantingClimate, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:climate?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
}
export function validClimate(value: unknown): value is PlantingClimate {
  if (!value || typeof value !== "object") return false;
  const c=value as PlantingClimate;
  try { return c.version===1 && /^\d{5}$/.test(c.zip) && /^(?:[1-9]|1[0-3])[ab]$/.test(c.zone) && typeof c.place==="string" && c.place.length<=150 &&
    new Intl.DateTimeFormat("en",{timeZone:c.timezone}).format(new Date()).length>0 &&
    [c.lastSpringFrost,c.firstFallFrost].every(d=>d===null || (typeof d==="string" && validDay("2024-"+d))) &&
    (c.lastSpringFrost===null)===(c.firstFallFrost===null) && c.years>=10 && c.years<=30 && c.frostYears>=0 && c.frostYears<=c.years &&
    c.meanHigh?.length===12 && c.meanLow?.length===12 && [...c.meanHigh,...c.meanLow].every(n=>Number.isFinite(n)&&n>=-100&&n<=140) &&
    Array.isArray(c.forecast) && c.forecast.length<=16 && c.forecast.every(p=>validDay(p.date)&&Number.isFinite(p.min)&&Number.isFinite(p.max)) && Number.isFinite(Date.parse(c.resolvedAt));
  } catch { return false; }
}
export function friendlyDate(day: string) { return new Date(day+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}); }
export function advisePlant(crop: PlantingCrop, climate: PlantingClimate | undefined, today: string): PlantingAdvice {
  const base={crop,status:"unknown" as PlantingAdvice["status"],badge:"Check local timing",method:"Set your location",timing:"Find your local planting window",explanation:"Choose your growing location to compare this plant’s needs with local frost timing and typical temperatures."};
  if(!climate) return base;
  if(!validDay(today)) throw new Error("Invalid planting date");
  const year=Number(today.slice(0,4)), month=Number(today.slice(5,7))-1;
  const first=climate.firstFallFrost ? `${year}-${climate.firstFallFrost}` : null;
  const last=climate.lastSpringFrost ? `${year}-${climate.lastSpringFrost}` : null;
  const forecast=climate.forecast.filter(p=>p.date>=today && p.date<=add(today,7));
  const freezeAhead=forecast.some(p=>p.min<=32), hardFreezeAhead=forecast.some(p=>p.min<25);
  const high=climate.meanHigh[month], low=climate.meanLow[month];
  const wait=(explanation:string,timing="Wait for the next suitable window"):PlantingAdvice=>({...base,status:"wait",badge:"Plan ahead",method:crop.transplantDays?"Nursery transplant":"Direct sow",timing,explanation});
  if(crop.climate==="garlic") {
    if(!first || Number.parseInt(climate.zone)>8) return wait("Garlic variety and chilling requirements vary in mild-winter climates. Follow a local Extension recommendation rather than a cold-climate autumn schedule.");
    const start=add(first,-21),end=add(first,21);
    if(today>=start && today<=end && low>=25 && high<=75) return {...base,status:"good",badge:"Plant for next summer",method:"Plant individual cloves",timing:`Typical autumn window: ${friendlyDate(start)}–${friendlyDate(end)}`,explanation:"This is near your area’s usual first frost, a useful autumn planting window. Plant only while the ground is workable and before it freezes; harvest is next summer, not this season."};
    return wait("Garlic is usually an autumn planting project in this climate. Allow cloves time to root before the ground freezes; use the soil condition and local guidance to refine these dates.",`Typical autumn window: ${friendlyDate(start)}–${friendlyDate(end)}`);
  }
  const warm=crop.climate==="warm";
  const heatCeiling=crop.id==="kale"?85:80;
  const springStart=last?add(last,-crop.springLead):null;
  if(warm && crop.indoorLead && last && today>=add(last,-crop.indoorLead) && today<add(last,-crop.indoorLead+21)) return {...base,status:"indoors",badge:"Start seeds indoors",method:"Indoor seed starting",timing:`About ${Math.round(crop.indoorLead/7)} weeks before the usual last frost`,explanation:"There is time to raise a transplant indoors before the outdoor planting window. Use strong light and warmth; do not put tender seedlings outside yet."};
  // Cold-season guests still receive useful indoor options, without promising an outdoor crop.
  if((crop.id==="lettuce" || crop.id==="basil") && (low<(crop.id==="basil"?50:35) || (first && distance(today,first)<(crop.transplantDays??crop.seedDays)+14))) return {...base,status:"indoors",badge:"Grow indoors",method:"Indoor container + grow light",timing:"An indoor growing option",explanation:"The outdoor window is too short or cold for a dependable new planting. A warm indoor container with adequate grow lighting is an alternative; outdoor frost dates do not predict indoor harvests."};
  if(warm && first && last && today>last && distance(today,first)<(crop.transplantDays??crop.seedDays)+14) return {...wait("It is too late in this outdoor growing window for a dependable new planting. There isn’t enough frost-free time left to establish and mature before cold weather.","Plan an outdoor planting for the next warm season"),daysAvailable:Math.max(0,distance(today,first)),daysNeeded:(crop.transplantDays??crop.seedDays)+14};
  if(warm && ((springStart && today<springStart) || low<(crop.id==="pepper"?55:50) || freezeAhead)) return wait("Outdoor conditions are still too cold, or the near-term forecast includes frost. Wait until frost risk has eased, nights are mild, and the soil has warmed.",springStart?`Reconsider outdoors around ${friendlyDate(springStart)}, subject to weather`:"Wait for consistently warm nights");
  if(!warm && ((springStart && today<springStart) || high<45 || low<25 || high>heatCeiling || hardFreezeAhead || forecast.some(p=>p.max>=95))) return wait(high>heatCeiling?"This is typically too hot for a reliable new cool-season planting. Wait for a cooler stretch with enough time to establish.":"The ground may be frozen or conditions too cold for a reliable new planting. Wait for workable soil and a milder forecast.");
  if(warm && high>95) return wait("Extreme seasonal heat makes establishment unreliable. A local heat-adapted planting calendar is more useful than simply counting frost-free days.");
  // Stop at the next frost, or at the start of a consistently hot month for cool crops.
  let available=first && today<=first ? distance(today,first) : first ? 0 : 180;
  for(let offset=1;offset<180;offset++) { const d=add(today,offset), m=Number(d.slice(5,7))-1;
    if(warm ? climate.meanLow[m]<50 || climate.meanHigh[m]>95 : climate.meanHigh[m]>heatCeiling){available=Math.min(available,offset);break;}
  }
  const buffer=14,seedNeeded=crop.seedDays+buffer,transplantNeeded=(crop.transplantDays??crop.seedDays)+buffer;
  const canSeed=available>=seedNeeded && !(warm && crop.transplantDays),needed=canSeed?seedNeeded:transplantNeeded;
  const method=canSeed && !warm?"Direct sow seeds":crop.transplantDays?"Use a nursery transplant":"Direct sow seeds";
  if(available<needed) return {...wait("There is not enough time in the estimated outdoor window for a dependable harvest or flowering from a new planting. Save this for the next window instead of counting on frost tolerance alone."),daysAvailable:available,daysNeeded:needed};
  const tight=available-needed<21;
  return {...base,status:tight?"tight":"good",badge:tight?"Time is tight":"Good planting window",method,timing:`About ${available} days in the estimated outdoor window`,explanation:`${method}. Budget about ${needed} days including a 14-day allowance for establishment and slower growth. ${tight?"Choose an early variety and avoid delay; an early frost could shorten this window.":"The typical local temperatures and remaining season leave a useful margin."} This is climate-based guidance, not a harvest guarantee.`,daysAvailable:available,daysNeeded:needed};
}
export function plantingSuggestions(climate: PlantingClimate | undefined, today: string) {
  return plantingCrops.map(c=>advisePlant(c,climate,today)).sort((a,b)=>({good:0,tight:1,indoors:2,unknown:3,wait:4}[a.status]-{good:0,tight:1,indoors:2,unknown:3,wait:4}[b.status]));
}
