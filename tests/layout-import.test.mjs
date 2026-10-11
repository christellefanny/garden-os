import assert from "node:assert/strict";
import {test} from "node:test";
import {initialLayout,layoutSpaceDrafts} from "../lib/garden-layout.ts";
test("submitted layout creates six named spaces without peppers or invented dimensions",()=>{
 const drafts=layoutSpaceDrafts(initialLayout,[]);
 assert.deepEqual(drafts.map(d=>d.name),["Flowers","Herbs","Garlic","Okra","Tomatoes (1)","Tomatoes (2)"]);
 for(const draft of drafts){assert.equal(draft.length_feet,null);assert.equal(draft.width_feet,null);assert.equal(draft.depth_feet,null);assert.deepEqual(JSON.parse(draft.notes).plants,[]);}
 assert.match(drafts.find(d=>d.name==="Garlic").notes,/broccoli/);
 const saved=drafts.map((d,i)=>({...d,id:String(i)}));
 assert.deepEqual(layoutSpaceDrafts(initialLayout,saved),[]);
 assert.equal(layoutSpaceDrafts(initialLayout,[{id:"existing",name:"Tomatoes",notes:"keep my notes"}]).filter(d=>d.name.startsWith("Tomatoes")).length,1);
});
test("layout conversion uses saved edits and preserves planting notes",()=>{
 const bed={...initialLayout[2],name:"My Garlic",plants:[{id:"p",name:"Garlic",variety:"Music",quantity:"30",notes:"Fall planting"}]};
 const [draft]=layoutSpaceDrafts([bed],[]);
 assert.equal(draft.name,"My Garlic");assert.match(JSON.parse(draft.notes).notes,/Music · 30 — Fall planting/);
});
