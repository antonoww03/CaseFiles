import {describe,it,expect} from 'vitest';
import {executeWorld,examineSchema,worldSnapshot,stageLocations} from './experience11.js';
import {initialLiving} from './living.js';
import {initialCinematic} from './cinematic.js';
import {newImmersiveState,interaction} from './immersive.js';
import {initialProgress} from './expansion.js';
import {newGame09} from './game09.js';
import type {StoredSession} from './storage.js';
function fresh():StoredSession{return{
 id:'426721a1-39b1-4f0d-8596-8e18e81f0009',found:new Set(),links:new Set(),verified:new Set(),notes:[],analyses:new Set(),
 pressure:{},hintsUsed:0,accusationCount:0,finalReport:null,expansion:initialProgress(),immersive:newImmersiveState(),
 living:initialLiving(),game09:newGame09(),cinematic:initialCinematic(),messages:{},disclosed:{},interviewCount:0,aiCalls:0,interviewBusy:false,lastActive:Date.now()
};}
describe('CASEFILES 1.1 world gameplay',()=>{
 it('ships distinct map scenes with gated archive sections',()=>{
  const s=fresh(),v=worldSnapshot(s);
  expect(stageLocations).toHaveLength(10);
  expect(v.locations.filter(l=>l.caseId==='case-001')).toHaveLength(4);
  expect(v.locations.find(l=>l.id==='hall')?.available).toBe(false);
  s.living.case2.found.push('C1','C2');
  expect(worldSnapshot(s).locations.find(l=>l.id==='hall')?.available).toBe(true);
 });
 it('requires key ownership for real drawer interaction',()=>{
  const s=fresh();
  expect(executeWorld(s,{kind:'use',item:'brass_key',target:'drawer'}).status).toBe(403);
  interaction(s.immersive,s.found,{kind:'inspect',objectId:'doormat'});
  expect(executeWorld(s,{kind:'use',item:'brass_key',target:'drawer'}).status).toBe(200);
  expect(s.immersive.inventory).toContain('negative');
 });
 it('requires a paired object and prerequisite for magnifier and UV tool',()=>{
  const s=fresh();
  interaction(s.immersive,s.found,{kind:'inspect',objectId:'bookshelf'});
  expect(executeWorld(s,{kind:'use',item:'magnifier',target:'negative'}).status).toBe(403);
  interaction(s.immersive,s.found,{kind:'inspect',objectId:'doormat'});
  executeWorld(s,{kind:'use',item:'brass_key',target:'drawer'});
  expect(executeWorld(s,{kind:'use',item:'magnifier',target:'negative'}).status).toBe(200);
  interaction(s.immersive,s.found,{kind:'inspect',objectId:'lamp'});
  expect(executeWorld(s,{kind:'use',item:'uv_lamp',target:'papers'}).status).toBe(403);
  s.found.add('E04');
  interaction(s.immersive,s.found,{kind:'inspect',objectId:'papers'});
  expect(executeWorld(s,{kind:'use',item:'uv_lamp',target:'papers'}).status).toBe(200);
 });
 it('blocks fake object and reverse-side peek without rotation',()=>{
  const s=fresh();
  expect(executeWorld(s,{kind:'observe',target:'fake',side:'front',rotation:0}).status).toBe(404);
  expect(executeWorld(s,{kind:'observe',target:'doormat',side:'back',rotation:0}).status).toBe(422);
  expect(executeWorld(s,{kind:'observe',target:'doormat',side:'back',rotation:150}).status).toBe(200);
 });
 it('accepts verified pairings and rejects unsupported board links',()=>{
  const s=fresh();
  s.found.add('E04');s.found.add('E09');
  expect(executeWorld(s,{kind:'board',first:'E04',second:'E11'}).status).toBe(403);
  expect(executeWorld(s,{kind:'board',first:'E04',second:'E09'}).status).toBe(200);
  expect(s.links).toContain('D01');
  s.found.add('E03');
  expect(executeWorld(s,{kind:'board',first:'E04',second:'E03'}).status).toBe(422);
 });
 it('does not leak audio narratives or secrets before evidence discovery',()=>{
  const s=fresh();
  expect(worldSnapshot(s).recordings.every(r=>r.voice===null)).toBe(true);
  s.found.add('E03');s.found.add('E04');
  expect(worldSnapshot(s).recordings.find(r=>r.id==='nikola-draft')?.available).toBe(true);
  expect(worldSnapshot(s).recordings.find(r=>r.id==='archive-guard')?.available).toBe(false);
 });
 it('validates rotation and item payloads',()=>{
  expect(examineSchema.safeParse({kind:'observe',target:'doormat',side:'back',rotation:1000}).success).toBe(false);
  expect(examineSchema.safeParse({kind:'board',first:'E01',second:'E02'}).success).toBe(true);
  expect(examineSchema.safeParse({kind:'use',item:'uv_lamp',target:42}).success).toBe(false);
 });
});
