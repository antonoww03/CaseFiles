import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { publicCase, evidence, accusationSchema, messageSchema, evaluate } from './case.js';
import { aiReply, configuredMode, scriptedReply, type InterviewLine } from './interview.js';
import { deductions, findDeduction } from './deductions.js';
import { suspects, contradictions, noteSchema, availableContradictions, scoreCase } from './gameplay.js';
import { clipObservations, documents, observationSchema, frameFor, verifyObservation, documentPage, hintLevels, actualCaseTimeline } from './forensics.js';
import { initialProgress, puzzles, actionSchema, unlocks, witnesses, classificationTargets, timelineItems, tutorial, difficultySchema, canEnter, achievements, outcome } from './expansion.js';
import { exportBackup, applyBackup } from './backup.js';
import { newImmersiveState, immersiveSnapshot, interactionSchema, interaction, dialogueSchema, chooseDialogue, searchSchema, searchRecords } from './immersive.js';
import { initialLiving, visibility, capture, progressTick, canWarrant, canAdmit, warrantDefinitions, expertDefinitions, confrontationDefinitions, transactions, caseCatalog, case002, caseTemplateSchema, publicStory, solveCase, warrantAction, expertAction, confrontationAction, financeAction, policyAction, courtAction, caseAction } from './living.js';
import { initialCinematic, cinematicOverview, cinematicActionSchema, useCinematicChoice, profileSnapshot } from './cinematic.js';
import { newGame09, game09View, game09Action, evaluateGame09 } from './game09.js';
import { snapshot10, releaseActionSchema, evaluateRelease10 } from './release10.js';
import {worldSnapshot,examineSchema,executeWorld} from './experience11.js';
import {directorView,directorSchema,applyDirector} from './director12.js';
import { initializeStorage, persistentStorageEnabled, restoreSession, saveSession, type StoredSession } from './storage.js';

