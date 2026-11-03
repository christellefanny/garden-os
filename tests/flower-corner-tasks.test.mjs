import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const require=createRequire(import.meta.url);
function mount({id=null,session=null,error=null}={}) {
 const effects=[],updates=[],writes=[];let subscriptionCallback;let unsubscribed=false;
 const exports={};let index=0;
 const js=ts.transpileModule(read('components/FlowerCornerTasks.tsx'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 vm.runInNewContext(js,{exports,localStorage:{setItem:(...args)=>writes.push(args)},require:name=>{
  if(name==='react')return {...React,useState:()=>{const n=index++;return[n===0?id:false,value=>updates.push([n,value])];},useEffect:fn=>effects.push(fn)};
  if(name==='@/lib/supabase')return {supabase:{auth:{getSession:async()=>({data:{session},error}),onAuthStateChange:fn=>{subscriptionCallback=fn;return{data:{subscription:{unsubscribe:()=>{unsubscribed=true}}}};}}}};
  if(name.startsWith('@/components/'))return name;
  return require(name);
 }});
 const tree=exports.default();
 return {tree,effects,updates,writes,notify:(...args)=>subscriptionCallback(...args),unsubscribed:()=>unsubscribed};
}
test('public route layout has one persistent task control across every guide, workspace remains single',()=>{
 assert.match(read('app/flower-corner/layout.tsx'),/<FlowerCornerTasks \/>/);
 assert.match(read('components/GardenWorkspace.tsx'),/<AddTaskButton userId=\{userId\} floating/);
 assert.doesNotMatch(read('components/FlowerCorner.tsx'),/FlowerCornerTasks|AddTaskButton/);
});
test('public task control waits for auth, uses signed-in identity and cleans up listener',async()=>{
 const m=mount({session:{user:{id:'account-123'}}});const cleanup=m.effects[0]();await Promise.resolve();
 assert.deepEqual(m.updates,[[0,'account-123']]);assert.equal(m.writes.length,0);
 cleanup();assert.equal(m.unsubscribed(),true);
});
test('auth changes supersede a stale initial result; auth errors do not silently save as guest',async()=>{
 const m=mount({session:{user:{id:'old-account'}}});m.effects[0]();m.notify('SIGNED_OUT',null);await Promise.resolve();
 assert.deepEqual(m.updates,[[0,'guest'],[1,false]]);
 const bad=mount({error:{message:'unavailable'}});bad.effects[0]();await Promise.resolve();assert.deepEqual(bad.updates,[[1,true]]);
});
test('guest save reuses existing calendar form and only then activates guest return',()=>{
 const m=mount({id:'guest'});assert.equal(m.tree.type,'@/components/CloudDataBoundary');assert.equal(m.tree.props.userId,'guest');
 const button=m.tree.props.children;assert.equal(button.type,'@/components/AddTaskButton');assert.equal(button.props.floating,true);
 assert.equal(m.writes.length,0);button.props.onSaved();assert.deepEqual(m.writes,[['garden-os-guest-active','true']]);
 const signed=mount({id:'account-123'});signed.tree.props.children.props.onSaved();assert.equal(signed.writes.length,0);
});
test('task persistence and cancellation remain the existing unrestricted form',()=>{
 const source=read('components/AddTaskButton.tsx');assert.match(source,/garden-os-calendar-\$\{userId\}/);assert.match(source,/plantId:""/);
 assert.match(source,/onClick=\{\(\)=>setOpen\(false\)\}>Cancel/);assert.match(source,/onClose=\{\(\)=>setOpen\(false\)\}/);
 assert.doesNotMatch(read('components/FlowerCornerTasks.tsx'),/garden-os-calendar-|crypto\.randomUUID|photoUrl|readGuest/);
});
