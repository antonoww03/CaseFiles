import {describe,it,expect} from 'vitest';
import {directorView,applyDirector,directorSchema,directorBeats} from './director12.js';
import {newGame09} from './game09.js';
import {initialLiving} from './living.js';
import {initialCinematic} from './cinematic.js';
import {newImmersiveState} from './immersive.js';
import {initialProgress} from './expansion.js';
import type {StoredSession} from './storage.js';
import {initialUniverse} from './universe.js';
function fresh():StoredSession{return {
 id:'426721a1-39b1-4f0d-8596-8e18e81f0009',found:new Set(),links:new Set(),notes:[],verified:new Set(),analyses:new Set(),pressure:{},
 hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),
 living:initialLiving(),cinematic:initialCinematic(),game09:newGame09(),universe:initialUniverse(),messages:{},disclosed:{},lastActive:Date.now(),interviewCount:0,aiCalls:0,interviewBusy:false
};}
describe('CASEFILES 1.2 Director’s Cut',()=>{
 it('starts with prologue scenes only; spoiler choices remain hidden',()=>{
  const s=fresh();
  expect(directorBeats).toHaveLength(10);
  expect(directorView(s,'case-001').beats.map(b=>b.id)).toEqual(['arrival407']);
  expect(directorView(s,'case-002').beats.map(b=>b.id)).toEqual(['archive-arrival']);
  expect(directorView(s,'case-001').decisions).toHaveLength(0);
 });
 it('blocks prematurely triggered narrative and unknown IDs',()=>{
  const s=fresh();
  expect(applyDirector(s,'case-001',{kind:'scene',id:'invoice-shadow'}).status).toBe(403);
  expect(applyDirector(s,'case-001',{kind:'choose',id:'audit-invoices'}).status).toBe(403);
  expect(applyDirector(s,'case-001',{kind:'scene',id:'unknown'}).status).toBe(404);
  expect(applyDirector(s,'case-001',{kind:'scene',id:'archive-arrival'}).status).toBe(404);
 });
 it('tracks watched scenes, preserving progress in existing portable game events',()=>{
  const s=fresh();
  expect(applyDirector(s,'case-001',{kind:'scene',id:'arrival407'}).status).toBe(200);
  expect(directorView(s,'case-001').next).toBeNull();
  expect(applyDirector(s,'case-001',{kind:'scene',id:'arrival407'}).status).toBe(409);
  s.found.add('E03');
  expect(directorView(s,'case-001').next?.id).toBe('phone-pulse');
  expect(directorView(s,'case-001').decisions).toHaveLength(2);
  expect(s.game09.events[0].name).toBe('d12:arrival407');
 });
 it('enforces mutually exclusive branches with evidence dependencies',()=>{
  const s=fresh();s.found.add('E03');
  expect(applyDirector(s,'case-001',{kind:'choose',id:'preserve-phone'}).status).toBe(200);
  expect(applyDirector(s,'case-001',{kind:'choose',id:'question-phone'}).status).toBe(409);
  expect(directorView(s,'case-001').mood).toBe('quiet');
  expect(directorView(s,'case-001').decisions.find(c=>c.id==='preserve-phone')?.effect).toContain('непокътнати');
  expect(directorView(s,'case-001').decisions.find(c=>c.id==='question-phone')?.effect).toBeNull();
 });
 it('supports tense consequence and independent archive routes',()=>{
  const s=fresh();s.living.case2.found=['C1','C2'];
  expect(applyDirector(s,'case-002',{kind:'choose',id:'pressure-guard'}).status).toBe(200);
  expect(directorView(s,'case-002').mood).toBe('tense');
  expect(applyDirector(s,'case-002',{kind:'choose',id:'secure-logs'}).status).toBe(409);
  expect(directorView(s,'case-001').beats).toHaveLength(1);
 });
 it('rejects invalid action bodies',()=>{
  expect(directorSchema.safeParse({kind:'choose',id:8}).success).toBe(false);
  expect(directorSchema.safeParse({kind:'scene',id:'arrival407'}).success).toBe(true);
 });
});
