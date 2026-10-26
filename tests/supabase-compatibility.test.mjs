import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
for (const scenario of ['publishable','legacy','both']) {
 test(`client and server Supabase clients support ${scenario} key configuration`, () => {
  const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://garden-qa.supabase.co'};
  delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(scenario!=='legacy')env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='qa-publishable-key';
  if(scenario!=='publishable')env.NEXT_PUBLIC_SUPABASE_ANON_KEY='qa-anon-key';
  const expected=scenario==='legacy'?'qa-anon-key':'qa-publishable-key';
  const result=spawnSync(process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import {supabase} from './lib/supabase.ts';import {userDatabase} from './lib/reminders-server.ts';assert.equal(supabase.supabaseKey,${JSON.stringify(expected)});assert.equal(userDatabase('qa-token').supabaseKey,${JSON.stringify(expected)});`],{env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 });
}
