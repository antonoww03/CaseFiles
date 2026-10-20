import { z } from 'zod';
import { evidence } from './case.js';
import { deductions } from './deductions.js';
import { contradictions, noteSchema } from './gameplay.js';
import { puzzles, witnesses, timelineItems, classificationTargets, tutorial, difficultySchema, initialProgress } from './expansion.js';
import type { StoredSession } from './storage.js';

const lineSchema = z.object({role:z.enum(['player','npc']),text:z.string().min(1).max(2500)});
const noteBackup = noteSchema.extend({id:z.string().uuid(),updatedAt:z.string().max(40)});
export const backupSchema = z.object({
 format:z.literal('casefiles-backup-v1'),
 version:z.literal(1),
 found:z.array(z.string().max(10)).max(12),
 links:z.array(z.string().max(10)).max(5),
 verified:z.array(z.string().max(10)).max(2),
 analyses:z.array(z.string().max(50)).max(20),
 notes:z.array(noteBackup).max(35),
 messages:z.record(z.array(lineSchema).max(40)),
 pressure:z.record(z.number().int().min(0).max(100)),
 hintsUsed:z.number().int().min(0).max(3),
 expansion:z.object({
  difficulty:difficultySchema,
  milestones:z.array(z.string().max(35)).max(20),
  suspicions:z.record(z.number().int().min(0).max(100)),
  placements:z.record(z.string().max(30)),
  classifications:z.record(z.enum(['observation','testimony','hypothesis'])),
  tutorial:z.array(z.string().max(30)).max(4),
  uiSettings:z.object({sound:z.boolean(),reducedMotion:z.boolean()})
 })
}).strict();
export type PortableBackup = z.infer<typeof backupSchema>;

export function exportBackup(session:StoredSession):PortableBackup {
 return {
  format:'casefiles-backup-v1',version:1,
  found:[...session.found],links:[...session.links],verified:[...session.verified],
  analyses:[...session.analyses],notes:session.notes,
  messages:session.messages as PortableBackup['messages'],
  pressure:session.pressure,hintsUsed:session.hintsUsed,
  expansion:{
   difficulty:session.expansion.difficulty,
   milestones:session.expansion.milestones,
   suspicions:session.expansion.suspects,
   placements:session.expansion.placements,
   classifications:session.expansion.classifications as PortableBackup['expansion']['classifications'],
   tutorial:session.expansion.tutorial,
   uiSettings:session.expansion.uiSettings
  }
 };
}

export function applyBackup(session:StoredSession,raw:unknown):string[] {
 const value=backupSchema.parse(raw);
 const validIds=new Set(evidence.map(x=>x.id));
 const found=new Set(value.found.filter(x=>validIds.has(x)));
 const links=new Set(value.links.filter(x=>deductions.some(d=>d.id===x&&d.evidenceIds.every(e=>found.has(e)))));
 const verified=new Set(value.verified.filter(x=>contradictions.some(d=>d.id===x&&d.evidenceIds.every(e=>found.has(e)))));
 const knownMilestones=new Set([
  ...puzzles.filter(p=>p.requires.every(x=>found.has(x))).map(p=>p.id),
  ...witnesses.filter(w=>w.requires.every(x=>found.has(x))).map(w=>'witness:'+w.id)
 ]);
 const next=initialProgress();
 next.difficulty=value.expansion.difficulty;
 next.milestones=[...new Set(value.expansion.milestones.filter(x=>knownMilestones.has(x)))];
 next.suspects=Object.fromEntries(Object.entries(value.expansion.suspicions).filter(([key])=>['martin','elena','petar'].includes(key)));
 for(const id of ['martin','elena','petar'])next.suspects[id]??=50;
 next.placements=Object.fromEntries(Object.entries(value.expansion.placements).filter(([id,time])=>timelineItems.some(t=>t.id===id&&t.time===time&&found.has(t.requires))));
 next.classifications=Object.fromEntries(Object.entries(value.expansion.classifications).filter(([id,answer])=>classificationTargets.some(t=>t.id===id&&t.correct===answer&&(t.id==='H01'||found.has(t.id)))));
 next.tutorial=[...new Set(value.expansion.tutorial.filter(x=>tutorial.some(t=>t.id===x)))];
 next.uiSettings=value.expansion.uiSettings;
 const allowedHints=({rookie:3,detective:2,expert:1})[next.difficulty];
 session.found=found;
 session.links=links;
 session.verified=verified;
 session.notes=value.notes;
 session.messages=Object.fromEntries(Object.entries(value.messages).filter(([id])=>['martin','elena','petar'].includes(id)));
 session.disclosed={};
 session.analyses=new Set(value.analyses.filter(x=>/^video:(elevator|exit)$|^document:(draft|access)$/.test(x)));
 session.pressure=Object.fromEntries(Object.entries(value.pressure).filter(([id])=>['martin','elena','petar'].includes(id)));
 session.hintsUsed=Math.min(value.hintsUsed,allowedHints);
 session.expansion=next;
 session.finalReport=null;
 session.accusationCount=0;
 session.aiCalls=25;
 session.interviewCount=Math.min(80,Object.values(session.messages).reduce((count,lines)=>count+Math.floor(lines.length/2),0));
 session.lastActive=Date.now();
 return [...found];
}
