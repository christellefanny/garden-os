import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {wallStyles,wallArt} from '../lib/wall-art.ts';
import {rotateItem} from '../lib/layout-design.ts';
test('wall rotation keeps finish and record links, rotates curved artwork fully and stays in bounds',()=>{
 const original={id:'wall-1',name:'Curved wall',kind:'Wall',wallStyle:'curved-stone',x:80,y:70,w:20,h:10,spaceId:''};let current=original;
 for(let turn=1;turn<=4;turn++){current=rotateItem(current);assert.equal(current.wallRotation,turn*90%360);assert.equal(current.wallStyle,'curved-stone');assert.equal(current.spaceId,'');assert.ok(current.x>=0&&current.x+current.w<=100&&current.y>=0&&current.y+current.h<=100);}
 assert.equal(current.w,original.w);assert.equal(current.h,original.h);assert.equal(rotateItem({...original,kind:'Bed'}).wallRotation,undefined);
});
test('five wall choices have original transparent raster assets and safe style fallbacks',async()=>{
 assert.equal(wallStyles.length,5);assert.equal(new Set(wallStyles.map(s=>s.src)).size,5);
 for(const style of wallStyles){const meta=await sharp(await readFile(new URL('../public'+style.src,import.meta.url))).metadata();assert.equal(meta.format,'webp');assert.ok(meta.hasAlpha);assert.ok(meta.width>=800);}
 assert.equal(wallArt('https://example.com/x.png').id,'retaining');
});
