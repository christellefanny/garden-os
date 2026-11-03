import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beginnerClimateKey, beginnerPriorities, currentBeginnerClimate, loadBeginnerClimate, readBeginnerClimate, verifiedBeginnerClimate } from '../lib/beginner-climate.ts';
import { summarizeClimate } from '../lib/planting-location.ts';

const climate = {version:1,zip:'60544',place:'Plainfield, Illinois',zone:'6a',timezone:'America/Chicago',lastSpringFrost:'04-28',firstFallFrost:'10-14',meanHigh:[31,36,48,61,72,81,85,83,76,63,48,36],meanLow:[17,21,31,41,52,62,66,64,55,43,32,22],years:15,frostYears:15,startYear:2011,endYear:2025,forecast:[],resolvedAt:'2026-10-17T10:00:00Z'};
const response = value => Response.json(value);
test('beginner location bridges city to ZIP and keeps zone when frost lookup fails', async () => {
  const calls=[];
  const fake=async(path,options)=>{calls.push([path,JSON.parse(options.body)]);return path.includes('garden-zone')?response({zone:'6a',zip:'60544',place:'Plainfield, IL'}):response(climate);};
  const result=await loadBeginnerClimate(' Plainfield, IL ',new AbortController().signal,fake);
  assert.equal(result.climate.lastSpringFrost,'04-28');
  assert.deepEqual(calls,[['/api/garden-zone',{location:'Plainfield, IL'}],['/api/planting-location',{zip:'60544'}]]);
  const unavailable=await loadBeginnerClimate('60544',new AbortController().signal,async path=>path.includes('garden-zone')?response({zone:'6a',zip:'60544',place:'Plainfield'}):Response.json({error:'Historical service unavailable'},{status:502}));
  assert.equal(unavailable.zone.zone,'6a');assert.equal(unavailable.climate,undefined);assert.match(unavailable.error,/unavailable/);
});
test('invalid source outcomes and mismatched locations never become frost estimates',async()=>{
  await assert.rejects(loadBeginnerClimate('Paris',new AbortController().signal,async()=>Response.json({error:'Use a U.S. location'},{status:400})),/U.S./);
  await assert.rejects(loadBeginnerClimate('60544',new AbortController().signal,async()=>response({zone:'0x',zip:'60544',place:'Unknown'})),/verified/);
  const mismatch=await loadBeginnerClimate('60544',new AbortController().signal,async path=>path.includes('garden-zone')?response({zone:'6a',zip:'60544',place:'Plainfield'}):response({...climate,zip:'10001'}));
  assert.equal(mismatch.climate,undefined);assert.match(mismatch.error,/verified/);
  assert.equal(verifiedBeginnerClimate({...climate,startYear:undefined}),false);
  assert.equal(verifiedBeginnerClimate({...climate,lastSpringFrost:'08-01'}),false);
});
test('cache is scoped to account, garden and saved location; stale forecasts are removed',()=>{
  const key=beginnerClimateKey('guest','garden-1','60544');
  assert.notEqual(key,beginnerClimateKey('member','garden-1','60544'));
  assert.notEqual(key,beginnerClimateKey('guest','garden-2','60544'));
  assert.notEqual(key,beginnerClimateKey('guest','garden-1','10001'));
  const raw=JSON.stringify({location:'Plainfield, IL',climate});
  assert.ok(readBeginnerClimate(raw,'plainfield, il'));
  assert.equal(readBeginnerClimate(raw,'Chicago, IL'),null);
  assert.equal(readBeginnerClimate('{broken',''),null);
  const withForecast={...climate,forecast:[{date:'2026-10-18',min:31,max:60}]};
  assert.equal(currentBeginnerClimate(withForecast,new Date('2026-10-17T12:00:00Z')).forecast.length,1);
  assert.equal(currentBeginnerClimate(withForecast,new Date('2026-10-18T12:00:00Z')).forecast.length,0);
});
test('priorities distinguish early spring, short autumn window, winter and irregular frost',()=>{
  assert.match(beginnerPriorities(climate,'2026-03-10').title,/Prepare now/);
  assert.match(beginnerPriorities(climate,'2026-09-10').title,/Time is getting short/);
  assert.match(beginnerPriorities(climate,'2026-11-03').title,/next growing season/);
  assert.ok(beginnerPriorities(climate,'2026-06-01','flowers').suggestions.every(a=>a.crop.kind==='Flower'));
  assert.ok(beginnerPriorities(climate,'2026-06-01','food').suggestions.every(a=>a.crop.kind!=='Flower'));
  const mild={...climate,lastSpringFrost:null,firstFallFrost:null,frostYears:0};
  assert.match(beginnerPriorities(mild,'2026-11-03').title,/not a fixed frost/);
  assert.equal(verifiedBeginnerClimate(mild),true);
});
test('historical source uses later spring and earlier fall percentiles, independently of zone',()=>{
  const daily={time:[],temperature_2m_min:[],temperature_2m_max:[]};
  for(let y=2011;y<=2025;y++)for(let date=new Date(`${y}-01-01T12:00:00Z`);date.getUTCFullYear()===y;date.setUTCDate(date.getUTCDate()+1)){
    const day=date.toISOString().slice(0,10),md=day.slice(5),n=y-2010;
    daily.time.push(day);daily.temperature_2m_min.push(md<=`04-${String(n).padStart(2,'0')}`||md>=`10-${String(n).padStart(2,'0')}`?30:60);daily.temperature_2m_max.push(70);
  }
  const summary=summarizeClimate(daily,2011,2025);
  assert.equal(summary.lastSpringFrost,'04-12');assert.equal(summary.firstFallFrost,'10-03');
});
test('beginner panel has no GPS access or calendar fallback and helper location remains optional',()=>{
  const panel=readFileSync(new URL('../components/BeginnerClimate.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(panel,/navigator\.geolocation|navigator\.permissions|calendarDefaults/);
  assert.match(panel,/City and state or ZIP code \(optional\)/);
  assert.match(panel,/80th percentile/);assert.match(panel,/20th percentile/);
  const learning=readFileSync(new URL('../components/GardenLearning.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(learning,/input required.*location|not been used to calculate frost/);
});
