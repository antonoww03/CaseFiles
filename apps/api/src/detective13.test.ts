import {describe,it,expect} from 'vitest';
import {challenges,detective13View,detective13Schema,submitDetective13} from './detective13.js';
import {initialLiving} from './living.js';
import {newImmersiveState} from './immersive.js';
import {initialCinematic} from './cinematic.js';
import {newGame09} from './game09.js';
import {initialProgress} from './expansion.js';
import {exportBackup,applyBackup} from './backup.js';
import type {StoredSession} from './storage.js';

function fresh():StoredSession{return{
 id:'426721a1-39b1-4f0d-8596-8e18e81f0009',found:new Set(),links:new Set(),verified:new Set(),notes:[],analyses:new Set(),pressure:{},
 hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),
 living:initialLiving(),game09:newGame09(),cinematic:initialCinematic(),messages:{},disclosed:{},lastActive:Date.now(),interviewCount:0,aiCalls:0,interviewBusy:false
};}
describe('CASEFILES 1.3 Detective Instinct',()=>{
 it('ships ten server-validated independent challenges, never reveals solutions before discovery',()=>{
  const s=fresh();
  expect(challenges).toHaveLength(10);
  const a=detective13View(s,'case-001'),b=detective13View(s,'case-002');
  expect(a.challenges).toHaveLength(5);
  expect(b.challenges).toHaveLength(5);
  expect(a.challenges.every(x=>!x.available&&x.prompt===null&&x.options.length===0)).toBe(true);
  expect(JSON.stringify(a)).not.toContain('code');
  expect(a.objective.target).toBe('scene');
  expect(a.review).toBeNull();
 });
 it('denies guessed answers and cross-case challenge spoofing',()=>{
  const s=fresh();
  expect(submitDetective13(s,'case-001',{id:'access',answer:'code'}).status).toBe(403);
  expect(submitDetective13(s,'case-002',{id:'access',answer:'code'}).status).toBe(404);
  expect(detective13Schema.safeParse({id:'access',answer:'code',isAdmin:true}).success).toBe(false);
  expect(s.expansion.actions).toHaveLength(0);
 });
 it('records incorrect choices but does not reveal the correct answer',()=>{
  const s=fresh();s.found.add('E05');
  const wrong=submitDetective13(s,'case-001',{id:'access',answer:'call'});
  expect(wrong.status).toBe(422);
  const snap=detective13View(s,'case-001'),q=snap.challenges.find(x=>x.id==='access')!;
  expect(q.attempts).toBe(1);expect(q.completed).toBe(false);
  expect(q.explanation).toBeNull();
  expect(snap.progress.wrongAttempts).toBe(1);
  expect(s.expansion.actions[0].text).toBe('d13:case-001:access:fail');
 });
 it('accepts grounded reasoning, prevents repeat rewards, unlocks next objective',()=>{
  const s=fresh();s.found.add('E05');
  expect(submitDetective13(s,'case-001',{id:'access',answer:'code'}).status).toBe(200);
  expect(submitDetective13(s,'case-001',{id:'access',answer:'code'}).status).toBe(409);
  const v=detective13View(s,'case-001');
  expect(v.challenges.find(x=>x.id==='access')?.completed).toBe(true);
  expect(v.progress.solved).toBe(1);
 });
 it('requires two real selected items before accepting a matched evidence comparison',()=>{
  const s=fresh();s.found.add('E04');s.found.add('E09');s.found.add('E03');
  expect(submitDetective13(s,'case-001',{id:'financial',answer:'invoices'}).status).toBe(403);
  expect(submitDetective13(s,'case-001',{id:'financial',answer:'invoices',evidenceIds:['E04','E04']}).status).toBe(403);
  expect(submitDetective13(s,'case-001',{id:'financial',answer:'invoices',evidenceIds:['E04','E03']}).status).toBe(422);
  expect(submitDetective13(s,'case-001',{id:'financial',answer:'invoices',evidenceIds:['E04','E09']}).status).toBe(200);
 });
 it('case two respects prerequisites and does not infer identity from CCTV',()=>{
  const s=fresh();s.living.case2.found=['C2','C3','C4','C6'];
  expect(submitDetective13(s,'case-002',{id:'archiveclaim',answer:'C4'}).status).toBe(422);
  expect(submitDetective13(s,'case-002',{id:'archiveclaim',answer:'C3'}).status).toBe(200);
  expect(submitDetective13(s,'case-002',{id:'archivetheory',answer:'mixed'}).status).toBe(200);
  expect(detective13View(s,'case-002').progress.solved).toBe(2);
  expect(detective13View(s,'case-001').progress.solved).toBe(0);
 });
 it('stores progress without schema changes and restores via portable backup',()=>{
  const s=fresh();s.found.add('E05');
  submitDetective13(s,'case-001',{id:'access',answer:'code'});
  const b=exportBackup(s),restored=fresh();
  expect(b.expansion.actions.some(x=>x.kind==='detective13')).toBe(true);
  applyBackup(restored,b);
  expect(detective13View(restored,'case-001').challenges.find(x=>x.id==='access')?.completed).toBe(true);
 });
 it('review stays locked until original case is solved',()=>{
  const s=fresh();s.found.add('E05');
  submitDetective13(s,'case-001',{id:'access',answer:'code'});
  expect(detective13View(s,'case-001').review).toBeNull();
  s.finalReport={status:'solved'};
  const report=detective13View(s,'case-001').review;
  expect(report?.missed).toHaveLength(4);
  expect(report?.solved).toBe(1);
 });
});