type Session = StoredSession;
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
const sessions = new Map<string, Session>();
const quotas = new Map<string, { start: number; count: number }>();
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function useQuota(key: string, limit: number, durationMs: number): boolean {
  const now = Date.now();
  const entry = quotas.get(key);
  if (!entry || now - entry.start > durationMs) {
    quotas.set(key, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function cleanExpired() {
  const now = Date.now();
  for (const [id, session] of sessions) if (now - session.lastActive > SESSION_TTL_MS) sessions.delete(id);
  for (const [key, entry] of quotas) if (now - entry.start > 24 * 60 * 60 * 1000) quotas.delete(key);
}
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173' }));
app.use('/api/backup/restore', express.json({ limit: '512kb' }));
app.use(express.json({ limit: '16kb' }));
app.use('/api', async (req, res, next) => {
  const id = req.header('x-case-session');
  if (!id || sessions.has(id) || !persistentStorageEnabled()) return void next();
  try {
    const saved = await restoreSession(id);
    if (saved) sessions.set(id, saved);
    next();
  } catch {
    res.status(503).json({ error: 'Временно не можем да възстановим сесията.' });
  }
});

function getSession(req: express.Request, res: express.Response): Session | undefined {
  const id = req.header('x-case-session');
  const session = id ? sessions.get(id) : undefined;
  if (!session || Date.now() - session.lastActive > SESSION_TTL_MS) {
    if (id) sessions.delete(id);
    res.status(401).json({ error: 'Невалидна или изтекла сесия.' });
    return undefined;
  }
  session.lastActive = Date.now();
  return session;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: configuredMode() === 'ai-live' ? 'ai-configured' : 'scripted-demo', storage: persistentStorageEnabled() ? 'postgres' : 'memory' }));
app.get('/api/case', (_req, res) => res.json(publicCase));
app.post('/api/session', async (req, res) => {
  cleanExpired();
  if (sessions.size >= 500 || !useQuota('new-session:' + req.ip, process.env.CASEFILES_E2E === 'true' ? 100 : 10, 60 * 60 * 1000)) {
    return void res.status(429).json({ error: 'Твърде много нови сесии. Опитай по-късно.' });
  }
  const id = randomUUID();
  sessions.set(id, {
    id, found: new Set(), links: new Set(), notes: [], verified: new Set(), analyses: new Set(), pressure: {}, hintsUsed: 0, accusationCount: 0, finalReport: null, expansion: initialProgress(), immersive: newImmersiveState(), living: initialLiving(), cinematic: initialCinematic(), game09: newGame09(), messages: {}, disclosed: {}, lastActive: Date.now(),
    interviewCount: 0, aiCalls: 0, interviewBusy: false
  });
  try { await saveSession(sessions.get(id)!); } catch {
    sessions.delete(id);
    return void res.status(503).json({ error: 'Сесията не можа да бъде записана.' });
  }
  res.status(201).json({ sessionId: id, found: [] });
});
app.get('/api/session', (req, res) => {
  const session = getSession(req, res);
  if (session) res.json({ found: [...session.found], links: [...session.links], notes: session.notes, verified: [...session.verified], analyses: [...session.analyses], pressure: session.pressure, hintsUsed: session.hintsUsed, solved: !!session.finalReport, messages: session.messages });
});
const logDecision = (session:Session, kind:string, text:string) => {
  session.expansion.actions.push({ at:new Date().toISOString(), kind, text });
  session.expansion.actions = session.expansion.actions.slice(-120);
};
const expansionView = (session:Session) => {
 const progress=session.expansion;
 return {
  difficulty:progress.difficulty,
  puzzles:puzzles.map(({solution,...p})=>({...p, solved:progress.milestones.includes(p.id), available:p.requires.every(x=>session.found.has(x))})),
  locations:unlocks.map(p=>({...p, unlocked:canEnter(p.id,session.found)})),
  witnesses:witnesses.map(p=>({...p, available:p.requires.every(x=>session.found.has(x)), interviewed:progress.milestones.includes('witness:'+p.id), statement:progress.milestones.includes('witness:'+p.id)?p.statement:null})),
  classifications:classificationTargets.map(x=>({id:x.id,label:x.label,completed:Object.hasOwn(progress.classifications,x.id),answer:progress.classifications[x.id]||null,available:x.id==='H01'||session.found.has(x.id)})),
  timeline:timelineItems.map(x=>({...x,available:session.found.has(x.requires),completed:progress.placements[x.id]===x.time})),
  tutorial:tutorial.map(x=>({...x,done:progress.tutorial.includes(x.id)})),
  achievements:achievements(session.found,session.links,session.verified,progress.milestones,progress.attempts.length,!!session.finalReport),
  suspicions:progress.suspects, actions:progress.actions,
  attempts:progress.attempts,
  rating:session.finalReport?{title:outcome(true,progress.attempts.filter(x=>x.result==='incorrect').length,Number((session.finalReport as {score?:{total?:number}}).score?.total||0)),level:progress.difficulty}:null,
  settings:progress.uiSettings,
  timelineSolved:timelineItems.every(x=>!session.found.has(x.requires)||progress.placements[x.id]===x.time)
 };
};
app.get('/api/cases', (_req,res)=>res.json(caseCatalog));
app.get('/api/director12/:caseId',(req,res)=>{
 const session=getSession(req,res);if(!session)return;
 const caseId=req.params.caseId;
 if(caseId!=='case-001'&&caseId!=='case-002')return void res.status(404).json({error:'Непознат случай.'});
 res.json(directorView(session,caseId));
});
app.post('/api/director12/:caseId/action',async(req,res)=>{
 const session=getSession(req,res);if(!session)return;
 const caseId=req.params.caseId;
 if(caseId!=='case-001'&&caseId!=='case-002')return void res.status(404).json({error:'Непознат случай.'});
 if(!useQuota('director12:'+req.ip,90,60*60*1000))return void res.status(429).json({error:'Превишен лимит.'});
 const parsed=directorSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно действие.'});
 const previous=structuredClone(session.game09);
 const result=applyDirector(session,caseId,parsed.data);
 if(result.status!==200)return void res.status(result.status).json({error:result.message});
 try{await saveSession(session);}catch{
  session.game09=previous;return void res.status(503).json({error:'Сесията не може да се запази.'});
 }
 res.json({message:result.message,story:directorView(session,caseId)});
});
app.get('/api/experience11',(req,res)=>{
 const session=getSession(req,res);if(session)res.json(worldSnapshot(session));
});
app.post('/api/experience11/action',async(req,res)=>{
 const session=getSession(req,res);if(!session)return;
 if(!useQuota('experience11:'+req.ip,130,60*60*1000))return void res.status(429).json({error:'Превишен лимит на проверки.'});
 const parsed=examineSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно игрово действие.'});
 const beforeImmersive=structuredClone(session.immersive);
 const beforeLinks=new Set(session.links);
 const result=executeWorld(session,parsed.data);
 if(result.status!==200)return void res.status(result.status).json({error:result.message});
 try{await saveSession(session);}catch{
  session.immersive=beforeImmersive;session.links=beforeLinks;
  return void res.status(503).json({error:'Промяната не е запазена.'});
 }
 res.json({message:result.message,world:worldSnapshot(session)});
});
app.get('/api/release10',(req,res)=>{
 const session=getSession(req,res);
 if(session)res.json(snapshot10(session));
});
app.post('/api/release10/action',async(req,res)=>{
 const session=getSession(req,res);if(!session)return;
 if(!useQuota('release10:'+req.ip,120,60*60*1000))return void res.status(429).json({error:'Превишен лимит.'});
 const parsed=releaseActionSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно действие.'});
 const oldGame=structuredClone(session.game09),oldCase=structuredClone(session.living.case2);
 const result=evaluateRelease10(session,parsed.data);
 if(result.status!==200)return void res.status(result.status).json({error:result.message});
 try{await saveSession(session);}catch{session.game09=oldGame;session.living.case2=oldCase;return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.json({message:result.message,progress:snapshot10(session)});
});
app.get('/api/game09',(req,res)=>{
 const session=getSession(req,res);
 if(session)res.json(game09View(session));
});
app.post('/api/game09/action',async(req,res)=>{
 const session=getSession(req,res);if(!session)return;
 if(!useQuota('game09:'+req.ip,200,60*60*1000))return void res.status(429).json({error:'Твърде много действия.'});
 const parsed=game09Action.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно игрово действие.'});
 const before=structuredClone(session.game09);
 const result=evaluateGame09(session,parsed.data);
 if(result.status!==200&&result.status!==422)return void res.status(result.status).json({error:result.message});
 try{await saveSession(session);}catch{session.game09=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
 if(result.status===422)return void res.status(422).json({error:result.message,progress:game09View(session)});
 res.json({message:result.message,progress:game09View(session)});
});
app.get('/api/cinematic',(req,res)=>{
 const s=getSession(req,res);if(s)res.json(cinematicOverview(s));
});
app.get('/api/profile',(req,res)=>{
 const s=getSession(req,res);if(s)res.json(profileSnapshot(s));
});
app.post('/api/cinematic/action',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 if(!useQuota('cinematic:'+req.ip,160,60*60*1000))return void res.status(429).json({error:'Превишен лимит на игрови действия.'});
 const parsed=cinematicActionSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно действие.'});
 const before=structuredClone(s.cinematic);
 const out=useCinematicChoice(s,parsed.data);
 if(out.status!==200)return void res.status(out.status).json({error:out.message});
 try{await saveSession(s);}catch{s.cinematic=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.json({message:out.message,progress:cinematicOverview(s)});
});
app.get('/api/living', (req,res)=>{
 const s=getSession(req,res);if(s)res.json(visibility(s.living,s.found));
});
app.get('/api/living/case/:id',(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 const template=req.params.id==='case-002'?case002:s.living.custom?.id===req.params.id?s.living.custom:null;
 if(!template)return void res.status(404).json({error:'Няма такъв случай.'});
 const state=req.params.id==='case-002'?s.living.case2:s.living.customProgress;
 res.json(publicStory(template,state));
});
app.post('/api/living/case/editor',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 const parsed=caseTemplateSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидна история. Нужни са 3 заподозрени, 5–8 различни улики и последователно решение.'});
 if(s.living.customProgress.found.length)return void res.status(409).json({error:'За да смениш собствената история, започни нова сесия.'});
 const before=structuredClone(s.living);s.living.custom=parsed.data;
 try{await saveSession(s);}catch{s.living=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.status(201).json({id:parsed.data.id,title:parsed.data.title});
});
app.post('/api/living/case/action',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 const parsed=caseAction.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно действие по случая.'});
 const {caseId,action,id,evidenceIds=[]}=parsed.data;
 const template=caseId==='case-002'?case002:s.living.custom?.id===caseId?s.living.custom:null;
 if(!template)return void res.status(404).json({error:'Невалиден случай.'});
 const before=structuredClone(s.living);
 const state=caseId==='case-002'?s.living.case2:s.living.customProgress;
 const full=template.clues.map(x=>x.id);
 let message='';
 if(action==='discover'){
   if(!full.includes(id))return void res.status(404).json({error:'Неизвестна следа.'});
   if(full.indexOf(id)>=3&&state.found.length<2)return void res.status(403).json({error:'Първо намери две начални следи.'});
   if(!state.found.includes(id))state.found.push(id);
   message='Материалът е добавен към случая.';
 }else if(action==='interview'){
   if(!template.suspects.some(x=>x.id===id))return void res.status(404).json({error:'Неизвестен заподозрян.'});
   if(state.found.length<2)return void res.status(403).json({error:'Нужни са две следи преди разговора.'});
   if(!state.dialogue.includes(id))state.dialogue.push(id);
   message=template.suspects.find(x=>x.id===id)!.alibi;
 }else {
   if(!template.suspects.some(x=>x.id===id))return void res.status(404).json({error:'Неизвестен заподозрян.'});
   if(evidenceIds.some(x=>!state.found.includes(x)))return void res.status(403).json({error:'Използвай само открити доказателства.'});
   state.accusations++;
   state.verdict=solveCase(state,template,id,evidenceIds);
   message=state.verdict==='solved'?'Случаят е разрешен.':state.verdict==='incorrect'?'Това обвинение не се подкрепя от заключението.':'Необходима е по-силна доказателствена връзка.';
 }
 progressTick(s.living);
 try{await saveSession(s);}catch{s.living=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.json({message,story:publicStory(template,state)});
});
app.post('/api/living/action',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 if(!useQuota('living:'+req.ip,180,60*60*1000))return void res.status(429).json({error:'Превишен лимит на действията.'});
 const kind=req.body?.kind;
 const before=structuredClone(s.living);const l=s.living;
 let message='';
 if(kind==='warrant'){
  const parsed=warrantAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалидна заповед.'});
  const w=warrantDefinitions.find(w=>w.id===parsed.data.id)!;
  if(l.warrants.includes(w.id))return void res.status(409).json({error:'Вече има разрешение.'});
  if(!canWarrant(w.id,s.found,l.reputation)){l.denied.push(w.id);return void res.status(403).json({error:'Необходими са всички основания и репутация поне 35.'});}
  l.warrants.push(w.id);l.reputation=Math.min(100,l.reputation+3);
  message='Получено е игрово разрешение за '+w.place+'.';
 }else if(kind==='expert'){
  const parsed=expertAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалидна експертиза.'});
  const x=expertDefinitions.find(x=>x.id===parsed.data.id)!;
  if(x.needs.some(id=>!s.found.has(id)))return void res.status(403).json({error:'Липсват необходимите материали.'});
  if(!l.expertRequests.includes(x.id)){l.expertRequests.push(x.id);message='Експертизата е назначена. Резултатът ще е наличен след следващо игрово действие.';}
  else if(!l.experts.includes(x.id)&&l.actions>=3){l.experts.push(x.id);message=x.report;}
  else if(l.experts.includes(x.id))return void res.status(409).json({error:'Становището вече е готово.'});
  else message='Експертизата се обработва. Продължи разследването.';
 }else if(kind==='confront'){
  const parsed=confrontationAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалидна конфронтация.'});
  const x=confrontationDefinitions.find(x=>x.id===parsed.data.id)!;
  if(x.needs.some(id=>!s.found.has(id)))return void res.status(403).json({error:'Липсват доказателства.'});
  if(l.locked.includes(x.id))return void res.status(409).json({error:'Тази линия е необратимо затворена от предишно решение.'});
  if(l.confrontations.includes(x.id))return void res.status(409).json({error:'Конфронтацията вече е проведена.'});
  l.confrontations.push(x.id);
  if(x.id==='contact')l.secrets.push('elena');
  if(x.id==='invoices'&&l.experts.includes('financial'))l.secrets.push('martin');
  message=x.result;
 }else if(kind==='policy'){
  const parsed=policyAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалиден избор.'});
  const choice=parsed.data.choice;
  if(l.policy.includes(choice))return void res.status(409).json({error:'Този избор вече е направен.'});
  l.policy.push(choice);
  if(choice==='respect'){l.reputation=Math.min(100,l.reputation+10);message='Следването на процедурата подобри доверието в разследването.';}
  if(choice==='publicize'){l.reputation=Math.max(0,l.reputation-25);if(!l.confrontations.includes('contact'))l.locked.push('contact');message='Разпространението на неподкрепени обвинения намали репутацията и може да затвори разговора с Елена.';}
  if(choice==='force'){l.reputation=Math.max(0,l.reputation-20);if(!l.confrontations.includes('invoices'))l.locked.push('invoices');message='Непремереното действие намали репутацията и затвори една линия на разпит.';}
 }else if(kind==='finance'){
  const parsed=financeAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалидна транзакция.'});
  if(!s.found.has('E04'))return void res.status(403).json({error:'Първо открий кореспонденцията за фактурите.'});
  if(!l.warrants.includes('office'))return void res.status(403).json({error:'За детайлен преглед на архивните записи е необходимо разрешение.'});
  if(!l.financial.includes(parsed.data.id))l.financial.push(parsed.data.id);
  const t=transactions.find(t=>t.id===parsed.data.id)!;message=t.detail;
 }else if(kind==='court'){
  const parsed=courtAction.safeParse(req.body);if(!parsed.success)return void res.status(400).json({error:'Невалидна съдебна аргументация.'});
  const ids=[...new Set(parsed.data.evidenceIds)];
  if(ids.some(id=>!s.found.has(id)))return void res.status(403).json({error:'Можеш да представиш само събрани улики.'});
  const admissible=ids.filter(id=>canAdmit(l,id)&&(!['E09'].includes(id)||l.warrants.includes('office'))&&(!['E10'].includes(id)||l.warrants.includes('basement')));
  const groups=parsed.data.route==='financial'?[['E04','E09'],['E05','E10']]:[['E06','E07'],['E02','E08']];
  const supported=groups.every(g=>g.some(id=>admissible.includes(id)));
  const positive=l.reputation>=35&&admissible.length>=3&&supported&&l.experts.length>=1;
  l.courtAttempts++;
  l.court={outcome:positive?'Приети доказателства':'Върнато за допълване',reason:positive?'Прокурорът приема игровата аргументация по '+(parsed.data.route==='financial'?'финансовия':'времевия')+' път.':'Недостатъчно допустими доказателства, липсваща експертиза или увредена репутация.'};
  message=l.court.reason;
 }else return void res.status(400).json({error:'Неизвестно действие.'});
 progressTick(l);l.lastAction=message;
 if(l.experts.includes('video')&&!l.secrets.includes('petar'))l.secrets.push('petar');
 if(l.experts.includes('financial')&&l.confrontations.includes('invoices')&&!l.secrets.includes('martin'))l.secrets.push('martin');
 try{await saveSession(s);}catch{s.living=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.json({message,progress:visibility(l,s.found)});
});

app.get('/api/immersive', (req,res) => {
  const s = getSession(req,res);
  if (s) res.json(immersiveSnapshot(s.immersive, s.found));
});
app.post('/api/immersive/action',async(req,res)=>{
  const s=getSession(req,res); if(!s)return;
  if(!useQuota('immersive:'+req.ip,180,60*60*1000))return void res.status(429).json({error:'Твърде много действия.'});
  const parsed=interactionSchema.safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Невалидно взаимодействие.'});
  const prior=structuredClone(s.immersive);
  const result=interaction(s.immersive,s.found,parsed.data);
  if(result.status!==200)return void res.status(result.status).json({error:result.message});
  try{await saveSession(s);}catch{s.immersive=prior;return void res.status(503).json({error:'Неуспешно запазване.'});}
  res.json({message:result.message,progress:immersiveSnapshot(s.immersive,s.found)});
});
app.post('/api/immersive/dialogue',async(req,res)=>{
  const s=getSession(req,res);if(!s)return;
  const parsed=dialogueSchema.safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Невалиден избор.'});
  const prior=structuredClone(s.immersive);
  const result=chooseDialogue(s.immersive,s.found,parsed.data.choiceId);
  if(result.status!==200)return void res.status(result.status).json({error:result.message});
  try{await saveSession(s);}catch{s.immersive=prior;return void res.status(503).json({error:'Неуспешно запазване.'});}
  res.json({reply:result.message,progress:immersiveSnapshot(s.immersive,s.found)});
});
app.post('/api/immersive/computer/search',async(req,res)=>{
  const s=getSession(req,res);if(!s)return;
  if(!useQuota('computer:'+req.ip,100,60*60*1000))return void res.status(429).json({error:'Превишен лимит за търсене.'});
  const parsed=searchSchema.safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Въведи поне два символа, максимум 80.'});
  const results=searchRecords(s.found,parsed.data.query);
  const before=s.immersive.terminalSearches;
  s.immersive.terminalSearches=Math.min(before+1,9999);
  try{await saveSession(s);}catch{s.immersive.terminalSearches=before;return void res.status(503).json({error:'Неуспешно запазване.'});}
  res.json({results,total:results.length,searches:s.immersive.terminalSearches});
});

app.get('/api/backup',(req,res)=>{
 const s=getSession(req,res);
 if(!s)return;
 res.setHeader('Cache-Control','no-store');
 res.json(exportBackup(s));
});
app.post('/api/backup/restore',async(req,res)=>{
 if(!useQuota('restore-ip:'+req.ip,5,60*60*1000))return void res.status(429).json({error:'Твърде много опити за възстановяване.'});
 const s=getSession(req,res);
 if(!s)return;
 if(s.found.size||s.notes.length||s.interviewCount||s.expansion.actions.length)return void res.status(409).json({error:'Архив се импортира само в нова празна сесия.'});
 const previous=structuredClone(s);
 try{applyBackup(s,req.body);}
 catch{return void res.status(400).json({error:'Невалиден или повреден архив на CASEFILES.'});}
 try{await saveSession(s);}
 catch{Object.assign(s,previous);return void res.status(503).json({error:'Неуспешно запазване на възстановения прогрес.'});}
 res.json({found:[...s.found],notes:s.notes.length,links:[...s.links],interviews:s.interviewCount,aiEnabled:false});
});

app.get('/api/expansion',(req,res)=>{
 const s=getSession(req,res);if(s)res.json(expansionView(s));
});
app.post('/api/expansion/difficulty',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 const parsed=difficultySchema.safeParse(req.body?.difficulty);
 if(!parsed.success)return void res.status(400).json({error:'Невалидна трудност.'});
 if(s.expansion.actions.length||s.found.size||s.interviewCount)return void res.status(409).json({error:'Трудността се избира преди първото действие.'});
 s.expansion.difficulty=parsed.data;
 try{await saveSession(s);}catch{return void res.status(503).json({error:'Неуспешно запазване.'});}
 res.json(expansionView(s));
});
app.post('/api/expansion/action',async(req,res)=>{
 const s=getSession(req,res);if(!s)return;
 const parsed=actionSchema.safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Невалидно действие.'});
 const action=parsed.data;
 const before=structuredClone(s.expansion);
 let message='';
 if(action.kind==='puzzle'){
  const challenge=puzzles.find(x=>x.id===action.id);
  if(!challenge)return void res.status(404).json({error:'Няма такава задача.'});
  if(challenge.requires.some(x=>!s.found.has(x)))return void res.status(403).json({error:'Първо намери нужните улики.'});
  if(action.answer!==challenge.solution)return void res.status(422).json({error:'Неправилно решение. Провери материалите.'});
  if(!s.expansion.milestones.includes(challenge.id))s.expansion.milestones.push(challenge.id);
  message=challenge.result;
  logDecision(s,'puzzle',challenge.name+' — решено');
 }else if(action.kind==='classify'){
  const target=classificationTargets.find(x=>x.id===action.id);
  if(!target)return void res.status(404).json({error:'Неизвестно твърдение.'});
  if(target.id!=='H01'&&!s.found.has(target.id))return void res.status(403).json({error:'Липсва необходимото доказателство.'});
  if(action.answer!==target.correct)return void res.status(422).json({error:'Грешна класификация. Разграничи факт, показание и хипотеза.'});
  s.expansion.classifications[action.id]=action.answer;
  message='Класификацията е потвърдена.';
  logDecision(s,'logic','Класификация '+action.id+' — '+action.answer);
 }else if(action.kind==='suspect'){
  s.expansion.suspects[action.id]=action.score;
  message='Оценката на подозрението е запазена.';
  logDecision(s,'suspicion','Актуализирано лично подозрение към '+action.id);
 }else if(action.kind==='timeline'){
  const event=timelineItems.find(x=>x.id===action.id);
  if(!event)return void res.status(404).json({error:'Неизвестно събитие.'});
  if(!s.found.has(event.requires))return void res.status(403).json({error:'Не е открита подкрепящата улика.'});
  if(event.time!==action.position)return void res.status(422).json({error:'Позицията не съвпада с подкрепящото доказателство.'});
  s.expansion.placements[action.id]=action.position;
  message='Времевата точка е потвърдена.';
  logDecision(s,'timeline','Поставено събитие '+event.id);
 }else if(action.kind==='witness'){
  const witness=witnesses.find(x=>x.id===action.id);
  if(!witness)return void res.status(404).json({error:'Няма такъв свидетел.'});
  if(witness.requires.some(x=>!s.found.has(x)))return void res.status(403).json({error:'Свидетелят още не е открит.'});
  const marker='witness:'+witness.id;
  if(!s.expansion.milestones.includes(marker))s.expansion.milestones.push(marker);
  message=witness.statement;
  logDecision(s,'witness','Взети показания от '+witness.name);
 }else if(action.kind==='tutorial'){
  const step=tutorial.find(x=>x.id===action.id);
  if(!step)return void res.status(404).json({error:'Няма такава стъпка.'});
  if(!s.expansion.tutorial.includes(step.id))s.expansion.tutorial.push(step.id);
  message='Стъпката е приключена.';
 }else{
  s.expansion.uiSettings={sound:action.sound,reducedMotion:action.reducedMotion};
  message='Предпочитанията са запазени.';
 }
 try{await saveSession(s);}catch{s.expansion=before;return void res.status(503).json({error:'Запазването е неуспешно.'});}
 res.json({message,progress:expansionView(s)});
});

app.get('/api/suspects', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(suspects.map(person => ({
    ...person,
    relevantIds: person.relevantIds.filter(id => session.found.has(id)),
    interviewCount: Math.floor((session.messages[person.id] || []).length / 2)
  })));
});

app.get('/api/notes', (req, res) => {
  const session = getSession(req, res);
  if (session) res.json(session.notes);
});

app.post('/api/notes', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Бележката е невалидна или прекалено дълга.' });
  if (session.notes.length >= 35) return void res.status(429).json({ error: 'Лимит от 35 бележки.' });
  const note = { ...parsed.data, id: randomUUID(), updatedAt: new Date().toISOString() };
  session.notes.push(note);
  try { await saveSession(session); }
  catch { session.notes.pop(); return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.status(201).json({ note, notes: session.notes });
});

app.put('/api/notes/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалидна бележка.' });
  const index = session.notes.findIndex(n => n.id === req.params.id);
  if (index < 0) return void res.status(404).json({ error: 'Бележката липсва.' });
  const previous = session.notes[index];
  session.notes[index] = { ...parsed.data, id: previous.id, updatedAt: new Date().toISOString() };
  try { await saveSession(session); }
  catch { session.notes[index] = previous; return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.json({ note: session.notes[index], notes: session.notes });
});

