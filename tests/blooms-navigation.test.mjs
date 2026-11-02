import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { destinations, navigationDestinations } from '../lib/navigation.ts';
const require=createRequire(import.meta.url);
const source=name=>readFileSync(new URL('../components/'+name+'.tsx',import.meta.url),'utf8');
function component(name,exportName='default'){
 let input=source(name);
 if(name==='ConservatoryUI')input=input.split('export function ConservatoryTopbar')[0];
 const js=ts.transpileModule(input,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};
 vm.runInNewContext(js,{exports,require:id=>id==='next/image'?({src,alt})=>React.createElement('img',{src,alt}):id==='@/lib/navigation'?{destinations,navigationDestinations}:id.startsWith('@/')?{}:require(id)});
 return exports[exportName];
}
const Navigation=component('ConservatoryUI','ConservatoryNavigation');
const Collection=component('GardenCollection');
for(const guest of [false,true])test(`navigation order and active parent for ${guest?'guest':'account'}`,()=>{
 const nav=navigationDestinations(guest);
 assert.equal(nav[nav.indexOf('My Gardens')+1],'Beginner’s Guide');
 assert.equal(nav[nav.indexOf('Tasks')-1],'Flower Library');
 assert.equal(nav.includes('Plant Vault'),!guest);
 assert.ok(!nav.includes('Flower Garden'));
 const html=renderToStaticMarkup(React.createElement(Navigation,{guest,page:'Flower Garden',navigate:()=>{},onSignOut:()=>{}}));
 assert.doesNotMatch(html,/The Flower Library|My Gardens sections|>Flower Garden</);
 assert.match(html,/aria-current="page"[^>]*>[\s\S]*?<span>My Gardens<\/span>/);
});
for(const gardens of [[],[{garden:{id:'kept',name:'Flower Garden',year:2027,location:'Test',hardiness_zone:'5b'},spaces:2,plants:3}]])
 test(`My Gardens includes Blooms with ${gardens.length} stored gardens, without changing their names/counts`,()=>{
 const props={gardens,detail:false,disabled:false,onNew:()=>{},onOpen:()=>{},onBlooms:()=>{}};
 const html=renderToStaticMarkup(React.createElement(Collection,props));
 assert.ok(html.indexOf('<h1>My Gardens</h1>')<html.indexOf('id="blooms-entry-title"'));
 assert.match(html,/>Blooms<\/h2>/);assert.match(html,/Open Blooms/);
 assert.match(html,/Flower Collection/);
 if(gardens.length){assert.match(html,/garden-card-name">Flower Garden/);assert.match(html,/2 growing spaces/);}
 const detail=renderToStaticMarkup(React.createElement(Collection,{...props,detail:true}));
 assert.doesNotMatch(detail,/Open Blooms/);
});
test('rename keeps stable routes, stored flower component and collection labels',()=>{
 assert.ok(destinations.includes('Flower Garden'));
 assert.match(source('GardenWorkspace'),/page === "Flower Garden"[\s\S]*?Back to My Gardens[\s\S]*?<FlowersPage plants=\{vault\} userId=\{userId\}/);
 assert.match(source('FlowersPage'),/title="Blooms"/);
 assert.match(source('FlowersPage'),/"My flowers"/);
 assert.match(source('FlowersPage'),/Flower Collection/);
 assert.doesNotMatch(source('GardenLearning'),/The Flower Library|my Flower Garden/);
});
test('collection entry calls the Blooms action without creating or modifying a garden',()=>{
 let opened=0,created=0,changed=0;
 const tree=Collection({gardens:[],detail:false,disabled:false,onBlooms:()=>opened++,onNew:()=>created++,onOpen:()=>changed++});
 function find(node){
  if(!node||typeof node!=='object')return null;
  if(node.type==='button'&&node.props.children==='Open Blooms →')return node;
  for(const child of React.Children.toArray(node.props?.children)){const match=find(child);if(match)return match;}
  return null;
 }
 const entry=find(tree);assert.ok(entry);entry.props.onClick();
 assert.deepEqual({opened,created,changed},{opened:1,created:0,changed:0});
});
