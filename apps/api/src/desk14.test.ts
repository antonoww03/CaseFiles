import { describe, expect, it } from 'vitest';
import type { StoredSession } from './storage.js';
import { deskActionSchema, deskView, performDeskAction } from './desk14.js';

function session():StoredSession {
 return {
  found:new Set<string>(['E03']),
  living:{reputation:60,events:[],case2:{found:[],verdict:null,accusations:0},custom:null,customProgress:{verdict:null,found:[],accusations:0},court:null},
  finalReport:null,
  expansion:{attempts:[]},
  game09:{events:[]}
 } as unknown as StoredSession;
}

describe('CASEFILES 1.4 investigation desk',()=>{
 it('withholds unconfirmed assessments and does not leak outcomes',()=>{
  const s=session();
  const view=deskView(s,'case-001');
  const elena=view.profiles.find(p=>p.id==='elena')!;
  expect(elena.knownEvidence).toEqual(['E03']);
  expect(elena.ready).toBe(false);
  expect(elena.conclusion).toBe(null);
  expect(view.editorialAvailable).toBe(false);
  expect(view.news.some(x=>x.id==='verdict')).toBe(false);
 });
 it('requires both unlocked evidence items and only accepts a related clue',()=>{
  const s=session();
  expect(performDeskAction(s,'case-001',{kind:'profile',personId:'elena',evidenceId:'E11'}).status).toBe(403);
  expect(performDeskAction(s,'case-001',{kind:'profile',personId:'elena',evidenceId:'E03'}).status).toBe(403);
  s.found.add('E11');
  expect(performDeskAction(s,'case-001',{kind:'profile',personId:'martin',evidenceId:'E03'}).status).toBe(422);
  expect(performDeskAction(s,'case-001',{kind:'profile',personId:'elena',evidenceId:'E03'}).status).toBe(200);
  expect(deskView(s,'case-001').profiles.find(p=>p.id==='elena')?.confirmed).toBe(true);
  expect(performDeskAction(s,'case-001',{kind:'profile',personId:'elena',evidenceId:'E03'}).status).toBe(409);
 });
 it('blocks early reporting and requires an irreversible editorial choice',()=>{
  const s=session();
  expect(performDeskAction(s,'case-001',{kind:'publish',style:'sensation'}).status).toBe(403);
  s.finalReport={ending:'solved'};
  expect(performDeskAction(s,'case-001',{kind:'publish',style:'facts'}).status).toBe(200);
  expect(s.living.reputation).toBe(65);
  expect(performDeskAction(s,'case-001',{kind:'publish',style:'sensation'}).status).toBe(409);
  expect(s.living.reputation).toBe(65);
  expect(deskView(s,'case-001').edition?.style).toBe('facts');
 });
 it('maintains separate outcomes for the two cases',()=>{
  const s=session();
  s.living.case2.found=['C3','C4'];
  expect(deskView(s,'case-002').profiles.find(p=>p.id==='boris')?.ready).toBe(true);
  expect(deskView(s,'case-001').solved).toBe(false);
  s.living.case2.verdict='solved';
  expect(performDeskAction(s,'case-002',{kind:'publish',style:'sensation'}).status).toBe(200);
  expect(s.living.reputation).toBe(48);
  expect(deskView(s,'case-001').edition).toBe(null);
  expect(deskView(s,'case-002').edition?.style).toBe('sensation');
 });
 it('validates action payloads and cannot publish an unknown style',()=>{
  expect(deskActionSchema.safeParse({kind:'publish',style:'unknown'}).success).toBe(false);
  expect(deskActionSchema.safeParse({kind:'profile',personId:'elena',evidenceId:'E03',admin:true}).success).toBe(false);
 });
});
