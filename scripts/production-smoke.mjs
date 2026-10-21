import assert from 'node:assert/strict';

const site = process.env.CASEFILES_SITE_URL || 'https://casefiles-game.onrender.com';
const api = process.env.CASEFILES_API_URL || 'https://casefiles-api-9wz5.onrender.com';
const production = new URL(site).origin;

async function request(path, init = {}) {
  let lastError;
  for (let attempt=1; attempt<=3; attempt++) {
    try {
      const response = await fetch(api + '/api' + path, {
        ...init,
        headers: {'Origin':production, ...(init.headers||{})},
        signal: AbortSignal.timeout(50000),
        cache:'no-store'
      });
      const json = await response.json();
      return {status:response.status, body:json, cors:response.headers.get('access-control-allow-origin')};
    } catch(error) {
      lastError=error;
      if(attempt<3) await new Promise(resolve=>setTimeout(resolve,attempt*2500));
    }
  }
  throw lastError;
}
const post = (path, body, token) => request(path, {
  method:'POST',
  headers:{'Content-Type':'application/json',...(token?{'x-case-session':token}:{})},
  body:JSON.stringify(body)
});
const get = (path, token) => request(path,token?{headers:{'x-case-session':token}}:{});

try {
  const front = await fetch(site, {signal:AbortSignal.timeout(45000)});
  assert.equal(front.status,200,'Public frontend HTTP status');
  const html=await front.text();
  assert.match(html,/id="root"/,'Frontend has React root');
  assert.match(html,/<script[^>]+src=/,'Frontend has JS bundle');
  process.stdout.write('PASS frontend reachable with compiled JS entry\n');

  const health=await get('/health');
  assert.equal(health.status,200);
  assert.equal(health.body.ok,true);
  assert.equal(health.body.storage,'postgres','Production API must use Neon PostgreSQL');
  assert.equal(health.cors,production,'Production frontend must be allowed by CORS');
  process.stdout.write('PASS production API, CORS and persistent Neon storage\n');

  const cases=await get('/cases');
  assert.equal(cases.status,200);
  assert.equal(cases.body.length,2);
  const community=await get('/community/status');
  assert.equal(community.status,200);
  assert.equal(community.body.storage,'postgres');
  assert.equal(community.body.coop,true);
  process.stdout.write('PASS both authored cases and community backend\n');

  assert.equal((await get('/universe/case-001')).status,401,'Anonymous game state should be protected');
  const created=await post('/session',{});
  assert.equal(created.status,201,'Create disposable QA session');
  assert.match(created.body.sessionId,/^[a-f\d-]{36}$/i);
  const token=created.body.sessionId; // Never print a bearer token in CI logs.
  const first=await get('/universe/case-001',token);
  assert.equal(first.status,200);
  assert.equal(first.body.turn,0);
  assert.equal(first.body.locations.length,7);
  const second=await get('/universe/case-002',token);
  assert.equal(second.status,200);
  assert.equal(second.body.locations.length,7);
  assert.equal((await post('/universe/case-001/action',{kind:'travel',id:'office'},token)).status,403);
  assert.equal((await post('/universe/case-001/action',{kind:'wait',extra:true},token)).status,400);
  const advanced=await post('/universe/case-001/action',{kind:'wait'},token);
  assert.equal(advanced.status,200);
  assert.equal(advanced.body.world.turn,1);
  assert.equal((await get('/universe/case-001',token)).body.turn,1);
  assert.equal((await get('/universe/case-002',token)).body.turn,0);
  process.stdout.write('PASS Neon-backed test session, two cases, validation and authoritative game turn\n');

  const archive=await get('/backup',token);
  assert.equal(archive.status,200);
  assert.equal(archive.body.format,'casefiles-backup-v1');
  assert.equal(archive.body.universe['case-001'].turn,1);
  process.stdout.write('PASS portable backup includes the persisted world state\n');
  process.stdout.write('CASEFILES_PRODUCTION_QA_PASS\n');
} catch(error) {
  process.stderr.write('CASEFILES_PRODUCTION_QA_FAILED: '+String(error?.message||error)+'\n');
  process.exitCode=1;
}
