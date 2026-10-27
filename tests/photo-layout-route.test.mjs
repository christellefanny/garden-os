import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {parsePhotoAnalysis,photoQuota,validAnalysisImage} from '../lib/photo-layout.ts';
const source=await readFile(new URL('../app/api/photo-layout/route.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import[^;]+from[^;]+;/g,line=>line.includes('reminders-server')?'const {authenticated}=globalThis.__photoRoute;':line.includes('photo-layout')?'const {parsePhotoAnalysis,photoQuota,validAnalysisImage}=globalThis.__photoRoute;':'const {generateText,jsonSchema,Output}=globalThis.__photoRoute;');
test('photo route authenticates, validates, reserves quotas and passes image/container intent to the model without writing gardens',async()=>{
 const oldKey=process.env.AI_GATEWAY_API_KEY;process.env.AI_GATEWAY_API_KEY='fixture-only';
 let signedIn=false,calls=0,saves=0,previous=null,failQuota=false,providerFailure=false;
 const analysis={summary:'Three patio planters.',notes:[],areas:[{name:'Grow bag',kind:'Container',x:10,y:10,w:20,h:20}]};
 const db={from(table){assert.equal(table,'garden_os_state');return{select(){return this;},eq(){return this;},async maybeSingle(){return{data:previous,error:null};}};},async rpc(name,p){assert.equal(name,'garden_os_save_state');assert.match(p.p_key,/garden-os-photo-layout-quota-owner-/);saves++;if(failQuota)return{error:{code:'40001'}};previous={value:p.p_value,version:p.p_version+1};return{error:null};}};
 globalThis.__photoRoute={parsePhotoAnalysis,photoQuota,validAnalysisImage,authenticated:async()=>signedIn?{user:{id:'owner'},db}:null,jsonSchema:s=>s,Output:{object:x=>x},generateText:async args=>{calls++;assert.equal(args.maxRetries,0);assert.ok(args.maxOutputTokens<=3000);assert.match(args.messages[0].content[0].text,/Garden focus: containers/);assert.equal(args.messages[0].content[1].data,'data:image/jpeg;base64,aGVsbG8=');if(providerFailure)throw Error('private provider error must not leak');return{output:analysis};}};
 const {POST}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
 const request=body=>new Request('https://garden.test/api/photo-layout',{method:'POST',body:JSON.stringify(body)});
 try{
  assert.equal((await POST(request({}))).status,401);assert.equal(calls,0);
  signedIn=true;assert.equal((await POST(request({image:'https://internal.example/'}))).status,400);assert.equal(saves,0);
  assert.equal((await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'injected'}))).status,400);
  const res=await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'containers'}));assert.equal(res.status,200);assert.deepEqual((await res.json()).analysis,analysis);assert.equal(calls,1);assert.equal(saves,1);
  assert.equal((await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'containers'}))).status,429);assert.equal(calls,1);
  previous={value:{count:5,lastAt:1},version:5};assert.equal((await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'containers'}))).status,429);assert.equal(calls,1);
  previous=null;failQuota=true;assert.equal((await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'containers'}))).status,429);assert.equal(calls,1);
  previous=null;failQuota=false;providerFailure=true;const failure=await POST(request({image:'data:image/jpeg;base64,aGVsbG8=',focus:'containers'}));assert.equal(failure.status,502);assert.doesNotMatch(JSON.stringify(await failure.json()),/private provider/);
 }finally{delete globalThis.__photoRoute;if(oldKey===undefined)delete process.env.AI_GATEWAY_API_KEY;else process.env.AI_GATEWAY_API_KEY=oldKey;}
});
