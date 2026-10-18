import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {instantiateLayout,layoutTemplates,designPlants,rotateItem,safeDecorations} from '../lib/layout-design.ts';
test('inspiration copies get independent identities, unlinked beds, and no plant records',()=>{
 let n=0;const uuid=()=>`copy-${++n}`;const before=JSON.stringify(layoutTemplates);
 const a=instantiateLayout(layoutTemplates[0],'My garden',uuid),b=instantiateLayout(layoutTemplates[0],'Another garden',uuid);
 assert.notEqual(a.id,b.id);assert.equal(new Set([...a.items,...b.items].map(i=>i.id)).size,a.items.length+b.items.length);
 assert.ok(a.items.every(i=>i.spaceId===''&&!('plants' in i)));
 a.items[2].decorations[0].x=88;a.items[2].name='Changed';assert.equal(JSON.stringify(layoutTemplates),before);assert.notEqual(a.items[2].decorations[0].id,b.items[2].decorations[0].id);
 assert.deepEqual(instantiateLayout(undefined,'Empty',uuid).items,[]);
});
test('all template objects fit the canvas and three templates offer different arrangements',()=>{
 assert.equal(layoutTemplates.length,3);assert.equal(new Set(layoutTemplates.map(t=>t.image)).size,3);
 for(const t of layoutTemplates)for(const i of t.items){assert.ok(i.x>=0&&i.y>=0&&i.x+i.w<=100&&i.y+i.h<=100);assert.ok(i.w>=4&&i.h>=4);assert.ok(safeDecorations(i.decorations).every(d=>designPlants.some(p=>p.id===d.plantId)));}
});
test('quarter-turn swaps path dimensions, keeps the center where possible and stays within edges',()=>{
 const p={id:'path',x:20,y:30,w:55,h:8};let turned=rotateItem(p);assert.equal(turned.w,8);assert.equal(turned.h,55);assert.equal(turned.x+turned.w/2,p.x+p.w/2);assert.equal(turned.y+turned.h/2,p.y+p.h/2);assert.deepEqual(rotateItem(turned),p);
 for(const x of [0,45])for(const y of [0,92]){const q=rotateItem({...p,x,y});assert.ok(q.x>=0&&q.y>=0&&q.x+q.w<=100&&q.y+q.h<=100);}
});
test('decorations filter unknown plant assets and malformed placement without changing valid data',()=>{
 const good={id:'art',plantId:'tomato',x:25,y:50};assert.deepEqual(safeDecorations([good,{...good,plantId:'unknown'},{...good,x:-1},{...good,y:NaN},null]),[good]);assert.deepEqual(safeDecorations(null),[]);
});
test('plant library has 13 vegetables and 6 flowers with real distinct illustrated assets',()=>{
 assert.equal(designPlants.filter(p=>p.group==='Vegetables').length,13);assert.equal(designPlants.filter(p=>p.group==='Flowers').length,6);assert.equal(new Set(designPlants.map(p=>p.src)).size,19);
 for(const p of designPlants){const bytes=readFileSync(new URL(`../public${p.src}`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
});
