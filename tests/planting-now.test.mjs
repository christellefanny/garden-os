import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plantingCrops,advisePlant,plantingSuggestions,validClimate,validDay,plantingDay} from '../lib/planting-now.ts';
import {summarizeClimate,parsePlantingInput,plantingJson,resolvePlantingLocation} from '../lib/planting-location.ts';
import {readFileSync} from 'node:fs';
const illinois={version:1,zip:'60544',place:'Plainfield, Illinois',zone:'5b',timezone:'America/Chicago',lastSpringFrost:'04-28',firstFallFrost:'10-14',meanHigh:[31,36,48,61,72,81,85,83,76,63,48,36],meanLow:[17,21,31,41,52,62,66,64,55,43,32,22],years:15,frostYears:15,startYear:2011,endYear:2025,forecast:[],resolvedAt:'2026-10-17T10:00:00Z'};
const crop=id=>plantingCrops.find(c=>c.id===id);
test('guests without a location receive no claims of local suitability',()=>{
 assert.ok(plantingSuggestions(undefined,'2026-10-17').every(a=>a.status==='unknown'));
 assert.equal(validClimate(illinois),true);assert.equal(validClimate({...illinois,zone:'potato'}),false);assert.equal(validDay('2026-02-30'),false);
});
test('late autumn distinguishes next-summer garlic, indoor growing, and missed outdoor windows',()=>{
 assert.equal(advisePlant(crop('garlic'),illinois,'2026-10-17').status,'good');
 assert.equal(advisePlant(crop('lettuce'),illinois,'2026-10-17').status,'indoors');
 assert.equal(advisePlant(crop('spinach'),illinois,'2026-10-17').status,'wait');
 assert.equal(advisePlant(crop('tomato'),illinois,'2026-10-17').status,'wait');
 assert.equal(advisePlant(crop('garlic'),illinois,'2026-12-15').status,'wait');
});
test('short windows require transplants and retain a maturity buffer',()=>{
 const a=advisePlant(crop('kale'),illinois,'2026-08-12');assert.equal(a.method,'Use a nursery transplant');assert.equal(a.daysNeeded,59);assert.equal(a.status,'tight');
 assert.equal(advisePlant(crop('tomato'),illinois,'2026-09-01').status,'wait');
 const tomato=advisePlant(crop('tomato'),illinois,'2026-06-01');assert.equal(tomato.method,'Use a nursery transplant');assert.equal(tomato.daysNeeded,94);assert.equal(tomato.status,'good');
});
test('winter, summer heat, seed-starting and forecast frosts are separate decisions',()=>{
 assert.equal(advisePlant(crop('basil'),illinois,'2026-01-10').status,'indoors');
 assert.equal(advisePlant(crop('lettuce'),illinois,'2026-07-10').status,'wait');
 assert.equal(advisePlant(crop('tomato'),illinois,'2026-03-10').status,'indoors');
 assert.equal(advisePlant(crop('tomato'),{...illinois,forecast:[{date:'2026-06-02',min:31,max:65}]},'2026-06-01').status,'wait');
 // An old warning must not keep blocking a later planting.
 assert.equal(advisePlant(crop('tomato'),{...illinois,forecast:[{date:'2026-05-01',min:31,max:65}]},'2026-06-01').status,'good');
});
test('mild winter climates use temperature patterns instead of inventing frost dates',()=>{
 const mild={...illinois,zone:'10b',lastSpringFrost:null,firstFallFrost:null,meanHigh:[74,76,78,82,86,89,90,90,89,85,80,76],meanLow:[60,62,64,68,72,76,77,77,76,72,66,62],frostYears:0};
 assert.equal(advisePlant(crop('spinach'),mild,'2026-01-10').status,'good');
 assert.equal(advisePlant(crop('garlic'),mild,'2026-10-17').status,'wait');
 assert.equal(plantingDay({...mild,timezone:'Pacific/Honolulu'},new Date('2026-10-18T04:00:00Z')),'2026-10-17');
});
function history(){const d={time:[],temperature_2m_min:[],temperature_2m_max:[]};for(let y=2011;y<=2025;y++)for(let dt=new Date(`${y}-01-01T12:00:00Z`);dt.getUTCFullYear()===y;dt.setUTCDate(dt.getUTCDate()+1)){const s=dt.toISOString().slice(0,10),md=s.slice(5);d.time.push(s);d.temperature_2m_min.push(md<='04-28'||md>='10-14'?30:60);d.temperature_2m_max.push(70);}return d;}
test('historical calculation uses 15 complete local years and rejects insufficient data',()=>{
 const c=summarizeClimate(history(),2011,2025);assert.equal(c.lastSpringFrost,'04-28');assert.equal(c.firstFallFrost,'10-14');assert.equal(c.years,15);
 const d=history();d.temperature_2m_min=d.temperature_2m_min.map(()=>60);const mild=summarizeClimate(d,2011,2025);assert.equal(mild.lastSpringFrost,null);assert.equal(mild.firstFallFrost,null);
 assert.throws(()=>summarizeClimate({time:['2025-01-01'],temperature_2m_min:[null],temperature_2m_max:[null]},2011,2025));
});
test('location input rejects malformed, overseas and injected requests; coordinates are coarsened',async()=>{
 assert.deepEqual(parsePlantingInput({zip:' 60544 '}),{zip:'60544'});
 assert.deepEqual(parsePlantingInput({latitude:41.626978,longitude:-88.203953}),{latitude:41.63,longitude:-88.2});
 for(const input of [{zip:"60544' OR 1=1"},{zip:'abc'},null,{latitude:'41',longitude:10},{latitude:Infinity,longitude:-88},{latitude:-34,longitude:151}])assert.throws(()=>parsePlantingInput(input));
 await assert.rejects(()=>plantingJson('http://127.0.0.1/'));await assert.rejects(()=>plantingJson('https://user:pass@api.open-meteo.com/'));await assert.rejects(()=>plantingJson('https://api.open-meteo.com.evil.test/'));
});
test('live-location resolver validates USDA ZIP match and country, with no account data dependencies',async()=>{
 const fake=async url=>{const u=new URL(url);let data;if(u.hostname==='services1.arcgis.com')data={features:[{attributes:{ZIP_CODE:'60544',Class:'5b (-15 to -10 °F)'}}]};else if(u.hostname==='geocoding-api.open-meteo.com')data={results:[{country_code:'FR',postcodes:['60544'],latitude:49,longitude:2,name:'Wrong country'},{country_code:'US',postcodes:['60544'],latitude:41.63,longitude:-88.2,name:'Plainfield',admin1:'Illinois'}]};else if(u.hostname==='archive-api.open-meteo.com')data={timezone:'America/Chicago',daily:history()};else data={daily:{time:['2026-10-17'],temperature_2m_min:[39],temperature_2m_max:[62]}};return Response.json(data);};
 const c=await resolvePlantingLocation({zip:'60544'},fake,new Date('2026-10-17T12:00:00Z'));assert.equal(c.place,'Plainfield, Illinois');assert.equal(c.zone,'5b');assert.equal(c.forecast.length,1);assert.equal('latitude' in c,false);assert.equal('longitude' in c,false);assert.equal(validClimate(c),true);
});
test('all plant guides have distinct, valid raster artwork and primary growing sources',()=>{
 assert.equal(new Set(plantingCrops.map(c=>c.id)).size,13);
 for(const c of plantingCrops){const data=readFileSync(new URL('../public/planting-now/'+c.id+'.webp',import.meta.url));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.match(c.source,/^https:\/\/(extension\.(umn|illinois)\.edu|plants\.ces\.ncsu\.edu)\//);}
});
