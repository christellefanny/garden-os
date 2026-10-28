import {test} from "node:test";
import assert from "node:assert/strict";
import {seedStartSuggestion} from "../lib/seed-start-reminder.ts";
import {calendarDefaults} from "../lib/growing-calendar.ts";
const seed = (notes, name="Bell pepper") => ({id:"seed",name,variety:"",category:"Vegetable",statuses:["Have Seeds"],source:"",year:"2026",notes});
test("packet windows use frost settings and roll past dates to the next spring",()=>{
 const p=seed("- When to sow: sow 1/4 inch deep indoors 6–8 weeks before last frost");
 assert.equal(seedStartSuggestion(p,calendarDefaults,"2026-10-21").date,"2027-03-27");
 assert.equal(seedStartSuggestion(p,{...calendarDefaults,lastFrost:"05-01"},"2026-10-21").date,"2027-03-13");
 assert.equal(seedStartSuggestion(p,calendarDefaults,"2027-03-27").date,"2027-03-27");
 assert.equal(seedStartSuggestion(p,calendarDefaults,"2027-03-28").date,"2028-03-27");
});
test("outdoor-relative instructions use a stated planting estimate",()=>{
 const p=seed("Start indoors 8 weeks before outdoor planting","Hot pepper");
 assert.equal(seedStartSuggestion(p,calendarDefaults,"2026-10-21").date,"2027-03-30");
 const cool=seed("Start indoors about 12 weeks before transplanting","Pansy");
 assert.equal(seedStartSuggestion(cool,calendarDefaults,"2026-10-21").date,"2027-01-30");
 const snow=seed("Start indoors 5–7 weeks before last frost for early harvest","Cauliflower");
 assert.equal(seedStartSuggestion(snow,calendarDefaults,"2026-10-21").date,"2027-04-03");
});
test("direct-sow seeds and unknown timings get no invented indoor date",()=>{
 for(const p of [
 seed("Direct sow in spring","Pea"),
 seed("Sow after frost","Winter squash"),
 seed("Details not supplied","Spinach"),
 seed("Start indoors 0 weeks before last frost"),
 ]) assert.equal(seedStartSuggestion(p,calendarDefaults,"2026-10-21"),null);
});

test("supported crops get dates without packet notes or Have Seeds status",()=>{
 const cabbage={...seed("", "Cabbage"),statuses:["Previously Grown","Not Growing Again"]};
 assert.equal(seedStartSuggestion(cabbage,calendarDefaults,"2026-10-22").date,"2027-03-13");
 assert.equal(seedStartSuggestion({...seed("Start indoors 6 weeks before last frost"),statuses:["Have Plant"]},calendarDefaults,"2026-10-22").date,"2027-04-03");
});
