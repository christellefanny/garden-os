import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
import * as visuals from '../lib/flower-care-visuals.ts';
import {careArtwork} from '../lib/flower-care-art.ts';
const require=createRequire(import.meta.url),exports={};
const source=readFileSync(new URL('../components/IllustratedCareTechniques.tsx',import.meta.url),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,require:id=>id==='@/lib/flower-care-visuals'?visuals:id==='@/lib/flower-care-art'?{careArtwork}:id==='next/image'?{__esModule:true,default:(props)=>{const native={...props};delete native.quality;delete native.sizes;return React.createElement('img',native)}}:require(id)});
test('every profile has3 inline visual explanations retaining exact species instructions',()=>{
 for(const profile of flowerCornerProfiles){const html=renderToStaticMarkup(React.createElement(exports.PlantCareIllustrations,{profile}));
  assert.equal((html.match(/<img/g)||[]).length,3,profile.id);assert.equal((html.match(/Illustrated example:/g)||[]).length,3);assert.ok(!html.includes('<svg'));
  for(const field of ['pinching','deadheading','cutback'])assert.ok(html.includes(renderToStaticMarkup(React.createElement('span',null,profile[field])).slice(6,-7)),`${profile.id} ${field}`);
  assert.match(html,/Watercolor examples/);assert.match(html,/timing and cultivar matter/);
 }
});
test('bulbs,crowns,single-stem flowers and ferns never receive blanket pinch diagrams',()=>{
 for(const id of ['daffodils','tulips','ornamental-alliums','hosta','heuchera','sunflowers','statice','japanese-painted-fern','autumn-fern','bleeding-heart'])assert.equal(visuals.careVisualMode(id,'pinching'),'leave-intact',id);
 for(const id of ['daffodils','tulips','ornamental-alliums'])assert.equal(visuals.careVisualMode(id,'cutback'),'bulb');
 assert.equal(visuals.careVisualMode('hydrangeas','cutback'),'woody');
 assert.equal(visuals.careVisualMode('coleus','pinching'),'pinch');
 assert.equal(visuals.careVisualMode('catmint','cutback'),'trim');
 for(const id of ['japanese-painted-fern','autumn-fern'])assert.equal(visuals.careVisualMode(id,'deadheading'),'leave-intact');
});
test('general technique popup uses3 accessible watercolor examples, not a decorative hero',()=>{
 const html=renderToStaticMarkup(React.createElement(exports.default));assert.equal((html.match(/<img/g)||[]).length,3);assert.match(html,/dahlias/);assert.match(html,/single-stem sunflowers/);assert.match(html,/Catmint/);assert.match(html,/species-specific text/);
});

test('all care modes have original accessible botanical artwork',()=>{
 const modes=['pinch','leave-intact','deadhead','selective','trim','dormant','bulb','woody','bulb-flower','flower-stalk','flower-spike'];
 assert.deepEqual(Object.keys(careArtwork).sort(),modes.sort());
 for(const [mode,art] of Object.entries(careArtwork)){
  assert.ok(art.width>=1000&&art.height>=1000,mode);
  assert.ok(art.alt.length>30&&art.example.length>3,mode);
  const bytes=readFileSync(new URL('../public'+art.src,import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
 }
});
