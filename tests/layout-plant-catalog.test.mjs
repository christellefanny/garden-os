import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {designPlants,decorationAppearance,safeDecorations} from '../lib/layout-design.ts';
import {vegetableSoilProfiles} from '../lib/vegetable-soil.ts';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';

test('layout choices cover the vegetable and flower Library without duplicated IDs',()=>{
 assert.equal(designPlants.length,vegetableSoilProfiles.length+flowerCornerProfiles.length);
 assert.equal(new Set(designPlants.map(p=>p.id)).size,designPlants.length);
 for(const [group,profiles] of [['Vegetables',vegetableSoilProfiles],['Flowers',flowerCornerProfiles]]){
   assert.deepEqual(new Set(designPlants.filter(p=>p.group===group).map(p=>p.libraryId)),new Set(profiles.map(p=>p.id)));
 }
});
test('all referenced layout illustrations exist and sprite coordinates stay inside their plates',()=>{
 for(const p of designPlants){
  if(p.src){const bytes=readFileSync(new URL(`../public${p.src}`,import.meta.url));assert.ok(bytes.length>100);assert.ok(bytes.toString('ascii',8,12)==='WEBP'||bytes.subarray(1,4).toString()==='PNG',p.src);}
  if(p.sprite){assert.ok(p.src);assert.ok(p.sprite.columns>1);for(const coordinate of [p.sprite.row,p.sprite.column])assert.ok(Number.isInteger(coordinate)&&coordinate>=0&&coordinate<p.sprite.columns);}
 }
});
test('saved legacy plant IDs stay recognized and new Library choices round-trip',()=>{
 for(const id of ['tomato','pepper','lettuce','garlic','spinach','radish','kale','peas','beans','carrot','cucumber','broccoli','okra','dahlia','zinnia','cosmos','snapdragon','lisianthus','marigold','alyssum']) assert.ok(designPlants.some(p=>p.id===id),id);
 for(const plant of designPlants){const stamp={id:'saved',plantId:plant.id,x:50,y:50};assert.deepEqual(safeDecorations([stamp]),[stamp]);assert.equal(decorationAppearance(stamp).name,plant.name);assert.deepEqual(decorationAppearance(stamp).sprite,plant.sprite);}
});
test('unavailable portraits stay named markers, not substitutes or photographs',()=>{
 for(const name of ['Beet','Eggplant','Cabbage','Swiss Chard','Sweet corn']) assert.equal(designPlants.find(p=>p.name===name)?.src,undefined);
 assert.ok(designPlants.every(p=>!p.src?.includes('botanical-atlas-')));
 assert.notEqual(designPlants.find(p=>p.id==='violas').src,designPlants.find(p=>p.id==='pansies').src);
 assert.notEqual(designPlants.find(p=>p.id==='china-asters').src,designPlants.find(p=>p.id==='perennial-asters').src);
});
