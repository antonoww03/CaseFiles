import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const port = 39677;
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['apps/api/dist/index.js'], {
  cwd: repositoryRoot,
  env: { ...process.env, PORT: String(port), WEB_ORIGIN: 'http://localhost:5173', OPENAI_API_KEY: '' },
  stdio: 'ignore'
});

async function request(path, method = 'GET', body, session) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session ? { 'x-case-session': session } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(5000)
  });
  return { status: response.status, json: await response.json() };
}

async function ready() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const health = await request('/health');
      if (health.status === 200 && health.json.mode === 'scripted-demo') return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('API did not become ready');
}

try {
  await ready();
  const caseData = await request('/case');
  assert.equal(caseData.status, 200);
  assert.equal(caseData.json.people.length, 3);
  const unauthorized = await request('/evidence');
  assert.equal(unauthorized.status, 401);
  const session = await request('/session', 'POST');
  assert.equal(session.status, 201);
  const token = session.json.sessionId;
  assert.ok(token);
  const invalidInterview = await request('/interview', 'POST', { personId: 'martin', message: '' }, token);
  assert.equal(invalidInterview.status, 400);
  const blocked = await request('/interview', 'POST', { personId: 'martin', message: 'Защо?', evidenceId: 'E05' }, token);
  assert.equal(blocked.status, 403);
  for (const id of ['E04', 'E05', 'E08', 'E09', 'E06']) {
    const clue = await request('/discover/' + id, 'POST', {}, token);
    assert.equal(clue.status, 200);
  }
  const linked = await request('/deductions', 'POST', { firstId: 'E04', secondId: 'E09' }, token);
  assert.equal(linked.status, 200);
  assert.equal(linked.json.deduction.id, 'D01');
  const impossible = await request('/deductions', 'POST', { firstId: 'E04', secondId: 'E08' }, token);
  assert.equal(impossible.status, 422);
  const discoveredLinks = await request('/deductions','GET',undefined,token);
  assert.equal(discoveredLinks.status, 200);
  assert.equal(discoveredLinks.json[0].id,'D01');
  const sessionState = await request('/session','GET',undefined,token);
  assert.deepEqual(sessionState.json.links,['D01']);
  const interview = await request('/interview', 'POST', { personId: 'martin', message: 'Къде бяхте?', evidenceId: 'E04' }, token);
  assert.equal(interview.status, 200);
  assert.ok(interview.json.reply);
  const accusation = { suspectId: 'martin', motive: 'Служебни финансови несъответствия.', timeline: 'Посещение по време на престъплението и напускане.', evidenceIds: ['E04', 'E05', 'E08'] };
  const verdict = await request('/accusation', 'POST', accusation, token);
  assert.equal(verdict.status, 200);
  assert.equal(verdict.json.status, 'solved');
  const wrong = await request('/accusation', 'POST', { ...accusation, suspectId: 'elena' }, token);
  assert.equal(wrong.json.status, 'incorrect');
  process.stdout.write('CaseFiles API smoke test passed\n');
} finally {
  child.kill('SIGTERM');
}
