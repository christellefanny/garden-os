import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePhotoAnalysis,photoLayoutDraft,validAnalysisImage,photoQuota} from '../lib/photo-layout.ts';
const sample={summary:'Two beds and an open walkway.',notes:['Check the obscured corner.'],areas:[{name:'Left bed',kind:'Bed',x:10,y:20,w:25,h:50},{name:'Path',kind:'Path',x:45,y:0,w:10,h:100}]};
test('photo drafts get new unlinked identities and never carry model-supplied plant or space records',()=>{
 let n=0;const original=JSON.stringify(sample),a=photoLayoutDraft({...sample,areas:sample.areas.map(a=>({...a,id:'provider-id',spaceId:'real-space',decorations:[{plantId:'wrong'}]}))},' My garden ',{method:'photo',reviewedAt:'2026-10-27'},()=>`new-${++n}`);
 assert.equal(a.name,'My garden');assert.equal(a.items.length,2);assert.ok(a.items.every(i=>i.spaceId===''&&!('decorations' in i)&&i.id!=='provider-id'));assert.equal(new Set([a.id,...a.items.map(i=>i.id)]).size,3);assert.equal(JSON.stringify(sample),original);assert.throws(()=>photoLayoutDraft({...sample,areas:[]},'Name',undefined));
});
test('malformed and unsafe photo maps cannot enter the existing layout editor',()=>{
 for(const area of [null,{...sample.areas[0],x:-1},{...sample.areas[0],w:Infinity},{...sample.areas[0],h:3},{...sample.areas[0],x:90},{...sample.areas[0],kind:'Script'},{...sample.areas[0],name:''}])assert.throws(()=>parsePhotoAnalysis({...sample,areas:[area]}));
 assert.throws(()=>parsePhotoAnalysis({...sample,areas:Array(31).fill(sample.areas[0])}));assert.throws(()=>parsePhotoAnalysis({...sample,notes:[null]}));assert.throws(()=>parsePhotoAnalysis({summary:'No map'}));assert.deepEqual(parsePhotoAnalysis({...sample,areas:[]}).areas,[]);
});
test('photo input accepts inline raster data only; external URLs, SVG and oversized data never reach the model',()=>{
 assert.ok(validAnalysisImage('data:image/jpeg;base64,aGVsbG8='));
 for(const input of ['https://example.com/private-photo','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,not base64',null,'data:image/png;base64,'+'A'.repeat(1400000)])assert.equal(validAnalysisImage(input),false);
});
test('daily scan reservations enforce a cooldown and five-scan cap',()=>{
 assert.deepEqual(photoQuota(null,50000),{count:1,lastAt:50000});assert.throws(()=>photoQuota({count:1,lastAt:49999},50000),/wait/);assert.throws(()=>photoQuota({count:5,lastAt:1},50000),/five/);assert.deepEqual(photoQuota({count:4,lastAt:1},50000),{count:5,lastAt:50000});
});
