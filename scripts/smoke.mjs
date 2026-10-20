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
  const dossiers = await request('/suspects','GET',undefined,token);
  assert.equal(dossiers.status,200);
  assert.equal(dossiers.json.length,3);
  const invalidNote = await request('/notes','POST',{title:'',body:''},token);
  assert.equal(invalidNote.status,400);
  const written = await request('/notes','POST',{title:'Проверка на часовете',body:'Съпоставка на записите.',category:'lead'},token);
  assert.equal(written.status,201);
  const noteId = written.json.note.id;
  const updated = await request('/notes/'+noteId,'PUT',{title:'Проверка на достъпа',body:'Съпоставка на кодовете.',category:'lead'},token);
  assert.equal(updated.status,200);
  const notes = await request('/notes','GET',undefined,token);
  assert.equal(notes.status,200);
  assert.equal(notes.json[0].title,'Проверка на достъпа');
  const blockedContradiction = await request('/contradictions/C01','POST',{},token);
  assert.equal(blockedContradiction.status,403);
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
  const temporal = await request('/deductions', 'POST', { firstId: 'E05', secondId: 'E06' }, token);
  assert.equal(temporal.status,200);
  assert.equal(temporal.json.deduction.id,'D02');
  const impossible = await request('/deductions', 'POST', { firstId: 'E04', secondId: 'E08' }, token);
  assert.equal(impossible.status, 422);
  const discoveredLinks = await request('/deductions','GET',undefined,token);
  assert.equal(discoveredLinks.status, 200);
  assert.equal(discoveredLinks.json[0].id,'D01');
  const sessionState = await request('/session','GET',undefined,token);
  assert.deepEqual(sessionState.json.links,['D01','D02']);
  const interview = await request('/interview', 'POST', { personId: 'martin', message: 'Къде бяхте?', evidenceId: 'E04' }, token);
  assert.equal(interview.status, 200);
  assert.ok(interview.json.reply);
  const verifiedLead = await request('/discover/E10','POST',{},token);
  assert.equal(verifiedLead.status,200);
  const contradiction = await request('/contradictions/C02','POST',{},token);
  assert.equal(contradiction.status,200);
  const conflictList = await request('/contradictions','GET',undefined,token);
  assert.equal(conflictList.status,200);
  assert.equal(conflictList.json.find(x=>x.id==='C02').verified,true);
  const deleted = await request('/notes/'+noteId,'DELETE',undefined,token);
  assert.equal(deleted.status,200);
  assert.equal(deleted.json.notes.length,0);
  const callLog = await request('/discover/E03','POST',{},token);
  assert.equal(callLog.status,200);
  const elenaInterview = await request('/interview','POST',{personId:'elena',message:'Говорихте ли с Никола?',evidenceId:'E03'},token);
  assert.equal(elenaInterview.status,200);
  assert.ok(elenaInterview.json.found.includes('E11'));
  const contradictionElena = await request('/contradictions/C01','POST',{},token);
  assert.equal(contradictionElena.status,200);
  const petarInterview = await request('/interview','POST',{personId:'petar',message:'Какъв шум чухте?'},token);
  assert.equal(petarInterview.status,200);
  assert.ok(petarInterview.json.found.includes('E12'));
  const finalSession = await request('/session','GET',undefined,token);
  assert.deepEqual(finalSession.json.verified.sort(),['C01','C02']);
  const accusation = { suspectId: 'martin', motive: 'Служебни финансови несъответствия.', timeline: 'Посещение по време на престъплението и напускане.', evidenceIds: ['E04', 'E09', 'E05', 'E06', 'E08'] };
  const verdict = await request('/accusation', 'POST', accusation, token);
  assert.equal(verdict.status, 200);
  assert.equal(verdict.json.status, 'solved');
  assert.ok(verdict.json.score.total > 0);
  assert.equal(verdict.json.score.categories.length,5);
  const wrong = await request('/accusation', 'POST', { ...accusation, suspectId: 'elena' }, token);
  assert.equal(wrong.json.status, 'incorrect');
  process.stdout.write('CaseFiles API smoke test passed\n');
} finally {
  child.kill('SIGTERM');
}