app.delete('/api/notes/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const index = session.notes.findIndex(n => n.id === req.params.id);
  if (index < 0) return void res.status(404).json({ error: 'Бележката липсва.' });
  const previous = [...session.notes];
  session.notes.splice(index, 1);
  try { await saveSession(session); }
  catch { session.notes = previous; return void res.status(503).json({ error: 'Неуспешно изтриване.' }); }
  res.json({ notes: session.notes });
});

app.get('/api/contradictions', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(availableContradictions(session.found).map(c => ({
    ...c, verified: session.verified.has(c.id),
    finding: session.verified.has(c.id) ? c.finding : null
  })));
});

app.post('/api/contradictions/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const match = contradictions.find(c => c.id === req.params.id);
  if (!match) return void res.status(404).json({ error: 'Неизвестно противоречие.' });
  if (match.evidenceIds.some(id => !session.found.has(id))) {
    return void res.status(403).json({ error: 'Необходими са всички подкрепящи улики.' });
  }
  session.verified.add(match.id);
  try { await saveSession(session); }
  catch { session.verified.delete(match.id); return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.json({ finding: match, verified: [...session.verified] });
});

app.get('/api/forensics/clips', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(clipObservations.map(({ id, title, place, start, end }) => ({
    id, title, place, start, end, duration: 240,
    analyzed: session.analyses.has('video:' + id)
  })));
});

