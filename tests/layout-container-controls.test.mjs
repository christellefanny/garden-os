import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rotateItem,resizeItem,duplicateLayoutItem} from '../lib/layout-design.ts';
test('planter rotation preserves physical size and cycles through four orientations',()=>{
 for(const ratio of [1,1.5,.7]){
 const item={id:'pot',name:'Cedar planter',kind:'Container',x:30,y:30,w:32,h:18,spaceId:'',containerStyle:'wood'};
 let turned=rotateItem(item,ratio);
 assert.equal(turned.containerRotation,90);
 assert.ok(Math.abs(turned.w*ratio-item.h)<1e-9);
 assert.ok(Math.abs(turned.h-item.w*ratio)<1e-9);
 for(let n=0;n<3;n++)turned=rotateItem(turned,ratio);
 assert.equal(turned.containerRotation,0);assert.ok(Math.abs(turned.w-item.w)<1e-9);assert.ok(Math.abs(turned.h-item.h)<1e-9);
 assert.equal(duplicateLayoutItem({...item,containerRotation:90},[]).containerRotation,90);
 }
});
test('size controls scale uniformly without changing rotation and stay in canvas',()=>{
 const item={x:70,y:70,w:25,h:15,containerRotation:90};
 for(const factor of [.01,.8,1.15,100]){const result=resizeItem(item,factor);assert.ok(Math.abs(result.w/result.h-item.w/item.h)<1e-9);assert.equal(result.containerRotation,90);assert.ok(result.x>=0&&result.y>=0&&result.x+result.w<=100&&result.y+result.h<=100);assert.ok(result.w>=4&&result.h>=4);}
});
