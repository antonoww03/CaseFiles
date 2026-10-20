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
  const immersiveInitial = await request('/immersive','GET',undefined,token);
  assert.equal(immersiveInitial.status,200);
  assert.equal(immersiveInitial.json.inventory.length,0);
  assert.equal(immersiveInitial.json.objects.length,6);
  assert.equal((await request('/immersive/action','POST',{kind:'inspect',objectId:'drawer'},token)).status,403);
  const key = await request('/immersive/action','POST',{kind:'inspect',objectId:'doormat'},token);
  assert.equal(key.status,200);
  assert.ok(key.json.progress.inventory.some(x=>x.id==='brass_key'));
  const drawer = await request('/immersive/action','POST',{kind:'inspect',objectId:'drawer'},token);
  assert.equal(drawer.status,200);
  assert.ok(drawer.json.progress.inventory.some(x=>x.id==='negative'));
  assert.equal((await request('/immersive/action','POST',{kind:'inspect',objectId:'papers'},token)).status,403);
  const archiveBlocked = await request('/immersive/computer/search','POST',{query:'фактури'},token);
  assert.equal(archiveBlocked.status,200);
  assert.equal(archiveBlocked.json.total,0);
  const prematureDialogue = await request('/immersive/dialogue','POST',{choiceId:'martin_facts'},token);
  assert.equal(prematureDialogue.status,403);
  const politeDialogue = await request('/immersive/dialogue','POST',{choiceId:'martin_intro'},token);
  assert.equal(politeDialogue.status,200);
  assert.ok(politeDialogue.json.progress.trust.martin>40);
  const expansionStart = await request('/expansion','GET',undefined,token);
  assert.equal(expansionStart.status,200);
  assert.equal(expansionStart.json.puzzles.length,7);
  assert.equal(expansionStart.json.locations.find(x=>x.id==='office').unlocked,false);
  const difficulty = await request('/expansion/difficulty','POST',{difficulty:'expert'},token);
  assert.equal(difficulty.status,200);
  assert.equal(difficulty.json.difficulty,'expert');
  const hintedExpert = await request('/hints','GET',undefined,token);
  assert.equal(hintedExpert.json.max,1);
  const forbiddenPuzzle = await request('/expansion/action','POST',{kind:'puzzle',id:'audio',answer:'1'},token);
  assert.equal(forbiddenPuzzle.status,403);
  const unsafeScore = await request('/expansion/action','POST',{kind:'suspect',id:'martin',score:101},token);
  assert.equal(unsafeScore.status,400);
  const sourceClassification = await request('/expansion/action','POST',{kind:'classify',id:'H01',answer:'hypothesis'},token);
  assert.equal(sourceClassification.status,200);
  const progressTutorial = await request('/expansion/action','POST',{kind:'tutorial',id:'scene'},token);
  assert.equal(progressTutorial.status,200);
  const updatedPreference = await request('/expansion/action','POST',{kind:'settings',sound:false,reducedMotion:true},token);
  assert.equal(updatedPreference.status,200);
  const suspicion = await request('/expansion/action','POST',{kind:'suspect',id:'martin',score:75},token);
  assert.equal(suspicion.status,200);
  const noLateDifficulty = await request('/expansion/difficulty','POST',{difficulty:'rookie'},token);
  assert.equal(noLateDifficulty.status,409);
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
  const preReport = await request('/report','GET',undefined,token);
  assert.equal(preReport.status,403);
  const gatedVideo = await request('/discover/E06','POST',{},token);
  assert.equal(gatedVideo.status,403);
  const gatedDoc = await request('/discover/E09','POST',{},token);
  assert.equal(gatedDoc.status,403);
  const gatedLock = await request('/discover/E08','POST',{},token);
  assert.equal(gatedLock.status,403);
  for (const id of ['E01','E03','E04','E05']) {
    const clue = await request('/discover/' + id, 'POST', {}, token);
    assert.equal(clue.status, 200);
  }
  assert.equal((await request('/discover/E08','POST',{},token)).status,200);
  const lamp = await request('/immersive/action','POST',{kind:'inspect',objectId:'lamp'},token);
  assert.equal(lamp.status,200);
  const bookshelf = await request('/immersive/action','POST',{kind:'inspect',objectId:'bookshelf'},token);
  assert.equal(bookshelf.status,200);
  const negativeAnalysis=await request('/immersive/action','POST',{kind:'combine',first:'negative',second:'magnifier'},token);
  assert.equal(negativeAnalysis.status,200);
  const papers=await request('/immersive/action','POST',{kind:'inspect',objectId:'papers'},token);
  assert.equal(papers.status,200);
  const glowing=await request('/immersive/action','POST',{kind:'combine',first:'uv_lamp',second:'cipher_strip'},token);
  assert.equal(glowing.status,200);
  assert.equal((await request('/immersive/action','POST',{kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,2]},token)).status,422);
  const dial = await request('/immersive/action','POST',{kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,1]},token);
  assert.equal(dial.status,200);
  assert.equal(dial.json.progress.dial.solved,true);
  const lockedDoc = await request('/forensics/documents/draft','GET',undefined,token);
  assert.equal(lockedDoc.status,200);
  const unlockedDraft = await request('/forensics/documents/draft/inspect','POST',{pageId:'signature'},token);
  assert.equal(unlockedDraft.status,200);
  assert.ok(unlockedDraft.json.found.includes('E09'));
  const terminal = await request('/immersive/computer/search','POST',{query:'фактури'},token);
  assert.equal(terminal.status,200);
  assert.equal(terminal.json.total,1);
  assert.equal(terminal.json.results[0].id,'R-103');
  const badClip = await request('/forensics/clips/elevator/analyze','POST',{second:0,detail:'врати'},token);
  assert.equal(badClip.status,422);
  const clipFrame = await request('/forensics/clips/elevator/frame?second=120','GET',undefined,token);
  assert.equal(clipFrame.json.frame.clock,'01:12:00');
  const clip = await request('/forensics/clips/elevator/analyze','POST',{second:120,detail:'презрамка'},token);
  assert.equal(clip.status,200);
  assert.ok(clip.json.found.includes('E06'));
  const puzzleWrong = await request('/expansion/action','POST',{kind:'puzzle',id:'fingerprints',answer:'0'},token);
  assert.equal(puzzleWrong.status,422);
  const fingerprint = await request('/expansion/action','POST',{kind:'puzzle',id:'fingerprints',answer:'1'},token);
  assert.equal(fingerprint.status,200);
  const routePuzzle = await request('/expansion/action','POST',{kind:'puzzle',id:'route',answer:'1'},token);
  assert.equal(routePuzzle.status,200);
  const placed = await request('/expansion/action','POST',{kind:'timeline',id:'t2',position:'01:09'},token);
  assert.equal(placed.status,200);
  const guard = await request('/expansion/action','POST',{kind:'witness',id:'guard'},token);
  assert.equal(guard.status,200);
  assert.match(guard.json.message,/код/);
  const afterDiscovery = await request('/expansion','GET',undefined,token);
  assert.equal(afterDiscovery.json.locations.find(x=>x.id==='office').unlocked,true);
  assert.equal(afterDiscovery.json.timeline.find(x=>x.id==='t2').completed,true);
  assert.equal(afterDiscovery.json.suspicions.martin,75);
  const access = await request('/forensics/documents/access/inspect','POST',{pageId:'record'},token);
  assert.equal(access.status,200);
  assert.ok(access.json.found.includes('E10'));
  const exit = await request('/forensics/clips/exit/analyze','POST',{second:120,detail:'презрамка'},token);
  assert.equal(exit.status,200);
  assert.ok(exit.json.found.includes('E07'));
  const medical = await request('/discover/E02','POST',{},token);
  assert.equal(medical.status,200);
  const help = await request('/hints','GET',undefined,token);
  assert.equal(help.json.used,0);
  const hinted = await request('/hints','POST',{},token);
  assert.equal(hinted.status,200);
  assert.equal(hinted.json.used,1);
  assert.equal((await request('/hints','POST',{},token)).status,429);
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
  const styled = await request('/interview','POST',{personId:'martin',message:'Проверяваме твърденията ви.',evidenceId:'E09',interviewStyle:'challenge',scriptedOnly:true},token);
  assert.equal(styled.status,200);
  assert.equal(styled.json.mode,'scripted-demo');
  assert.ok(styled.json.pressure > 20);
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
  assert.ok(verdict.json.score.penalty>=4);
  assert.equal(verdict.json.report.status,'solved');
  assert.equal(verdict.json.report.timeline.length,8);
  const report = await request('/report','GET',undefined,token);
  assert.equal(report.status,200);
  assert.equal(report.json.headline,'Разследването е приключено');
  const completedExpansion = await request('/expansion','GET',undefined,token);
  assert.ok(completedExpansion.json.rating);
  assert.equal(completedExpansion.json.attempts.length,1);
  assert.equal(completedExpansion.json.achievements.find(x=>x.id==='perfect').done,true);
  assert.equal(completedExpansion.json.settings.reducedMotion,true);
  assert.ok(completedExpansion.json.actions.some(x=>x.kind==='puzzle'));
  const portable = await request('/backup','GET',undefined,token);
  assert.equal(portable.status,200);
  assert.equal(portable.json.format,'casefiles-backup-v1');
  assert.equal(portable.json.solved,true);
  assert.equal(portable.json.immersive.inventory.length,5);
  assert.ok(portable.json.immersive.solved.includes('safe_dial'));
  assert.ok(portable.json.immersive.dialogue.some(d=>d.choiceId==='martin_intro'));

  const restoredSession = await request('/session','POST');
  assert.equal(restoredSession.status,201);
  const restoredToken=restoredSession.json.sessionId;
  const restoredBackup = await request('/backup/restore','POST',portable.json,restoredToken);
  assert.equal(restoredBackup.status,200);
  assert.equal(restoredBackup.json.aiEnabled,false);
  const restoredState = await request('/session','GET',undefined,restoredToken);
  assert.ok(restoredState.json.found.includes('E09'));
  assert.deepEqual(restoredState.json.links,['D01','D02']);
  const restoredReport = await request('/report','GET',undefined,restoredToken);
  assert.equal(restoredReport.status,200);
  const restoredExpansion = await request('/expansion','GET',undefined,restoredToken);
  assert.equal(restoredExpansion.json.difficulty,'expert');
  assert.equal(restoredExpansion.json.suspicions.martin,75);
  assert.equal(restoredExpansion.json.attempts.length,1);
  const restoredImmersive = await request('/immersive','GET',undefined,restoredToken);
  assert.equal(restoredImmersive.status,200);
  assert.equal(restoredImmersive.json.inventory.length,5);
  assert.equal(restoredImmersive.json.dial.solved,true);
  assert.ok(restoredImmersive.json.history.some(h=>h.choiceId==='martin_intro'));
  const invalidRestore = await request('/backup/restore','POST',{format:'bad'},restoredToken);
  assert.equal(invalidRestore.status,409);

  const wrong = await request('/accusation', 'POST', { ...accusation, suspectId: 'elena' }, token);
  assert.equal(wrong.json.status, 'incorrect');
  process.stdout.write('CaseFiles API smoke test passed\n');
} finally {
  child.kill('SIGTERM');
}