app.get('/api/forensics/clips/:id/frame', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const clip = clipObservations.find(c => c.id === req.params.id);
  const sec = Number(req.query.second);
  if (!clip) return void res.status(404).json({ error: 'Няма такъв запис.' });
  if (!Number.isInteger(sec) || sec < 0 || sec > 240) return void res.status(400).json({ error: 'Невалидна позиция в записа.' });
  res.json({ frame: frameFor(clip.id, sec), second: sec });
});

app.post('/api/forensics/clips/:id/analyze', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const clip = clipObservations.find(c => c.id === req.params.id);
  if (!clip) return void res.status(404).json({ error: 'Няма такъв запис.' });
  const parsed = observationSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалидно наблюдение.' });
  const matchedId = verifyObservation(clip.id, parsed.data.second, parsed.data.detail);
  if (!matchedId) return void res.status(422).json({ error: 'Това наблюдение не е достатъчно. Потърси отличителен детайл в конкретния кадър.' });
  const previouslyFound = session.found.has(matchedId);
  session.found.add(matchedId);
  capture(session.living,matchedId,'Анализ на кадър','Камера '+clip.id);
  session.analyses.add('video:' + clip.id);
  try { await saveSession(session); }
  catch {
    if (!previouslyFound) session.found.delete(matchedId);
    session.analyses.delete('video:' + clip.id);
    return void res.status(503).json({ error: 'Неуспешно запазване.' });
  }
  res.json({ found: [...session.found], clueId: matchedId, observation: 'Потвърден е отличителният детайл от записа.' });
});

