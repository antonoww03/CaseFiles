import {describe,expect,it} from 'vitest';
import {actionSchema,initialProgress,puzzles,unlocks,canEnter,achievements,outcome,timelineItems,difficultySchema,classificationTargets,witnesses} from './expansion.js';
describe('casefiles expansion systems',()=>{
 it('provides 7 independent puzzle categories and valid solutions',()=>{
  expect(puzzles).toHaveLength(7);
  expect(new Set(puzzles.map(p=>p.type)).size).toBe(7);
  for(const p of puzzles)expect(Number(p.solution)).toBeLessThan(p.choices.length);
 });
 it('does not unlock gated locations prematurely',()=>{
  const empty=new Set<string>();
  expect(canEnter('apartment',empty)).toBe(true);
  expect(canEnter('office',empty)).toBe(false);
  expect(canEnter('office',new Set(['E04']))).toBe(true);
  expect(canEnter('unknown',empty)).toBe(false);
  expect(unlocks).toHaveLength(4);
 });
 it('rejects arbitrary action payloads, scores and difficulty values',()=>{
  expect(actionSchema.safeParse({kind:'suspect',id:'martin',score:99}).success).toBe(true);
  expect(actionSchema.safeParse({kind:'suspect',id:'martin',score:101}).success).toBe(false);
  expect(actionSchema.safeParse({kind:'puzzle',id:'uv',answer:'1'}).success).toBe(true);
  expect(actionSchema.safeParse({kind:'puzzle',id:'uv',answer:1}).success).toBe(false);
  expect(difficultySchema.safeParse('expert').success).toBe(true);
  expect(difficultySchema.safeParse('impossible').success).toBe(false);
 });
 it('separates fact, testimony and hypothesis and preserves required evidence',()=>{
  expect(classificationTargets).toHaveLength(4);
  expect(classificationTargets.map(x=>x.correct)).toContain('hypothesis');
  expect(witnesses).toHaveLength(2);
  expect(witnesses.every(w=>w.requires.length>0)).toBe(true);
  expect(timelineItems).toHaveLength(6);
 });
 it('keeps initial progress clean and limits spoiler ratings to solved cases',()=>{
  const p=initialProgress();
  expect(p.actions).toEqual([]);
  expect(p.milestones).toEqual([]);
  expect(p.difficulty).toBe('detective');
  expect(outcome(false,0,100)).toBe('Продължаващо разследване');
  expect(outcome(true,0,90)).toBe('Пълно разкритие');
  expect(outcome(true,1,90)).toBe('Доказано обвинение');
 });
 it('awards achievements only for earned milestones and real progress',()=>{
  const none=achievements(new Set(),new Set(),new Set(),[],0,false);
  expect(none.every(x=>!x.done)).toBe(true);
  const earned=achievements(new Set(['E01']),new Set(['D01','D02','D03']),new Set(['C01']),['fingerprints','audio'],1,true);
  expect(earned.find(x=>x.id==='first-evidence')?.done).toBe(true);
  expect(earned.find(x=>x.id==='lab')?.done).toBe(true);
  expect(earned.find(x=>x.id==='perfect')?.done).toBe(true);
 });
});
