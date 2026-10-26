import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGardenLocation,resolveGardenZone} from '../lib/planting-location.ts';
test('garden location accepts ZIP, ZIP+4 and city/state while rejecting ambiguous and injected input',()=>{
 assert.equal(parseGardenLocation(' 60544-1234 '),'60544');assert.equal(parseGardenLocation('Plainfield, IL'),'Plainfield, IL');
 for(const input of ['Plainfield','6054',"60544' OR 1=1",'https://localhost/test','Paris',null,'x'.repeat(201)])assert.throws(()=>parseGardenLocation(input));
});
test('ZIP zone lookup requires an exact USDA ZIP match and avoids weather-history requests',async()=>{
 const calls=[];const fetcher=async url=>{calls.push(String(url));return Response.json({features:[{attributes:{ZIP_CODE:'99999',Class:'9b'}},{attributes:{ZIP_CODE:'60544',Class:'6a (-10 to -5 °F)'}}]});};
 assert.deepEqual(await resolveGardenZone('60544',fetcher),{zone:'6a',zip:'60544',place:'60544'});assert.equal(calls.length,1);assert.match(calls[0],/PHZM_2023_Zip_Code_Table/);
 await assert.rejects(resolveGardenZone('60544',async()=>Response.json({features:[{attributes:{ZIP_CODE:'99999',Class:'6a'}}]})),/verified USDA/);
});
test('city/state resolves a U.S. postal code before requesting a zone, with no country guessing',async()=>{
 const fetcher=async url=>{const u=new URL(url);return Response.json(u.pathname.endsWith('findAddressCandidates')?{candidates:[{score:100,attributes:{Country:'USA',City:'Plainfield',RegionAbbr:'IL'},location:{x:-88.2,y:41.6}}]}:u.pathname.endsWith('reverseGeocode')?{address:{CountryCode:'USA',Postal:'60544'}}:{features:[{attributes:{ZIP_CODE:'60544',Class:'6a'}}]});};
 assert.deepEqual(await resolveGardenZone('Plainfield, IL',fetcher),{zone:'6a',zip:'60544',place:'Plainfield, IL'});
 await assert.rejects(resolveGardenZone('Paris, France',async()=>Response.json({candidates:[{score:100,attributes:{Country:'FRA'}}]})),/confidently match/);
 await assert.rejects(resolveGardenZone('Springfield, IL',async()=>Response.json({candidates:[{score:80,attributes:{Country:'USA'}}]})),/confidently match/);
});
