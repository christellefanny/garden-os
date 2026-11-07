// Isolated production-server API smoke test. Build with the fixture URL first.
// Never connects to production or authenticates a real account.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:3064';
const fixtureUrl = 'http://127.0.0.1:54321';
const userId = 'a0a0a0a0-0000-4000-8000-000000000001';
const fixture = spawn(process.execPath, ['tests/fixtures/supabase.mjs'], { stdio: 'pipe' });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3064'], {
  stdio: 'pipe', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'garden-os-local-preview' },
});
let log = '';
for (const child of [fixture, server]) {
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(fixture.exitCode, null, 'isolated fixture must remain running');
    assert.equal(server.exitCode, null, 'isolated app must remain running');
    try { if ((await fetch(base)).ok && (await fetch(`${fixtureUrl}/control/state`)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, log);
  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  const session = await fetch(`${fixtureUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'garden@example.test', password: 'fixture-password' }),
  }).then(response => response.json());
  const headers = { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
  const read = () => fetch(`${base}/api/state`, { headers }).then(response => response.json());
  const save = (key, value, version) => fetch(`${base}/api/state`, { method: 'PUT', headers, body: JSON.stringify({ key, value, version }) });
  assert.deepEqual((await read()).records, []);
  assert.equal((await save('garden-os-journal-other-account', ['must not save'], 0)).status, 400);
  const key = `garden-os-journal-${userId}`;
  const first = await save(key, [{ text: 'preserve the first copy' }], 0);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).record.version, 1);
  assert.equal((await save(key, [{ text: 'stale overwrite' }], 0)).status, 409);
  assert.equal((await read()).records[0].value[0].text, 'preserve the first copy');
  const next = await save(key, [{ text: 'version-checked update' }], 1);
  assert.equal(next.status, 200);
  assert.equal((await next.json()).record.version, 2);
  assert.equal((await read()).records[0].value[0].text, 'version-checked update');
  console.log('PASS production HTTP smoke: page renders, unauthenticated state rejected, foreign key rejected, initial save/read, stale-version conflict preserves original, current-version update succeeds. Isolated fixture only.');
} finally {
  server.kill();
  fixture.kill();
}
