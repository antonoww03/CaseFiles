import { z } from 'zod';
import { evidence, evaluate } from './case.js';
import { deductions } from './deductions.js';
import { contradictions, noteSchema, scoreCase, availableContradictions } from './gameplay.js';
import { puzzles, witnesses, timelineItems, classificationTargets, tutorial, difficultySchema, initialProgress, outcome } from './expansion.js';
import { actualCaseTimeline } from './forensics.js';
import { newImmersiveState, sceneObjects, tools as sceneTools, combinations, dialogueOptions } from './immersive.js';
import type { StoredSession } from './storage.js';

const lineSchema = z.object({role:z.enum(['player','npc']),text:z.string().min(1).max(2500)});
const noteBackup = noteSchema.extend({id:z.string().uuid(),updatedAt:z.string().max(40)});
const immersiveBackup = z.object({
 inventory:z.array(z.string().max(32)).max(5),
 inspected:z.array(z.string().max(32)).max(6),
 solved:z.array(z.string().max(32)).max(5),
 discoveries:z.array(z.string().max(32)).max(5),
 trust:z.record(z.number().int().min(0).max(100)),
 dialogue:z.array(z.object({
  personId:z.string().max(30),choiceId:z.string().max(40),
  reply:z.string().max(1000),at:z.string().max(40)
 })).max(32),
 dialogueFlags:z.array(z.string().max(40)).max(32),
 terminalSearches:z.number().int().min(0).max(9999)
});

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
 solved:z.boolean(),
 immersive:immersiveBackup.optional(),
 expansion:z.object({
  difficulty:difficultySchema,
  milestones:z.array(z.string().max(35)).max(20),
  suspicions:z.record(z.number().int().min(0).max(100)),
  placements:z.record(z.string().max(30)),
  classifications:z.record(z.enum(['observation','testimony','hypothesis'])),
  tutorial:z.array(z.string().max(30)).max(4),
  uiSettings:z.object({sound:z.boolean(),reducedMotion:z.boolean()}),
  actions:z.array(z.object({at:z.string().max(40),kind:z.string().max(30),text:z.string().max(300)})).max(120),
  attempts:z.array(z.object({at:z.string().max(40),result:z.string().max(20),selected:z.string().max(20)})).max(30)
 })
}).strict();
export type PortableBackup = z.infer<typeof backupSchema>;

export function exportBackup(session:StoredSession):PortableBackup {
 return {
  format:'casefiles-backup-v1',version:1,
  found:[...session.found],links:[...session.links],verified:[...session.verified],
  analyses:[...session.analyses],notes:session.notes,
  messages:session.messages as PortableBackup['messages'],
  pressure:session.pressure,hintsUsed:session.hintsUsed,solved:!!session.finalReport,
  immersive:session.immersive,
  expansion:{
   difficulty:session.expansion.difficulty,
   milestones:session.expansion.milestones,
   suspicions:session.expansion.suspects,
   placements:session.expansion.placements,
   classifications:session.expansion.classifications as PortableBackup['expansion']['classifications'],
   tutorial:session.expansion.tutorial,
   uiSettings:session.expansion.uiSettings,
   actions:session.expansion.actions,
   attempts:session.expansion.attempts
  }
 };
}

export function applyBackup(session:StoredSession,raw:unknown):string[] {
 const value=backupSchema.parse(raw);
 const validIds=new Set<string>(evidence.map(x=>x.id));
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
 next.actions=value.expansion.actions;
 next.attempts=value.expansion.attempts.filter(x=>['solved','incorrect','insufficient'].includes(x.result)&&['martin','elena','petar'].includes(x.selected));
 const allowedHints=({rookie:3,detective:2,expert:1})[next.difficulty];
 session.found=found;
 session.links=links;
 session.verified=verified;
 session.notes=value.notes;
 session.messages=Object.fromEntries(Object.entries(value.messages).filter(([id])=>['martin','elena','petar'].includes(id)));
 session.disclosed={};
 session.analyses=new Set(value.analyses.filter(x=>{
  const required=({ 'video:elevator':'E06', 'video:exit':'E07', 'document:draft':'E09', 'document:access':'E10' } as Record<string,string>)[x];
  return !!required&&found.has(required);
 }));
 session.pressure=Object.fromEntries(Object.entries(value.pressure).filter(([id])=>['martin','elena','petar'].includes(id)));
 session.hintsUsed=Math.min(value.hintsUsed,allowedHints);
 session.expansion=next;
 const immersive=newImmersiveState();
 if(value.immersive){
  const visited=new Set(value.immersive.inspected);
  immersive.inspected=sceneObjects.filter(o=>
   visited.has(o.id)&&(!o.prerequisite||found.has(o.prerequisite))&&
   (!o.requiresItem||sceneObjects.some(other=>other.item===o.requiresItem&&visited.has(other.id)))
  ).map(o=>o.id);
  const unlocked=new Set(sceneObjects.filter(o=>immersive.inspected.includes(o.id)).map(o=>o.item));
  immersive.inventory=sceneTools.filter(t=>unlocked.has(t.id)).map(t=>t.id);
  immersive.discoveries=combinations.filter(co=>value.immersive!.discoveries.includes(co.id)&&
    immersive.inventory.includes(co.first)&&immersive.inventory.includes(co.second)).map(co=>co.id);
  immersive.solved=immersive.discoveries.includes('uv_marker')&&value.immersive.solved.includes('safe_dial')?['safe_dial']:[];
  immersive.trust=Object.fromEntries(Object.entries(value.immersive.trust).filter(([id])=>['martin','elena','petar'].includes(id)));
  for(const id of ['martin','elena','petar'])immersive.trust[id]??=newImmersiveState().trust[id];
  immersive.dialogue=value.immersive.dialogue.filter(d=>dialogueOptions.some(option=>option.id===d.choiceId&&option.personId===d.personId&&
    option.needs.every(id=>found.has(id))));
  immersive.dialogueFlags=[...new Set(immersive.dialogue.map(d=>d.choiceId))];
  immersive.terminalSearches=value.immersive.terminalSearches;
 }
 session.immersive=immersive;
 session.finalReport=null;
 session.accusationCount=next.attempts.length;
 session.aiCalls=25;
 session.interviewCount=Math.min(80,Object.values(session.messages).reduce((count,lines)=>count+Math.floor(lines.length/2),0));
 if(value.solved && evaluate('martin',[...found],'Финансови несъответствия в документите','Последователност на записите от вечерта',[...links]).status==='solved'){
  const score=scoreCase({found,links,interviews:session.messages,verified,verdict:'solved'});
  const penalty=Math.min(20,session.hintsUsed*({rookie:2,detective:4,expert:6})[next.difficulty]+Math.max(0,session.accusationCount-1)*3);
  const finalScore={...score,total:Math.max(0,score.total-penalty),penalty};
  session.finalReport={
   status:'solved',headline:'Разследването е приключено',
   conclusion:'Съвкупността от финансовия мотив, времевите записи и доказателствените връзки подкрепя обвинението срещу Мартин Русев.',
   timeline:actualCaseTimeline,collected:[...found],
   missed:evidence.filter(x=>!found.has(x.id)).map(x=>({id:x.id,title:x.title})),
   verifiedFindings:availableContradictions(found).filter(x=>verified.has(x.id)).map(x=>({id:x.id,title:x.title,finding:x.finding})),
   score:finalScore,hintsUsed:session.hintsUsed,accusations:session.accusationCount,
   ending:outcome(true,next.attempts.filter(x=>x.result==='incorrect').length,finalScore.total)
  };
 }
 session.lastActive=Date.now();
 return [...found];
}
