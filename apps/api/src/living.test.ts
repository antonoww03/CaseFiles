import { describe, expect, it } from 'vitest';
import {initialLiving,case002,caseTemplateSchema,caseCatalog,solveCase,publicStory,canWarrant,capture,canAdmit,progressTick,visibility,transactions} from './living.js';
describe('Living Investigation 0.7',()=>{
 it('validates independent story templates and does not disclose solutions by default',()=>{
  expect(caseCatalog).toHaveLength(2);
  expect(case002.clues).toHaveLength(6);
  expect(case002.suspects).toHaveLength(3);
  const p=initialLiving().case2;
  const publicData=publicStory(case002,p);
  expect(JSON.stringify(publicData)).not.toContain(case002.solution.explanation);
  expect(publicData.clues.every(c=>c.description===null)).toBe(true);
  const custom={...case002,id:'custom-test'};
  expect(caseTemplateSchema.safeParse(custom).success).toBe(true);
  expect(caseTemplateSchema.safeParse({...custom,solution:{...custom.solution,suspectId:'fake'}}).success).toBe(false);
 });
 it('supports playable distinct mystery and requires 3 supporting clues',()=>{
  const state=initialLiving().case2;
  state.found=['C1','C2','C3','C4','C5','C6'];
  expect(solveCase(state,case002,'boris',['C1','C2','C3'])).toBe('insufficient');
  expect(solveCase(state,case002,'raya',['C2','C3','C4','C6'])).toBe('incorrect');
  expect(solveCase(state,case002,'boris',['C2','C3','C4','C6'])).toBe('solved');
  state.verdict='solved';
  expect(publicStory(case002,state).ending).toContain('Борис');
 });
 it('requires evidence and reputation for an in-game warrant',()=>{
  expect(canWarrant('office',new Set(['E04']),60)).toBe(false);
  expect(canWarrant('office',new Set(['E04','E09']),30)).toBe(false);
  expect(canWarrant('office',new Set(['E04','E09']),60)).toBe(true);
 });
 it('tracks timestamped evidence and respects lawful provenance',()=>{
  const state=initialLiving();
  capture(state,'E04','Оглед','Всекидневна',true,'2026-10-20T10:00:00.000Z');
  capture(state,'E04','Повторен оглед','Същата стая');
  expect(state.chain).toHaveLength(1);
  expect(canAdmit(state,'E04')).toBe(true);
  capture(state,'E09','Неизвестно','Чужда папка',false);
  expect(canAdmit(state,'E09')).toBe(false);
 });
 it('unlocks clock events using game actions, not real-world waiting',()=>{
  const state=initialLiving();
  for(let i=0;i<9;i++)progressTick(state);
  expect(state.phase).toBe(3);
  expect(state.events).toEqual(['phone','witness','letter']);
 });
 it('does not spoil reports or secret dossiers before investigation',()=>{
  const state=initialLiving();
  const status=visibility(state,new Set());
  expect(status.secrets.every(s=>!s.unlocked)).toBe(true);
  expect(status.experts.every(e=>e.report===null)).toBe(true);
  expect(status.transactions.every(t=>t.flag===null)).toBe(true);
  expect(status.case2.found).toHaveLength(0);
  expect(transactions).toHaveLength(4);
 });
});