app.get('/api/forensics/documents', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(documents.map(d => ({
    id: d.id, title: d.title, category: d.category, publicSummary: d.publicSummary,
    available: d.requires.every(id => session.found.has(id)),
    analyzed: session.analyses.has('document:' + d.id)
  })));
});

app.get('/api/forensics/documents/:id', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const document = documents.find(d => d.id === req.params.id);
  if (!document) return void res.status(404).json({ error: 'Няма такъв документ.' });
  if (!document.requires.every(id => session.found.has(id))) return void res.status(403).json({ error: 'Документът още не е достъпен за анализ.' });
  res.json({ id: document.id, title: document.title, pages: document.pages, analyzed: session.analyses.has('document:' + document.id) });
});

app.post('/api/forensics/documents/:id/inspect', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const document = documents.find(d => d.id === req.params.id);
  if (!document) return void res.status(404).json({ error: 'Няма такъв документ.' });
  if (!document.requires.every(id => session.found.has(id))) return void res.status(403).json({ error: 'Липсват предварителни доказателства.' });
  const pageId = typeof req.body?.pageId === 'string' ? req.body.pageId : '';
  const page = documentPage(document.id, pageId);
  if (!page) return void res.status(400).json({ error: 'Избери валидна страница.' });
  const completed = pageId === document.revealPage;
  const wasFound = session.found.has(document.clueId);
  if (completed) {
    session.found.add(document.clueId);
    capture(session.living,document.clueId,'Изследване на страница','Документ '+document.id);
    session.analyses.add('document:' + document.id);
    try { await saveSession(session); }
    catch {
      if (!wasFound) session.found.delete(document.clueId);
      session.analyses.delete('document:' + document.id);
      return void res.status(503).json({ error: 'Неуспешно запазване.' });
    }
  }
  res.json({ finding: page.finding, completed, clueId: completed ? document.clueId : null, found: [...session.found] });
});

