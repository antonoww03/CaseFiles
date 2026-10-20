import {describe,expect,it} from 'vitest';
import {cinematicActionSchema,cinematicOverview,initialCinematic,profileSnapshot,useCinematicChoice,phoneRecords} from './cinematic.js';
import {initialProgress} from './expansion.js';
import {newImmersiveState} from './immersive.js';
import {initialLiving} from './living.js';
import type {StoredSession} from './storage.js';
import {initialUniverse} from './universe.js';
import {newGame09} from './game09.js';
function session():StoredSession {
 return {id:'1db60037-59a8-40ac-9946-f715cd44528f',found:new Set(['E01','E03','E04']),links:new Set(),notes:[],verified:new Set(),
 analyses:new Set(),pressure:{},hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),
 living:initialLiving(),cinematic:initialCinematic(),game09:newGame09(),universe:initialUniverse(),messages:{},disclosed:{},lastActive:Date.now(),interviewCount:0,aiCalls:25,interviewBusy:false};
}
describe('Cinematic and Digital Investigation 0.8',()=>{
 it('prevents access to locked smartphone records',()=>{
  const s=session();
  expect(phoneRecords.length).toBe(6);
  expect(useCinematicChoice(s,{kind:'phone',id:'email-report'}).status).toBe(403);
  expect(useCinematicChoice(s,{kind:'phone',id:'call-elena'}).status).toBe(200);
  expect(cinematicOverview(s).phone.find(p=>p.id==='email-report')?.detail).toBeNull();
  expect(cinematicOverview(s).phone.find(p=>p.id==='call-elena')?.detail).toContain('01:17');
 });
 it('requires observed evidence to reconstruct a deleted fragment',()=>{
  const s=session();
  expect(useCinematicChoice(s,{kind:'recover',answer:'000'}).status).toBe(422);
  expect(useCinematicChoice(s,{kind:'recover',answer:'407'}).status).toBe(200);
  expect(cinematicOverview(s).recovered).toBe(true);
  s.found.delete('E04');
  expect(useCinematicChoice(s,{kind:'recover',answer:'407'}).status).toBe(403);
 });
 it('changes expressions and permanently closes a dialogue branch',()=>{
  const s=session();
  expect(useCinematicChoice(s,{kind:'dialogue',id:'martin-invoices'}).status).toBe(403);
  expect(useCinematicChoice(s,{kind:'dialogue',id:'martin-accuse'}).status).toBe(200);
  expect(cinematicOverview(s).personas.find(p=>p.id==='martin')?.mood).toBe('angry');
  expect(useCinematicChoice(s,{kind:'dialogue',id:'martin-calm'}).status).toBe(409);
 });
 it('gates second case chapters with independent clues',()=>{
  const s=session();
  expect(useCinematicChoice(s,{kind:'location',id:'lift'}).status).toBe(403);
  s.living.case2.found=['C1','C2','C3','C4'];
  expect(useCinematicChoice(s,{kind:'location',id:'lift'}).status).toBe(200);
  expect(useCinematicChoice(s,{kind:'branch',id:'follow-camera'}).status).toBe(200);
  expect(cinematicOverview(s).case2.consequences).toContain('path:camera');
  expect(useCinematicChoice(s,{kind:'branch',id:'follow-camera'}).status).toBe(409);
 });
 it('returns deterministic earned XP and achievements',()=>{
  const s=session();
  const early=profileSnapshot(s);
  expect(early.evidence).toBe(3);
  expect(early.total).toBe(36);
  s.living.case2.found=['C1','C2'];
  s.living.case2.verdict='solved';
  expect(profileSnapshot(s).total).toBeGreaterThan(early.total);
  expect(profileSnapshot(s).achievements).toContain('Разрешен случай');
 });
 it('rejects invalid JSON actions',()=>{
  expect(cinematicActionSchema.safeParse({kind:'dialogue',id:'martin-calm'}).success).toBe(true);
  expect(cinematicActionSchema.safeParse({kind:'recover',answer:45}).success).toBe(false);
  expect(cinematicActionSchema.safeParse({kind:'location',id:42}).success).toBe(false);
 });
});
