import assert from "node:assert/strict";
import {test} from "node:test";
import {initialLayout,layoutSpaceDrafts,nineBedLayout,linkedLayoutSpaces} from "../lib/garden-layout.ts";
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

test("layout restores nine original beds while retaining their edits",()=>{
 const saved=[...initialLayout.map(b=>({...b})),...[1,2,3].map(n=>({id:`bed-${n}`,name:"New Bed"}))];saved[2].notes="My saved garlic notes";
 const beds=nineBedLayout(saved);assert.equal(beds.length,9);assert.equal(beds[2].notes,"My saved garlic notes");assert.equal(beds.some(b=>b.name==="New Bed"),false);
});
test("space links prioritize imported IDs and explicit choices with separate tomato beds",()=>{
 const spaces=layoutSpaceDrafts(initialLayout,[]).map((draft,i)=>({...draft,id:String(i)}));spaces[2].name="Renamed garlic space";
 let links=linkedLayoutSpaces(initialLayout,spaces);assert.equal(links.get("garlic").id,spaces[2].id);assert.notEqual(links.get("tomatoes-left").id,links.get("tomatoes-middle").id);
 const custom={id:"custom",name:"My pepper bed",notes:null};links=linkedLayoutSpaces(initialLayout.map(b=>b.id==="green-peppers"?{...b,spaceId:"custom"}:b),[...spaces,custom]);assert.equal(links.get("green-peppers").id,"custom");
});
