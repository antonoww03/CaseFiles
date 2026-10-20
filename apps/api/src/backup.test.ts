import {describe,expect,it} from 'vitest';
import {initialProgress} from './expansion.js';
import {backupSchema,exportBackup,applyBackup} from './backup.js';
import type {StoredSession} from './storage.js';
function sample():StoredSession{
 return {id:'b93c9ace-a993-44a0-8b6a-7e9b565ddf66',found:new Set(['E01','E03','E04','E05','E06','E08','E09']),
 links:new Set(['D01','D02']),notes:[],verified:new Set(),
 analyses:new Set(['video:elevator','document:draft']),pressure:{martin:41},hintsUsed:1,accusationCount:0,finalReport:null,
 expansion:initialProgress(),messages:{martin:[{role:'player',text:'Къде бяхте?'},{role:'npc',text:'У дома.'}]},disclosed:{},lastActive:Date.now(),interviewCount:1,aiCalls:0,interviewBusy:false};
}
describe('portable case backup',()=>{
 it('round trips valid progress while disabling paid AI for imported saves',()=>{
  const s=sample();s.expansion.milestones=['fingerprints','route'];
  s.expansion.suspects.martin=85;s.expansion.attempts=[{at:new Date().toISOString(),result:'insufficient',selected:'martin'}];
  const exported=exportBackup(s);expect(backupSchema.parse(exported).format).toBe('casefiles-backup-v1');
  const dest=sample();dest.found.clear();dest.links.clear();applyBackup(dest,exported);
  expect(dest.found.has('E09')).toBe(true);
  expect(dest.links.has('D01')).toBe(true);
  expect(dest.expansion.milestones).toContain('fingerprints');
  expect(dest.expansion.suspects.martin).toBe(85);
  expect(dest.expansion.attempts).toHaveLength(1);
  expect(dest.aiCalls).toBe(25);
 });
 it('rejects malformed documents and ignores inconsistent evidence relationships',()=>{
  const s=sample();const value=exportBackup(s);
  expect(()=>applyBackup(sample(),{...value,format:'unknown'})).toThrow();
  const destination=sample();
  applyBackup(destination,{...value,found:['E01'],links:['D01'],verified:['C01'],analyses:['video:elevator']});
  expect(destination.links.size).toBe(0);
  expect(destination.verified.size).toBe(0);
  expect(destination.analyses.size).toBe(0);
 });
 it('does not restore a forged solved report without its backing evidence',()=>{
  const s=sample();
  const b=exportBackup(s);
  const result=sample();
  applyBackup(result,{...b,solved:true,found:['E01','E04'],links:['D01']});
  expect(result.finalReport).toBeNull();
 });
});
