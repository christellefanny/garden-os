import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readJournal, saveJournalEntry, journalKey} from '../lib/journal.ts';
import {guestStateKeys,mergeGuestValue} from '../lib/guest.ts';
function setup(){const values={};globalThis.localStorage=new Proxy(values,{get(t,k){if(k==='getItem')return k=>t[k]??null;if(k==='setItem')return(k,v)=>{t[k]=v;};return t[k];}});globalThis.window={dispatchEvent(){}};return values;}
const entry={id:'one',kind:'Note',date:'2026-10-25',text:'A good day in the garden.'};
test('standalone observations and stories survive reload, edit by ID and stay private per user',()=>{
 setup();saveJournalEntry('guest',entry);saveJournalEntry('guest',{...entry,id:'two',format:'story',title:'My garden plans'});saveJournalEntry('guest',{...entry,text:'Updated observation'});
 assert.equal(readJournal('guest').length,2);assert.equal(readJournal('guest').find(e=>e.id==='one').text,'Updated observation');assert.deepEqual(readJournal('another-user'),[]);
 assert.deepEqual(guestStateKeys(localStorage),[journalKey('guest')]);assert.equal(mergeGuestValue([entry],readJournal('guest')).length,2);
});
test('invalid existing writing and failed storage never get overwritten or report success',()=>{
 const values=setup();for(const raw of ['{broken','{}','[null]']){values[journalKey('guest')]=raw;assert.throws(()=>saveJournalEntry('guest',entry));assert.equal(values[journalKey('guest')],raw);}
 globalThis.localStorage={getItem(){return null;},setItem(){throw Error('Quota');}};assert.throws(()=>saveJournalEntry('guest',entry),/Quota/);
});