app.get('/api/hints', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const max = { rookie: 3, detective: 2, expert: 1 }[session.expansion.difficulty];
  res.json({ used: session.hintsUsed, max, nextLevel: session.hintsUsed < max ? session.hintsUsed + 1 : null, lastHint: session.hintsUsed ? hintLevels[session.hintsUsed - 1] : null });
});

app.post('/api/hints', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const max = { rookie: 3, detective: 2, expert: 1 }[session.expansion.difficulty];
  const hint = session.hintsUsed < max ? hintLevels[session.hintsUsed] : undefined;
  if (!hint) return void res.status(429).json({ error: 'Всички подсказки вече са използвани.' });
  session.hintsUsed++;
  try { await saveSession(session); }
  catch { session.hintsUsed--; return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.json({ hint, used: session.hintsUsed, remaining: max - session.hintsUsed });
});

app.get('/api/report', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  if (!session.finalReport) return void res.status(403).json({ error: 'Пълният доклад е достъпен само след успешно разрешаване на случая.' });
  res.json(session.finalReport);
});

app.get('/api/evidence', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(evidence.filter(item => session.found.has(item.id)));
});
app.post('/api/discover/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const item = evidence.find(item => item.id === req.params.id);
  if (!item) return void res.status(404).json({ error: 'Неизвестна улика.' });
  if (item.source === 'interview') return void res.status(403).json({ error: 'Тази улика се придобива чрез разпит.' });
  if (['E06','E07','E09','E10'].includes(item.id)) return void res.status(403).json({ error: 'Тази улика се отключва чрез анализ в криминалистичния модул.' });
  if (item.id === 'E08' && (!session.found.has('E01') || !session.found.has('E03'))) return void res.status(403).json({ error: 'Първо провери протокола от огледа и телефона.' });
  session.found.add(item.id);
  capture(session.living,item.id,'Оглед / първичен материал',item.source);
  try { await saveSession(session); } catch { return void res.status(503).json({ error: 'Неуспешно запазване на уликата.' }); }
  res.json({ evidence: item, found: [...session.found] });
});
app.get('/api/deductions', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(deductions.filter(item => session.links.has(item.id)));
});

