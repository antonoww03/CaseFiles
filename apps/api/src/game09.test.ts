import {describe,it,expect} from 'vitest';
import {evaluateGame09,newGame09,game09Action,game09View,game09Puzzles} from './game09.js';
import {initialProgress} from './expansion.js';
import {newImmersiveState} from './immersive.js';
import {initialLiving} from './living.js';
import {initialCinematic} from './cinematic.js';
import type {StoredSession} from './storage.js';
import {initialUniverse} from './universe.js';
const mock=():StoredSession=>({
 id:'d3c3f8da-b78b-478b-8786-d03b680b7893',found:new Set(),links:new Set(),notes:[],verified:new Set(),analyses:new Set(),pressure:{},hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),living:initialLiving(),cinematic:initialCinematic(),game09:newGame09(),universe:initialUniverse(),messages:{},disclosed:{},lastActive:Date.now(),interviewCount:0,aiCalls:0,interviewBusy:false
});
describe('CASEFILES 0.9 game mechanics',()=>{
 it('validates all action payload types',()=>{
  expect(game09Action.safeParse({kind:'puzzle',id:'fingerprint',answer:'B:90'}).success).toBe(true);
  expect(game09Action.safeParse({kind:'room',id:'basement'}).success).toBe(false);
  expect(game09Action.safeParse({kind:'puzzle',id:'cipher',answer:{raw:'371'}}).success).toBe(false);
 });
 it('locks each forensic game behind its supporting clues',()=>{
  const s=mock();
  expect(game09Puzzles).toHaveLength(7);
  for(const p of game09Puzzles.slice(0,6))expect(evaluateGame09(s,{kind:'puzzle',id:p.id,answer:'guess'}).status).toBe(403);
  s.found.add('E01');
  expect(evaluateGame09(s,{kind:'puzzle',id:'fingerprint',answer:'B:0'}).status).toBe(422);
  expect(game09View(s).hints.find(h=>h.id==='fingerprint')?.unlocked).toBe(false);
  expect(evaluateGame09(s,{kind:'puzzle',id:'fingerprint',answer:'B:180'}).status).toBe(422);
  expect(game09View(s).hints.find(h=>h.id==='fingerprint')?.unlocked).toBe(true);
  expect(evaluateGame09(s,{kind:'puzzle',id:'fingerprint',answer:'B:90'}).status).toBe(200);
  expect(game09View(s).solved).toContain('fingerprint');
  expect(evaluateGame09(s,{kind:'puzzle',id:'fingerprint',answer:'B:90'}).status).toBe(409);
 });
 it('validates document assembly, CCTV region and testimony evidence',()=>{
  const s=mock();for(const id of ['E03','E04','E06','E11'])s.found.add(id);
  expect(evaluateGame09(s,{kind:'puzzle',id:'torn',answer:'провери-оригиналните-фактури'}).status).toBe(200);
  expect(evaluateGame09(s,{kind:'puzzle',id:'cctv',answer:'120:face'}).status).toBe(422);
  expect(evaluateGame09(s,{kind:'puzzle',id:'cctv',answer:'120:strap'}).status).toBe(200);
  expect(evaluateGame09(s,{kind:'puzzle',id:'testimony',answer:'call-denial'}).status).toBe(200);
 });
 it('supports room navigation, vision, and gated travel',()=>{
  const s=mock();
  expect(evaluateGame09(s,{kind:'room',id:'study'}).status).toBe(200);
  expect(game09View(s).selectedRoom).toBe('study');
  expect(evaluateGame09(s,{kind:'vision',id:'papers'}).status).toBe(403);
  expect(evaluateGame09(s,{kind:'vision',id:'doormat'}).status).toBe(200);
  expect(game09View(s).discovered).toContain('doormat');
  expect(evaluateGame09(s,{kind:'focus',id:'laboratory'}).status).toBe(403);
  s.found.add('E01');
  expect(evaluateGame09(s,{kind:'focus',id:'laboratory'}).status).toBe(200);
 });
 it('gates cipher by actual UV combination and verifies chronology',()=>{
  const s=mock();for(const id of ['E03','E04','E05','E06','E08'])s.found.add(id);
  expect(evaluateGame09(s,{kind:'puzzle',id:'cipher',answer:'371'}).status).toBe(403);
  s.immersive.discoveries.push('uv_marker');
  expect(evaluateGame09(s,{kind:'puzzle',id:'cipher',answer:'371'}).status).toBe(200);
  expect(evaluateGame09(s,{kind:'puzzle',id:'reconstruct',answer:'E05>E06>E03>E08'}).status).toBe(200);
 });
 it('New Game+ requires a solved case and unlocks an actual bonus challenge',()=>{
  const s=mock();s.found.add('E01');s.found.add('E04');
  expect(evaluateGame09(s,{kind:'newGamePlus'}).status).toBe(403);
  expect(evaluateGame09(s,{kind:'puzzle',id:'bonus',answer:'E01+E04'}).status).toBe(403);
  s.living.case2.verdict='solved';
  expect(evaluateGame09(s,{kind:'newGamePlus'}).status).toBe(200);
  expect(game09View(s).puzzles.some(x=>x.id==='bonus')).toBe(true);
  expect(evaluateGame09(s,{kind:'puzzle',id:'bonus',answer:'E01+E04'}).status).toBe(200);
  expect(game09View(s).solved).toContain('bonus');
 });
 it('mission state and alternate ending labels derive from real progress',()=>{
  const s=mock();
  expect(game09View(s).missionCompleted).toBe(0);
  expect(game09View(s).story.ending).toBe('ongoing');
  s.immersive.inspected=['doormat','lamp'];
  s.immersive.discoveries=['uv_marker'];
  s.living.case2.verdict='solved';
  expect(game09View(s).missionCompleted).toBeGreaterThanOrEqual(3);
  expect(game09View(s).story.ending).toBe('proven');
  s.living.reputation=10;
  expect(game09View(s).story.ending).toBe('controversial');
 });
});
