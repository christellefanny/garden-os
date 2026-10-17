import { validClimate, type PlantingClimate } from "./planting-now.ts";

type Daily = { time: string[]; temperature_2m_min: (number|null)[]; temperature_2m_max: (number|null)[] };
const zoneService="https://services1.arcgis.com/SyUSN23vOoYdfLC8/arcgis/rest/services/PHZM_2023_Zip_Code_Table/FeatureServer/296/query";
export const plantingHosts=new Set(["services1.arcgis.com","geocode.arcgis.com","geocoding-api.open-meteo.com","archive-api.open-meteo.com","api.open-meteo.com"]);
export async function plantingJson(url: string, fetcher: typeof fetch = fetch) {
  const u=new URL(url);
  if(u.protocol!=="https:" || !plantingHosts.has(u.hostname) || u.port || u.username || u.password) throw new Error("Unsupported planting data source.");
  const r=await fetcher(u,{signal:AbortSignal.timeout(10000),redirect:"error",headers:{Accept:"application/json"},next:{revalidate:3600}});
  if(!r.ok) throw new Error("The growing-location service is temporarily unavailable. Please try again.");
  const d=await r.json(); if(d.error) throw new Error("The growing-location service could not resolve this location.");return d;
}
export function summarizeClimate(daily: Daily, startYear: number, endYear: number) {
  if(!daily || !Array.isArray(daily.time) || daily.time.length!==daily.temperature_2m_min?.length || daily.time.length!==daily.temperature_2m_max?.length) throw new Error("Incomplete historical climate data.");
  const spring:string[]=[],fall:string[]=[],highs:number[][]=Array.from({length:12},()=>[]),lows:number[][]=Array.from({length:12},()=>[]);
  const years=new Map<number,{count:number;spring:string[];fall:string[]}>();
  daily.time.forEach((date,i)=>{const min=daily.temperature_2m_min[i],max=daily.temperature_2m_max[i],year=Number(date.slice(0,4)),month=Number(date.slice(5,7))-1;
    if(year<startYear || year>endYear || month<0 || month>11 || min===null || max===null || !Number.isFinite(min) || !Number.isFinite(max))return;
    const record=years.get(year)||{count:0,spring:[],fall:[]};record.count++;
    if(min<=32)(month<6?record.spring:record.fall).push(date.slice(5));years.set(year,record);highs[month].push(max);lows[month].push(min);
  });
  const complete=[...years.values()].filter(r=>r.count>=330);
  if(complete.length<10 || highs.some(m=>m.length<200))throw new Error("Not enough reliable historical data for this area.");
  complete.forEach(r=>{if(r.spring.length)spring.push(r.spring.sort().at(-1)!);if(r.fall.length)fall.push(r.fall.sort()[0]);});
  const quantile=(a:string[],q:number)=>a.sort()[Math.floor((a.length-1)*q)];
  // Rare-frost climates have no dependable annual frost date; their temperature normals still apply.
  const regular=spring.length>=complete.length*.6 && fall.length>=complete.length*.6;
  return {lastSpringFrost:regular?quantile(spring,.8):null,firstFallFrost:regular?quantile(fall,.2):null,years:complete.length,frostYears:Math.max(spring.length,fall.length),meanHigh:highs.map(a=>Math.round(a.reduce((s,n)=>s+n,0)/a.length)),meanLow:lows.map(a=>Math.round(a.reduce((s,n)=>s+n,0)/a.length))};
}
export function parsePlantingInput(value: unknown): {zip:string} | {latitude:number;longitude:number} {
  if(!value || typeof value!=="object")throw new Error("Enter a five-digit U.S. ZIP code or use your location.");
  const p=value as Record<string,unknown>;
  if(typeof p.zip==="string" && /^\d{5}$/.test(p.zip.trim()))return {zip:p.zip.trim()};
  if(typeof p.latitude==="number" && typeof p.longitude==="number" && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude>=18 && p.latitude<=72 && p.longitude>=-180 && p.longitude<=-60) return {latitude:Math.round(p.latitude*100)/100,longitude:Math.round(p.longitude*100)/100};
  throw new Error("Enter a five-digit U.S. ZIP code. Automatic lookup currently supports U.S. locations.");
}
export async function resolvePlantingLocation(input: ReturnType<typeof parsePlantingInput>, fetcher: typeof fetch = fetch, now = new Date()): Promise<PlantingClimate> {
  let zip="zip" in input?input.zip:"";
  if(!zip && "latitude" in input){
    const q=new URLSearchParams({f:"json",location:`${input.longitude},${input.latitude}`,featureTypes:"Postal",langCode:"en"});
    const geo=await plantingJson("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?"+q,fetcher);
    if(geo.address?.CountryCode!=="USA" || !/^\d{5}$/.test(geo.address?.Postal || ""))throw new Error("We couldn’t find a U.S. ZIP code here. Please enter one instead.");
    zip=geo.address.Postal;
  }
  const [zoneData,geo]=await Promise.all([
    plantingJson(zoneService+"?"+new URLSearchParams({f:"json",where:`ZIP_CODE = '${zip}'`,outFields:"ZIP_CODE,Class",returnGeometry:"false"}),fetcher),
    plantingJson("https://geocoding-api.open-meteo.com/v1/search?"+new URLSearchParams({name:zip,count:"100",language:"en",format:"json"}),fetcher),
  ]);
  const attributes=zoneData.features?.find((f:{attributes?:{ZIP_CODE?:string}})=>f.attributes?.ZIP_CODE===zip)?.attributes;
  const zone=String(attributes?.Class || "").match(/^(\d{1,2}[ab])\b/)?.[1];
  const places=geo.results?.filter((p:{country_code?:string;postcodes?:string[]})=>p.country_code==="US" && p.postcodes?.includes(zip)) || [];
  if(!zone || !places.length)throw new Error("We couldn’t match that ZIP code to both a growing zone and climate location. Try a nearby residential ZIP code.");
  const place=places[0],latitude=Number(place.latitude),longitude=Number(place.longitude);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error("Location coordinates were unavailable.");
  const endYear=now.getUTCFullYear()-1,startYear=endYear-14;
  const coords={latitude:String(latitude),longitude:String(longitude),temperature_unit:"fahrenheit",timezone:"auto",daily:"temperature_2m_min,temperature_2m_max"};
  const [archive,weather]=await Promise.all([
    plantingJson("https://archive-api.open-meteo.com/v1/archive?"+new URLSearchParams({...coords,start_date:`${startYear}-01-01`,end_date:`${endYear}-12-31`}),fetcher),
    plantingJson("https://api.open-meteo.com/v1/forecast?"+new URLSearchParams({...coords,forecast_days:"7"}),fetcher).catch(()=>null),
  ]);
  const climate=summarizeClimate(archive.daily,startYear,endYear);
  const forecast=(weather?.daily?.time || []).flatMap((date:string,i:number)=>{const min=weather.daily.temperature_2m_min[i],max=weather.daily.temperature_2m_max[i];return typeof min==="number"&&typeof max==="number"?[{date,min,max}]:[];});
  const result:PlantingClimate={version:1,zip,place:[place.name,place.admin1].filter(Boolean).join(", "),zone,timezone:archive.timezone,...climate,startYear,endYear,forecast,resolvedAt:now.toISOString()};
  if(!validClimate(result))throw new Error("The location data could not be verified. Please try again.");
  return result;
}
