import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {containerArt,containerStyles} from '../lib/container-art.ts';
import {parsePhotoAnalysis,photoLayoutDraft} from '../lib/photo-layout.ts';
test('eleven original vessel assets are distinct transparent raster illustrations with useful dimensions',async()=>{
 assert.equal(containerStyles.length,11);assert.equal(new Set(containerStyles.map(s=>s.id)).size,11);const hashes=new Set();
 for(const style of containerStyles){const bytes=await readFile(new URL('../public'+style.src,import.meta.url));hashes.add(createHash('sha256').update(bytes).digest('hex'));const meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');assert.ok(meta.hasAlpha);assert.ok(meta.width>=150&&meta.height>=150);assert.ok(style.w>=4&&style.h>=4);}
 assert.equal(hashes.size,11);assert.equal(containerArt(undefined).id,'terracotta');assert.equal(containerArt('https://example.com/').id,'terracotta');
});
test('photo-derived containers preserve approved vessel styles and ignore arbitrary art URLs',()=>{
 const analysis={summary:'Balcony',notes:[],areas:[{name:'Trough',kind:'Container',containerStyle:'trough',x:20,y:20,w:30,h:20},{name:'Unknown pot',kind:'Container',containerStyle:'https://example.com/',x:60,y:20,w:20,h:20}]};
 const checked=parsePhotoAnalysis(analysis);assert.equal(checked.areas[0].containerStyle,'trough');assert.equal(checked.areas[1].containerStyle,undefined);const saved=photoLayoutDraft(analysis,'My balcony',undefined);assert.equal(saved.items[0].containerStyle,'trough');assert.ok(saved.items.every(i=>i.spaceId===''));
});
