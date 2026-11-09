import {test} from 'node:test';
import assert from 'node:assert/strict';
import {duplicateLayoutItem,duplicateDecoration,decorationAppearance,safeDecorations,rotateItem,designPlants} from '../lib/layout-design.ts';
const base={id:'original',name:'My bed',kind:'Bed',x:76,y:76,w:24,h:24,spaceId:'actual-space',color:'#abcdef',decorations:[{id:'flower',plantId:'marigold',x:88,y:88},{id:'custom',plantId:'custom',customName:'Lemon verbena',customGroup:'Herbs',x:50,y:50}]};
test('all shapes copy styles and plants with fresh IDs and no real-record links',()=>{
 let n=0;for(const kind of ['Bed','Container','Path','Border','Wall']){
 const source={...structuredClone(base),kind,containerStyle:'urn',wallStyle:'curved-stone',wallRotation:90,groundCover:'gravel'},snapshot=structuredClone(source),copy=duplicateLayoutItem(source,[source],()=>`copy-${++n}`);
 assert.deepEqual(source,snapshot);assert.notEqual(copy.id,source.id);assert.equal(copy.name,'My bed (copy)');assert.equal(copy.spaceId,'');
 for(const f of ['kind','color','containerStyle','wallStyle','wallRotation','groundCover','w','h'])assert.equal(copy[f],source[f]);
 assert.ok(copy.x>=0&&copy.y>=0&&copy.x+copy.w<=100&&copy.y+copy.h<=100);assert.notDeepEqual([copy.x,copy.y],[source.x,source.y]);
 for(let i=0;i<source.decorations.length;i++){assert.notEqual(copy.decorations[i].id,source.decorations[i].id);assert.deepEqual({...copy.decorations[i],id:source.decorations[i].id},source.decorations[i]);}copy.decorations[0].x=12;assert.deepEqual(source,snapshot);
 }
});
test('repeated copies have unique names and positions even at edges',()=>{
 const items=[base];for(let i=0;i<15;i++)items.push(duplicateLayoutItem(base,items,()=>String(i)));
 assert.equal(new Set(items.map(i=>i.name)).size,16);assert.equal(new Set(items.map(i=>`${i.x},${i.y}`)).size,16);assert.equal(duplicateLayoutItem(items[1],items).name,'My bed (copy 16)');
 const huge={...base,w:100,h:100,x:0,y:0,name:'a'.repeat(100)},copy=duplicateLayoutItem(huge,[huge]);assert.equal(copy.name.length,100);assert.equal(copy.x,0);assert.equal(copy.y,0);
});
test('vegetable, flower and custom copies preserve source metadata and remain movable independently',()=>{
 for(const plant of [...base.decorations,{id:'tomato',plantId:'tomato',x:12,y:12}]){const original=structuredClone(plant),siblings=[plant];for(let n=0;n<10;n++)siblings.push(duplicateDecoration(plant,siblings,()=>String(n)));assert.deepEqual(plant,original);assert.equal(new Set(siblings.map(p=>`${p.x},${p.y}`)).size,11);for(const copy of siblings.slice(1)){assert.notEqual(copy.id,plant.id);assert.equal(copy.plantId,plant.plantId);assert.equal(copy.customName,plant.customName);assert.equal(copy.customGroup,plant.customGroup);assert.ok(copy.x>=12&&copy.x<=88&&copy.y>=12&&copy.y<=88);}}
});
test('custom markers survive serialization and rotation and reject malformed metadata',()=>{
 const custom=base.decorations[1];assert.deepEqual(safeDecorations([JSON.parse(JSON.stringify(custom))]),[custom]);assert.deepEqual(decorationAppearance(custom),{name:'Lemon verbena',group:'Herbs'});
 for(const patch of [{customName:''},{customName:'   '},{customName:7},{customName:'a'.repeat(81)},{customGroup:'invalid'},{customGroup:undefined},{x:Infinity},{y:-1}])assert.deepEqual(safeDecorations([{...custom,...patch}]),[]);
 assert.deepEqual(rotateItem({...base,decorations:[{...custom,x:20,y:30}]}).decorations[0],{...custom,x:70,y:20});assert.equal(designPlants.find(p=>p.id==='marigold').group,'Flowers');
});
