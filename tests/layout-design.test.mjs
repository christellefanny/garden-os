import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {instantiateLayout,layoutTemplates,designPlants,rotateItem,safeDecorations,groundCovers,surfaceAppearance,plantStampStyle,gardenFootprint} from '../lib/layout-design.ts';
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

test('courtyard entrance is unobstructed and the path reaches the front edge',()=>{
 const courtyard=layoutTemplates.find(t=>t.id==='courtyard');const pots=courtyard.items.filter(i=>i.kind==='Container');assert.equal(pots.length,5);
 assert.ok(pots.every(p=>p.y+p.h<=80||p.x+p.w<=46||p.x>=54),'Front-center entrance must not contain a pot');
 const path=courtyard.items.find(i=>i.kind==='Path');assert.equal(path.y+path.h,100);
});

test('ground covers use only three approved texture assets and ignore invalid saved values',()=>{
 assert.equal(groundCovers.length,3);assert.deepEqual(surfaceAppearance('https://untrusted.example/image'),{});assert.deepEqual(surfaceAppearance(undefined),{});
 for(const cover of groundCovers){assert.ok(surfaceAppearance(cover.id).backgroundImage.includes(cover.src));const bytes=readFileSync(new URL(`../public${cover.src}`,import.meta.url));assert.equal(bytes.toString('ascii',8,12),'WEBP');}
});
test('thin horizontal and vertical shapes render square botanical stamps with a readable minimum',()=>{
 for(const item of [{x:10,y:1,w:80,h:4},{x:1,y:10,w:4,h:80},{x:10,y:10,w:30,h:30}]){const style=plantStampStyle(item,{x:50,y:50});assert.equal(style.width,style.height);assert.match(style.width,/clamp\(44px, (8|12)cqw, 112px\)/);assert.match(style.left,/clamp/);assert.match(style.top,/clamp/);}
});

test('rotating a planted border turns its illustrations along the new long axis',()=>{
 const border={x:10,y:20,w:80,h:4,decorations:[{id:'one',plantId:'dahlia',x:20,y:50},{id:'two',plantId:'alyssum',x:80,y:50}]};
 let turned=rotateItem(border);assert.deepEqual(turned.decorations.map(p=>[p.x,p.y]),[[50,20],[50,80]]);
 for(let i=0;i<3;i++)turned=rotateItem(turned);assert.deepEqual(turned.decorations,border.decorations);assert.equal(turned.w,border.w);assert.equal(turned.h,border.h);
});

 test('ground footprint closes missing borders and excludes entrance paths',()=>{
 const shapes=[{kind:'Border',x:3,y:2,w:65,h:4},{kind:'Border',x:2,y:7,w:4,h:55},{kind:'Border',x:65,y:7,w:4,h:55},{kind:'Path',x:30,y:40,w:8,h:60}];
 assert.deepEqual(gardenFootprint(shapes),{left:'2%',top:'2%',width:'67%',height:'60%'});
 assert.deepEqual(gardenFootprint([{kind:'Bed',x:20,y:20,w:30,h:40}]),{left:'20%',top:'20%',width:'30%',height:'40%'});
 assert.equal(gardenFootprint([]),null);
 assert.deepEqual(gardenFootprint([{kind:'Path',x:10,y:10,w:10,h:40}]),{left:'10%',top:'10%',width:'10%',height:'40%'});
 assert.deepEqual(gardenFootprint([{kind:'Bed',x:-5,y:5,w:110,h:100},{kind:'Border',x:NaN,y:0,w:5,h:5}]),{left:'0%',top:'5%',width:'100%',height:'95%'});
 });
