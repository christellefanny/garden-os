import {test} from 'node:test';
import assert from 'node:assert/strict';
import {learningProgressKey,parseLearningChecks,saveLearningCheck} from '../lib/learning-progress.ts';
const fixture=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('learning progress is isolated between guest and individual accounts',()=>{
 const storage=fixture();
 saveLearningCheck(storage,'guest','space:0',true);
 saveLearningCheck(storage,'account-a','space:1',true);
 assert.deepEqual(parseLearningChecks(storage.getItem(learningProgressKey('guest'))),{'space:0':true});
 assert.deepEqual(parseLearningChecks(storage.getItem(learningProgressKey('account-a'))),{'space:1':true});
 assert.deepEqual(parseLearningChecks(storage.getItem(learningProgressKey('account-b'))),{});
 assert.notEqual(learningProgressKey('a/b'),learningProgressKey('a%2Fb'));
});
test('learning progress preserves other checklist choices and allows unchecking',()=>{
 const storage=fixture();
 saveLearningCheck(storage,'guest','space:0',true);
 saveLearningCheck(storage,'guest','timing:0',true);
 saveLearningCheck(storage,'guest','space:0',false);
 assert.deepEqual(parseLearningChecks(storage.getItem(learningProgressKey('guest'))),{'space:0':false,'timing:0':true});
});
test('invalid saved progress is reported and never overwritten',()=>{
 for(const raw of ['bad json','null','[]','{"space:0":"yes"}','{"unexpected":true}','{"__proto__":true}']){
  const storage=fixture();storage.setItem(learningProgressKey('guest'),raw);
  assert.throws(()=>saveLearningCheck(storage,'guest','space:0',true));
  assert.equal(storage.getItem(learningProgressKey('guest')),raw);
 }
});
test('storage failure and unknown checklist keys cannot report a successful save',()=>{
 const storage=fixture();
 assert.throws(()=>saveLearningCheck(storage,'guest','missing:0',true));
 assert.equal(storage.data.size,0);
 assert.throws(()=>saveLearningCheck({getItem:()=>null,setItem:()=>{throw Error('QuotaExceededError');}},'guest','space:0',true));
});