app.post('/api/deductions', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const first = typeof req.body?.firstId === 'string' ? req.body.firstId : '';
  const second = typeof req.body?.secondId === 'string' ? req.body.secondId : '';
  if (!session.found.has(first) || !session.found.has(second)) {
    return void res.status(403).json({ error: 'Можеш да свързваш само вече открити доказателства.' });
  }
  const deduction = findDeduction(first, second);
  if (!deduction) return void res.status(422).json({ error: 'Няма доказуема връзка между тези две улики.' });
  session.links.add(deduction.id);
  try { await saveSession(session); } catch { return void res.status(503).json({ error: 'Неуспешно запазване на логическата връзка.' }); }
  res.json({ deduction, links: [...session.links] });
});

app.post('/api/interview', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалиден въпрос.' });
  const { personId, message, evidenceId, interviewStyle, scriptedOnly } = parsed.data;
  if (evidenceId && !session.found.has(evidenceId)) {
    return void res.status(403).json({ error: 'Уликата още не е открита.' });
  }
  if (session.interviewBusy) return void res.status(429).json({ error: 'Предишният въпрос още се обработва.' });
  if (session.interviewCount >= 80) return void res.status(429).json({ error: 'Лимитът за разпити в тази сесия е достигнат.' });

  session.interviewBusy = true;
  try {
    const disclosed = [...new Set([...(session.disclosed[personId] || []), ...(evidenceId ? [evidenceId] : [])])];
    const history = session.messages[personId] || [];
    const requestedAi = !scriptedOnly && configuredMode() === 'ai-live' && session.aiCalls < 25
      && useQuota('ai-ip:' + req.ip, 60, 60 * 60 * 1000)
      && useQuota('ai-global', 300, 24 * 60 * 60 * 1000);
    let reply: string | null = null;
    if (requestedAi) {
      session.aiCalls++;
      reply = await aiReply({
        personId, question: message, presentedEvidenceId: evidenceId,
        disclosedEvidenceIds: disclosed, history
      });
    }
    const mode = reply ? 'ai-live' : 'scripted-demo';
    const oldPressure = session.pressure[personId] || 20;
    const pressureDelta = interviewStyle === 'challenge' ? (evidenceId ? 17 : 8) : interviewStyle === 'empathy' ? -6 : 2;
    const newPressure = Math.max(0, Math.min(100, oldPressure + pressureDelta));
    session.pressure[personId] = newPressure;
    if (!reply && personId === 'martin' && newPressure >= 55 && disclosed.includes('E04') && disclosed.includes('E09')) {
      reply = 'Да, документите бяха проблем. Никола настояваше за оригиналните фактури и спорихме. Но това не доказва, че аз съм го убил.';
    }
    reply ??= scriptedReply(personId, message, disclosed);
    const updatedHistory: InterviewLine[] = [...history, { role: 'player', text: message }, { role: 'npc', text: reply }];
    session.messages[personId] = updatedHistory.slice(-40);
    session.disclosed[personId] = disclosed;
    session.interviewCount++;
    if (personId === 'elena') { session.found.add('E11'); capture(session.living,'E11','Свидетелски протокол','Разпит на Елена'); }
    if (personId === 'petar') { session.found.add('E12'); capture(session.living,'E12','Свидетелски протокол','Разпит на Петър'); }
    await saveSession(session);
    res.json({ reply, found: [...session.found], mode, pressure: session.pressure[personId], interviewStyle });
  } catch {
    res.status(503).json({ error: 'Разпитът не можа да бъде запазен.' });
  } finally {
    session.interviewBusy = false;
  }
});
app.post('/api/accusation', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = accusationSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Попълни заподозрян, мотив, хронология и поне три улики.' });
  const { suspectId, motive, timeline, evidenceIds } = parsed.data;
  if (evidenceIds.some(id => !session.found.has(id))) return void res.status(403).json({ error: 'Можеш да използваш само открити улики.' });
  const verdict = evaluate(suspectId, evidenceIds, motive, timeline, [...session.links]);
  const score = scoreCase({ found: session.found, links: session.links, interviews: session.messages, verified: session.verified, verdict: verdict.status });
  session.accusationCount++;
  session.expansion.attempts.push({at:new Date().toISOString(),result:verdict.status,selected:suspectId});
  session.expansion.attempts=session.expansion.attempts.slice(-30);
  logDecision(session,'accusation','Обвинение: '+verdict.status);
  const difficultyPenalty = { rookie: 2, detective: 4, expert: 6 }[session.expansion.difficulty];
  const deduction = Math.min(20, session.hintsUsed * difficultyPenalty + Math.max(0, session.accusationCount - 1) * 3);
  const finalScore = { ...score, total: Math.max(0, score.total - deduction), penalty: deduction };
  if (verdict.status === 'solved') {
    session.finalReport = {
      status: 'solved',
      headline: 'Разследването е приключено',
      conclusion: 'Съвкупността от финансовия мотив, времевите записи и обоснованите доказателствени връзки подкрепя обвинението срещу Мартин Русев.',
      timeline: actualCaseTimeline,
      collected: [...session.found],
      missed: evidence.filter(item => !session.found.has(item.id)).map(item => ({ id: item.id, title: item.title })),
      verifiedFindings: availableContradictions(session.found).filter(c => session.verified.has(c.id)).map(c => ({ id: c.id, title: c.title, finding: c.finding })),
      score: finalScore,
      hintsUsed: session.hintsUsed,
      accusations: session.accusationCount,
      ending: outcome(true,session.expansion.attempts.filter(x=>x.result==='incorrect').length,finalScore.total)
    };
  }
  try { await saveSession(session); }
  catch { return void res.status(503).json({ error: 'Финалното заключение не можа да бъде записано.' }); }
  res.json({ ...verdict, score: finalScore, ...(verdict.status === 'solved' ? { report: session.finalReport } : {}) });
});
app.use((_req, res) => res.status(404).json({ error: 'Няма такъв маршрут.' }));
const port = Number(process.env.PORT || 3001);
initializeStorage().then(storageMode => {
  app.listen(port, () => process.stdout.write('CASEFILES API listening on '+port+' mode='+configuredMode()+' storage='+storageMode+'\n'));
}).catch(() => {
  process.stderr.write('CASEFILES_STORAGE_INIT_FAILED\n');
  process.exitCode = 1;
});

if (process.env.CASEFILES_RUNTIME_PROBE === 'yes') {
  void (async () => {
    const first = await aiReply({
      personId: 'martin',
      question: 'Разкажете какво правихте от 00:30 до 02:00.',
      disclosedEvidenceIds: [],
      history: []
    });
    process.stdout.write('CASEFILES_RUNTIME_AI_TEST first=' + (first ? 'PASS' : 'FAIL') + '\n');
    if (first) {
      const second = await aiReply({
        personId: 'martin',
        question: 'Защо ви е писал Никола за оригиналните фактури?',
        presentedEvidenceId: 'E04',
        disclosedEvidenceIds: ['E04'],
        history: [{ role: 'player', text: 'Разкажете какво правихте от 00:30 до 02:00.' }, { role: 'npc', text: first }]
      });
      process.stdout.write('CASEFILES_RUNTIME_AI_TEST evidence=' + (second ? 'PASS' : 'FAIL') + '\n');
    }
  })();
}
