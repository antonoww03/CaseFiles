import { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { case002, caseTemplateSchema, type CaseTemplate } from './living.js';
import { storagePool } from './storage.js';

/** CASEFILES community play: all cases, characters and clues are fictional. */
type Player = { token:string; name:string; joinedAt:string };
type Room = {
  id:string; kind:'case-002'|'random'|'community'; storyId:string|null; story:CaseTemplate;
  players:Player[]; found:string[]; interviews:string[]; attempts:number;
  verdict:'solved'|'incorrect'|'insufficient'|null; solvedBy:string|null;
  createdAt:string; updatedAt:string
};
type Profile = { id:string; name:string; xp:number; completed:string[]; createdAt:string };
type Published = { id:string; story:CaseTemplate; author:string; createdAt:string };
type RecordValue = { value:unknown; version:number };
const fallback = new Map<string,RecordValue>();
const rate = new Map<string,{used:number;start:number}>();
const router=Router();
const nick=z.string().trim().min(2).max(32).regex(/^[\p{L}\p{N} ._-]+$/u);
const actionSchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('discover'),id:z.string().max(8)}),
  z.object({action:z.literal('interview'),id:z.string().max(24)}),
  z.object({action:z.literal('accuse'),id:z.string().max(24),evidenceIds:z.array(z.string().max(8)).max(8)})
]);
const initialForm=z.object({kind:z.enum(['case-002','random','community']),storyId:z.string().max(64).optional(),name:nick,profileId:z.string().uuid().optional()});
const key=(kind:string,id:string)=>kind+':'+id;
function isThrottled(ip:string,group:string,max:number) {
  const now=Date.now(),id=group+':'+ip,record=rate.get(id);
  if(!record||now-record.start>3600000){rate.set(id,{start:now,used:1});return false;}
  record.used++;return record.used>max;
}
async function read<T>(kind:string,id:string):Promise<{value:T;version:number}|null> {
  const db=storagePool();
  if(!db){const entry=fallback.get(key(kind,id));return entry?{value:structuredClone(entry.value) as T,version:entry.version}:null;}
  const result=await db.query<{payload:T;version:string}>(
    'SELECT payload,version FROM casefiles.community_records WHERE kind=$1 AND id=$2 AND (kind <> \'room\' OR updated_at > now() - interval \'30 days\')',
    [kind,id]);
  return result.rows.length?{value:result.rows[0].payload,version:Number(result.rows[0].version)}:null;
}
async function write<T>(kind:string,id:string,value:T,expected:number):Promise<boolean> {
  const db=storagePool();
  if(!db){
    const current=fallback.get(key(kind,id));
    if((current?.version??-1)!==expected)return false;
    fallback.set(key(kind,id),{value:structuredClone(value),version:expected+1});return true;
  }
  if(expected===-1){
    const result=await db.query('INSERT INTO casefiles.community_records(kind,id,payload,version) VALUES($1,$2,$3::jsonb,0) ON CONFLICT DO NOTHING RETURNING id',[kind,id,JSON.stringify(value)]);
    return (result.rowCount??0)>0;
  }
  const result=await db.query('UPDATE casefiles.community_records SET payload=$3::jsonb, version=version+1, updated_at=now() WHERE kind=$1 AND id=$2 AND version=$4 RETURNING id',[kind,id,JSON.stringify(value),expected]);
  return (result.rowCount??0)>0;
}
async function modify<T>(kind:string,id:string,fn:(value:T)=>T):Promise<T|null> {
  for(let i=0;i<4;i++){
    const existing=await read<T>(kind,id);if(!existing)return null;
    const next=fn(existing.value);
    if(await write(kind,id,next,existing.version))return next;
  }
  throw Error('Конфликт на едновременни промени. Опитай пак.');
}
const pick=(seed:number,n:number)=>Math.abs((Math.imul(seed|0,1664525)+1013904223)|0)%n;
export function randomTemplate(seed:number):CaseTemplate {
  const names=['Ирина Петрова','Борис Колев','Николай Маринов','Мая Димитрова','Стефан Попов','Деница Иванова'];
  const sites=['крайбрежен музей','театрален архив','планинска обсерватория','университетска библиотека','частна галерия'];
  const site=sites[pick(seed,sites.length)];
  const culprit=pick(seed+31,3),names3=[0,1,2].map(i=>names[(pick(seed+101,3)*2+i)%names.length]);
  const descriptions=[
    'Протоколът отбелязва последната проверка на обекта преди нощната смяна.',
    'Електронният журнал показва необявено прекъсване на контрола за достъп.',
    'Вътрешна бележка сочи противоречиви часови показания на един от служителите.',
    'При огледа е намерен пропуск, издаден на '+names3[culprit]+'.',
    'Камерата засича човек с отличителен калъф край сервизния вход.',
    'Подписаното нареждане за преместване е свързано с '+names3[culprit]+'.'
  ];
  const obj={
    id:'custom-proc-'+(seed>>>0).toString(36),
    title:['Изчезналата експозиция','Сянка в архива','Последният протокол','Тайният инвентар'][pick(seed+17,4)],
    setting:'Фиктивен '+site+' · сценарий #'+(seed>>>0),
    briefing:'По време на нощната смяна от '+site+' изчезва ценен документ. Системата е работила с пропуски, а трима служители разказват различни версии. Събери улики и изгради проверимо обвинение.',
    suspects:names3.map((name,i)=>({id:'s'+(i+1),name,alibi:['Твърди, че е преглеждал дневника на смените.','Отрича да е напускал дежурния пост.','Казва, че не е ползвал служебния вход.'][i]})),
    clues:descriptions.map((description,i)=>({id:'C'+(i+1),title:['Протокол','Системен журнал','Показания','Временен пропуск','Камера','Нареждане'][i],description,location:['Приемна','Контролна зала','Кабинет','Охрана','Сервизен коридор','Архив'][i]})),
    solution:{suspectId:'s'+(culprit+1),clueIds:['C2','C4','C6'],explanation:'Временният пропуск и подписаното нареждане, съпоставени с прекъсването на контрола, свързват '+names3[culprit]+' с изчезналия документ. Това е фиктивен процедурно създаден случай.'}
  };
  const result=caseTemplateSchema.safeParse(obj);
  if(!result.success)throw Error('Грешка при генерирането на случая.');
  return result.data;
}
export function roomView(room:Room) {
  return {id:room.id,kind:room.kind,storyId:room.storyId,title:room.story.title,setting:room.story.setting,briefing:room.story.briefing,
    suspects:room.story.suspects.map(s=>({...s,alibi:room.interviews.includes(s.id)?s.alibi:null})),players:room.players.map(p=>({name:p.name,joinedAt:p.joinedAt})),
    clues:room.story.clues.map((c,i)=>({id:c.id,title:room.found.includes(c.id)?c.title:'Неоткрита следа',description:room.found.includes(c.id)?c.description:null,location:c.location,found:room.found.includes(c.id),available:i<3||room.found.length>=2})),
    found:room.found,interviews:room.interviews,attempts:room.attempts,verdict:room.verdict,solvedBy:room.solvedBy,
    ending:room.verdict==='solved'?room.story.solution.explanation:null,updatedAt:room.updatedAt};
}
export function applyRoomAction(room:Room,action:z.infer<typeof actionSchema>,member:string):{status:number;message:string} {
  if(room.verdict==='solved')return {status:409,message:'Случаят вече е разрешен.'};
  if(action.action==='discover'){
    const index=room.story.clues.findIndex(c=>c.id===action.id);
    if(index<0)return {status:404,message:'Няма такава улика.'};
    if(index>=3&&room.found.length<2)return {status:403,message:'Първо открий две начални улики.'};
    if(!room.found.includes(action.id))room.found.push(action.id);
    return {status:200,message:'Доказателството е споделено с целия екип.'};
  }
  if(action.action==='interview'){
    const suspect=room.story.suspects.find(s=>s.id===action.id);
    if(!suspect)return {status:404,message:'Няма такъв свидетел.'};
    if(room.found.length<2)return {status:403,message:'Първо открий две улики.'};
    if(!room.interviews.includes(action.id))room.interviews.push(action.id);
    return {status:200,message:suspect.alibi};
  }
  const suspect=room.story.suspects.find(s=>s.id===action.id);
  if(!suspect)return {status:404,message:'Неизвестен заподозрян.'};
  if(action.evidenceIds.some(id=>!room.found.includes(id)))return {status:403,message:'Избери само открити улики.'};
  const presented=new Set(action.evidenceIds);
  room.attempts++;
  if(room.story.solution.clueIds.filter(id=>presented.has(id)).length<3){
    room.verdict='insufficient';
    return {status:200,message:'Недостатъчна обосновка. Изискват се три ключови доказателства.'};
  }
  room.verdict=action.id===room.story.solution.suspectId?'solved':'incorrect';
  if(room.verdict==='solved')room.solvedBy=member;
  return {status:200,message:room.verdict==='solved'?'Екипът разкри случая!':'Обвинението е отхвърлено. Продължете разследването.'};
}
function fail(res:import('express').Response,error:unknown){res.status(503).json({error:error instanceof Error?error.message:'Временна грешка на сървъра.'});}
router.get('/status',(_req,res)=>res.json({storage:storagePool()?'postgres':'memory',coop:true,procedural:true,editor:true}));
router.post('/profile',async(req,res)=>{
  const parsed=z.object({name:nick}).safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Името трябва да е между 2 и 32 букви/цифри.'});
  if(isThrottled(req.ip||'unknown','profile',15))return void res.status(429).json({error:'Твърде много профили.'});
  const profile:Profile={id:randomUUID(),name:parsed.data.name,xp:0,completed:[],createdAt:new Date().toISOString()};
  try{await write('profile',profile.id,profile,-1);res.status(201).json(profile);}catch(e){fail(res,e);}
});
router.get('/profile/:id',async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)return void res.status(400).json({error:'Невалиден профил.'});
  try{const data=await read<Profile>('profile',req.params.id);if(!data)return void res.status(404).json({error:'Няма профил.'});const p=data.value;res.json({id:p.id,name:p.name,xp:p.xp,level:Math.floor(p.xp/100)+1,completedCases:p.completed.length,achievements:[...(p.completed.length>=1?['Първи разрешен случай']:[]),...(p.completed.length>=3?['Опитен следовател']:[]),...(p.completed.length>=10?['Майстор детектив']:[])]});}catch(e){fail(res,e);}
});
router.get('/stories',async(_req,res)=>{
  try{
    const db=storagePool();
    const values:Published[]=db?(await db.query<{payload:Published}>("SELECT payload FROM casefiles.community_records WHERE kind='story' ORDER BY updated_at DESC LIMIT 30")).rows.map(r=>r.payload):[...fallback].filter(([k])=>k.startsWith('story:')).slice(-30).reverse().map(([,v])=>v.value as Published);
    res.json(values.map(s=>({id:s.id,title:s.story.title,setting:s.story.setting,briefing:s.story.briefing,author:s.author,createdAt:s.createdAt,clues:s.story.clues.length})));
  }catch(e){fail(res,e);}
});
router.post('/stories',async(req,res)=>{
  if(isThrottled(req.ip||'unknown','publish',5))return void res.status(429).json({error:'Максимум пет публикации на час.'});
  const parsed=z.object({author:nick,story:caseTemplateSchema}).safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Невалиден сценарий: нужни са 3 заподозрени, 5–8 улики и валидно решение.'});
  const id='case-'+randomBytes(6).toString('hex');
  const story:Published={id,story:parsed.data.story,author:parsed.data.author,createdAt:new Date().toISOString()};
  try{await write('story',id,story,-1);res.status(201).json({id,title:story.story.title});}catch(e){fail(res,e);}
});
router.post('/rooms',async(req,res)=>{
  if(isThrottled(req.ip||'unknown','room',20))return void res.status(429).json({error:'Прекалено много стаи.'});
  const parsed=initialForm.safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Избери вид случай и име на детектив.'});
  try{
    const {kind,storyId,name}=parsed.data;
    const published=kind==='community'&&storyId?await read<Published>('story',storyId):null;
    if(kind==='community'&&!published)return void res.status(404).json({error:'Тази история не е открита.'});
    const story=kind==='case-002'?case002:kind==='random'?randomTemplate(randomBytes(4).readUInt32BE(0)):published!.value.story;
    const memberToken=randomUUID(),id=randomBytes(5).toString('hex').toUpperCase();
    const room:Room={id,kind,storyId:kind==='community'?storyId||null:null,story,players:[{token:memberToken,name,joinedAt:new Date().toISOString()}],found:[],interviews:[],attempts:0,verdict:null,solvedBy:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(!await write('room',id,room,-1))return void res.status(409).json({error:'Колизия на кода, опитай отново.'});
    res.status(201).json({memberToken,room:roomView(room)});
  }catch(e){fail(res,e);}
});
router.post('/rooms/:id/join',async(req,res)=>{
  if(isThrottled(req.ip||'unknown','join',40))return void res.status(429).json({error:'Прекалено много опити.'});
  const parsed=z.object({name:nick}).safeParse(req.body);
  if(!parsed.success)return void res.status(400).json({error:'Избери кратък псевдоним.'});
  const id=req.params.id.toUpperCase();if(!/^[0-9A-F]{10}$/.test(id))return void res.status(400).json({error:'Невалиден код.'});
  const memberToken=randomUUID();
  try{
    const joined=await modify<Room>('room',id,room=>{
      if(room.players.length>=6)throw Error('Стаята има максимум шестима играчи.');
      room.players.push({token:memberToken,name:parsed.data.name,joinedAt:new Date().toISOString()});room.updatedAt=new Date().toISOString();return room;
    });
    if(!joined)return void res.status(404).json({error:'Не е открита стая с този код.'});
    res.json({memberToken,room:roomView(joined)});
  }catch(e){fail(res,e);}
});
router.get('/rooms/:id',async(req,res)=>{
  const id=req.params.id.toUpperCase();if(!/^[0-9A-F]{10}$/.test(id))return void res.status(400).json({error:'Невалиден код.'});
  try{const item=await read<Room>('room',id);if(!item)return void res.status(404).json({error:'Стаята не е открита.'});res.json(roomView(item.value));}catch(e){fail(res,e);}
});
router.post('/rooms/:id/action',async(req,res)=>{
  if(isThrottled(req.ip||'unknown','action',240))return void res.status(429).json({error:'Твърде много действия.'});
  const action=actionSchema.safeParse(req.body),id=req.params.id.toUpperCase(),memberToken=req.header('x-room-member');
  if(!action.success||!/^[0-9A-F]{10}$/.test(id)||!memberToken)return void res.status(400).json({error:'Невалидно действие.'});
  try{
    let outcome:{status:number;message:string}={status:400,message:'Невалидно действие.'};
    let solvedNow=false,player='';
    const changed=await modify<Room>('room',id,room=>{
      const found=room.players.find(p=>p.token===memberToken);
      if(!found)throw Error('Няма достъп до действията в тази стая.');
      player=found.name;
      outcome=applyRoomAction(room,action.data,player);
      if(outcome.status===200){solvedNow=room.verdict==='solved';room.updatedAt=new Date().toISOString();}
      return room;
    });
    if(!changed)return void res.status(404).json({error:'Няма такава стая.'});
    if(outcome.status!==200)return void res.status(outcome.status).json({error:outcome.message});
    const profileId=req.header('x-case-profile');
    let awarded=false;
    if(solvedNow&&profileId&&z.string().uuid().safeParse(profileId).success){
      const p=await modify<Profile>('profile',profileId,profile=>{
        if(!profile.completed.includes(id)){profile.completed.push(id);profile.xp+=100;awarded=true;}
        return profile;
      });
      awarded=!!p&&awarded;
    }
    res.json({message:outcome.message,room:roomView(changed),awarded});
  }catch(e){fail(res,e);}
});
export default router;
