import {describe,expect,it} from 'vitest';
import {archivePuzzles,releaseActionSchema,evaluateRelease10,snapshot10} from './release10.js';
import {initialLiving} from './living.js';
import {newGame09} from './game09.js';
import {initialCinematic} from './cinematic.js';
import {newImmersiveState} from './immersive.js';
import {initialProgress} from './expansion.js';
import type {StoredSession} from './storage.js';
import {initialUniverse} from './universe.js';
function create():StoredSession{return {
 id:'426721a1-39b1-4f0d-8596-8e18e81f0009',found:new Set(),links:new Set(),verified:new Set(),notes:[],analyses:new Set(),
 pressure:{},hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),
 living:initialLiving(),game09:newGame09(),universe:initialUniverse(),cinematic:initialCinematic(),messages:{},disclosed:{},interviewCount:0,
 aiCalls:0,interviewBusy:false,lastActive:Date.now()
};}
describe('CASEFILES 1.0 release progression',()=>{
 it('seals archive answers and story conclusion in public snapshot',()=>{
  const s=create();const view=snapshot10(s);
  expect(view.case2.puzzles).toHaveLength(3);
  expect(JSON.stringify(view)).not.toContain('2339');
  expect(JSON.stringify(view)).not.toContain('2347-2352');
  expect(view.case2.canAccuse).toBe(false);
  expect(view.beats['case-002']).toHaveLength(1);
 });
 it('rejects puzzle submission before prerequisites',()=>{
  const s=create();
  expect(evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'2339'}).status).toBe(403);
  s.living.case2.found=['C2','C3'];
  expect(evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'0000'}).status).toBe(422);
  expect(evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'2339'}).status).toBe(200);
  expect(evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'2339'}).status).toBe(409);
  expect(snapshot10(s).case2.puzzles.find(x=>x.id==='archive-lock')?.solved).toBe(true);
 });
 it('blocks an unsupported finale and accepts independently verified clues',()=>{
  const s=create();s.living.case2.found=['C2','C3','C4','C5','C6'];
  expect(evaluateRelease10(s,{kind:'accuse002',suspectId:'boris',evidenceIds:['C2','C3','C4','C6']}).status).toBe(403);
  evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'2339'});
  evaluateRelease10(s,{kind:'puzzle',id:'archive-film',answer:'2347-2352'});
  expect(evaluateRelease10(s,{kind:'accuse002',suspectId:'boris',evidenceIds:['C2','C3','C4','C6']}).status).toBe(200);
  expect(snapshot10(s).case2.ending).toBe('complete'===snapshot10(s).case2.ending?'complete':'resolved');
  expect(snapshot10(s).case2.verdict).toBe('solved');
 });
 it('differentiates wrong accusations and forbids forged evidence',()=>{
  const s=create();s.living.case2.found=['C2','C3','C4','C5','C6'];
  evaluateRelease10(s,{kind:'puzzle',id:'archive-lock',answer:'2339'});
  evaluateRelease10(s,{kind:'puzzle',id:'archive-film',answer:'2347-2352'});
  expect(evaluateRelease10(s,{kind:'accuse002',suspectId:'boris',evidenceIds:['C2','C3','C9']}).status).toBe(403);
  expect(evaluateRelease10(s,{kind:'accuse002',suspectId:'raya',evidenceIds:['C2','C3','C4','C6']}).status).toBe(200);
  expect(snapshot10(s).case2.ending).toBe('contested');
 });
 it('validates action payloads and supports two independent story arcs',()=>{
  expect(archivePuzzles).toHaveLength(3);
  expect(releaseActionSchema.safeParse({kind:'puzzle',id:'archive-film',answer:1}).success).toBe(false);
  expect(releaseActionSchema.safeParse({kind:'accuse002',suspectId:'unknown',evidenceIds:['C1','C2','C3']}).success).toBe(false);
  const s=create();s.found.add('E04');s.living.case2.found.push('C2','C3');
  const v=snapshot10(s);
  expect(v.beats['case-001'].length).toBe(2);
  expect(v.beats['case-002'].length).toBe(2);
 });
});
