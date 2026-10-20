import {describe,it,expect} from 'vitest';
import type {StoredSession} from './storage.js';
import {initialUniverse,universeView,executeUniverse,universeActionSchema,restoreUniverse} from './universe.js';

function session():StoredSession {
 return {
  found:new Set<string>(),living:{case2:{found:[],verdict:null}},universe:initialUniverse()
 } as unknown as StoredSession;
}
describe('CASEFILES 1.5-1.7 Detective Universe',()=>{
 it('separates cities, time and finances for both authored cases',()=>{
  const s=session();
  expect(universeView(s,'case-001').locations.find(x=>x.id==='apartment')?.open).toBe(true);
  expect(universeView(s,'case-002').locations.find(x=>x.id==='archive')?.open).toBe(true);
  expect(universeView(s,'case-001').locations.find(x=>x.id==='office')?.open).toBe(false);
  expect(executeUniverse(s,'case-001',{kind:'travel',id:'office'}).status).toBe(403);
  expect(executeUniverse(s,'case-001',{kind:'travel',id:'apartment'}).status).toBe(200);
  expect(universeView(s,'case-001').turn).toBe(1);
  expect(universeView(s,'case-002').turn).toBe(0);
 });
 it('rejects unearned assignments, only charges once and produces timed reports',()=>{
  const s=session();const a=s.universe['case-001'];
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'phone'}).status).toBe(403);
  s.found.add('E03');
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'phone'}).status).toBe(200);
  expect(a.credits).toBe(105);
  expect(a.jobs[0].done).toBe(false);
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'phone'}).status).toBe(409);
  expect(executeUniverse(s,'case-001',{kind:'wait'}).status).toBe(200);
  expect(a.jobs[0].done).toBe(true);
  expect(a.credits).toBe(113);
  expect(universeView(s,'case-001').missions.find(x=>x.id==='phone')?.report).toContain('01:17');
 });
 it('caps simultaneous assignments and keeps reports free from spoilers',()=>{
  const s=session();const d=s.universe['case-001'];
  for(const id of ['E02','E03','E04','E09','E06','E07'])s.found.add(id);
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'medical'}).status).toBe(200);
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'cameras'}).status).toBe(200);
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'finance'}).status).toBe(409);
  expect(d.jobs).toHaveLength(2);
  expect(universeView(s,'case-001').missions.find(x=>x.id==='finance')?.report).toBe(null);
 });
 it('moves witnesses with the in-world clock and requires proximity and evidence',()=>{
  const s=session();const d=s.universe['case-002'];
  expect(executeUniverse(s,'case-002',{kind:'talk',id:'boris',approach:'empathy'}).status).toBe(409);
  s.living.case2.found.push('C1');
  expect(executeUniverse(s,'case-002',{kind:'travel',id:'security'}).status).toBe(200);
  expect(d.turn).toBe(1);
  expect(executeUniverse(s,'case-002',{kind:'talk',id:'boris',approach:'challenge'}).status).toBe(403);
  expect(executeUniverse(s,'case-002',{kind:'talk',id:'boris',approach:'empathy'}).status).toBe(200);
  expect(universeView(s,'case-002').people.find(x=>x.id==='boris')?.attitude).toBe('доверчив');
  expect(executeUniverse(s,'case-002',{kind:'talk',id:'boris',approach:'empathy'}).status).toBe(409);
  expect(d.talks).toHaveLength(1);
 });
 it('restores only unlocked locations and tasks from player-editable backup data',()=>{
  const s=session(),draft=initialUniverse();
  draft['case-001'].location='office';draft['case-001'].visited=['station','office'];
  draft['case-001'].jobs=[{id:'finance',started:1,finish:3,done:true}];
  draft['case-001'].turn=4;draft['case-001'].credits=80;
  const denied=restoreUniverse(draft,s.found,[]);
  expect(denied['case-001'].location).toBe('station');
  expect(denied['case-001'].jobs).toHaveLength(0);
  s.found.add('E04');s.found.add('E09');
  const allowed=restoreUniverse(draft,s.found,[]);
  expect(allowed['case-001'].location).toBe('office');
  expect(allowed['case-001'].jobs.map(x=>x.id)).toEqual(['finance']);
  expect(restoreUniverse({cheat:true},s.found,[])).toEqual(initialUniverse());
 });
 it('accepts only enumerated actions and prevents tasks beyond last turn',()=>{
  const s=session();s.found.add('E03');
  expect(universeActionSchema.safeParse({kind:'talk',id:'elena',approach:'paid-ai'}).success).toBe(false);
  expect(universeActionSchema.safeParse({kind:'wait',cheat:true}).success).toBe(false);
  s.universe['case-001'].turn=59;
  expect(executeUniverse(s,'case-001',{kind:'assign',id:'phone'}).status).toBe(409);
  expect(executeUniverse(s,'case-001',{kind:'wait'}).status).toBe(200);
  expect(executeUniverse(s,'case-001',{kind:'wait'}).status).toBe(409);
 });
});
