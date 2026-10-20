import {z} from 'zod';
import type {StoredSession} from './storage.js';
type CaseId='case-001'|'case-002';
type Requirement={all?:string[];any?:string[]};
type Beat={id:string;caseId:CaseId;title:string;kicker:string;line:string;room:string;cue:'arrival'|'signal'|'discovery'|'confrontation'|'resolution';requires:Requirement};
export const directorBeats:Beat[]=[
 {id:'arrival407',caseId:'case-001',title:'02:37 · Апартамент 407',kicker:'ПРОЛОГ',line:'Вратата е заключена. По прозореца се стича дъжд. На бюрото има непроверена следа, а телефонът мълчи.',room:'living',cue:'arrival',requires:{}},
 {id:'phone-pulse',caseId:'case-001',title:'01:17 · Последният разговор',kicker:'ПЪРВА СЛЕДА',line:'Телефонният регистър показва осемнадесет секунди разговор. Съдържанието му не е запазено — не бързай със заключенията.',room:'living',cue:'signal',requires:{all:['E03']}},
 {id:'invoice-shadow',caseId:'case-001',title:'00:42 · Документите',kicker:'НОВ МОТИВ',line:'Неизпратената финансова чернова подсказва служебен конфликт, но мотив и присъствие не са едно и също.',room:'desk',cue:'discovery',requires:{all:['E04','E09']}},
 {id:'camera-strap',caseId:'case-001',title:'01:12 · Силуетът',kicker:'НОВА ПЕРСПЕКТИВА',line:'Презрамката се вижда в два независими кадъра. Камерите не позволяват сигурно разпознаване на лице.',room:'entrance',cue:'confrontation',requires:{all:['E06','E07']}},
 {id:'closure407',caseId:'case-001',title:'Досие 407 · Заключение',kicker:'РАЗВРЪЗКА',line:'Времевата линия и доказателствените връзки вече могат да бъдат представени като аргументирано заключение.',room:'desk',cue:'resolution',requires:{all:['E04','E06','E07']}},
 {id:'archive-arrival',caseId:'case-002',title:'23:05 · Нощният архив',kicker:'ПРОЛОГ',line:'Фондът е запечатан, договорът липсва. Охраната твърди, че всичко е било спокойно — но системата пази друго време.',room:'reading',cue:'arrival',requires:{}},
 {id:'reboot',caseId:'case-002',title:'23:47 · Тишина на сървъра',kicker:'НЕОЧАКВАН СИГНАЛ',line:'Журналът показва рестарт точно преди преминаването през сервизния коридор. Това е следа, не автоматично доказателство за вина.',room:'server',cue:'signal',requires:{all:['C2']}},
 {id:'spare-key',caseId:'case-002',title:'23:39 · Резервният ключ',kicker:'НОВА СЛЕДА',line:'Часът на предаване в журнала разкрива кой е имал възможност да стигне до фонда преди рестарта.',room:'security',cue:'discovery',requires:{all:['C2','C3']}},
 {id:'blue-case',caseId:'case-002',title:'23:52 · Синият калъф',kicker:'ОБРАТ',line:'На кадъра има калъф, но не и разпознаваемо лице. Една грешна догадка би затворила важен разпит.',room:'hall',cue:'confrontation',requires:{all:['C2','C4']}},
 {id:'archive-reveal',caseId:'case-002',title:'Последен акт · Истината',kicker:'РАЗВРЪЗКА',line:'Съпоставката на договора, ключа и камерата може да издържи критичен преглед, когато всички три следи са проверени.',room:'studio',cue:'resolution',requires:{all:['C3','C4','C6']}}
];
export const directorChoices=[
 {id:'preserve-phone',caseId:'case-001',label:'Запази телефона като доказателство',requires:['E03'],effect:'Съобщенията остават непокътнати за по-късен анализ.',exclusive:'phone',positive:true},
 {id:'question-phone',caseId:'case-001',label:'Изискай незабавни обяснения за разговора',requires:['E03'],effect:'Бързият натиск засилва недоверието. Можеш да продължиш с други свидетели.',exclusive:'phone',positive:false},
 {id:'audit-invoices',caseId:'case-001',label:'Проследи първо финансовите документи',requires:['E04','E09'],effect:'Отваря се документалната линия, без да се твърди кой е бил на мястото.',exclusive:'priority',positive:true},
 {id:'follow-camera',caseId:'case-001',label:'Проследи първо движенията по камерите',requires:['E06','E07'],effect:'Фокусът се премества към времевата линия; финансовите улики остават достъпни.',exclusive:'priority',positive:true},
 {id:'secure-logs',caseId:'case-002',label:'Запази копие на системния журнал',requires:['C2'],effect:'Рестартът вече е отбелязан като независима цифрова следа.',exclusive:'server',positive:true},
 {id:'pressure-guard',caseId:'case-002',label:'Притисни охраната без втори източник',requires:['C2'],effect:'Охраната се затваря. Сега ще трябва да разчиташ повече на документите.',exclusive:'server',positive:false},
 {id:'paper-trail',caseId:'case-002',label:'Изследвай произхода на договора',requires:['C3','C6'],effect:'Отключва се документалната следа към ателието.',exclusive:'route',positive:true},
 {id:'footage-trail',caseId:'case-002',label:'Проследи маршрута на калъфа',requires:['C4','C5'],effect:'Вниманието преминава към камерата и служебния асансьор.',exclusive:'route',positive:true}
] as const;
export const directorSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('choose'),id:z.string().min(2).max(35)}),
 z.object({kind:z.literal('scene'),id:z.string().min(2).max(35)})
]);
const tag=(id:string)=>'d12:'+id;
function discovered(s:StoredSession){return new Set([...s.found,...s.living.case2.found]);}
function allowed(r:Requirement,f:Set<string>){return (!r.all||r.all.every(x=>f.has(x)))&&(!r.any||r.any.some(x=>f.has(x)));}
function marks(s:StoredSession){return s.game09.events.map(x=>x.name);}
export function directorView(s:StoredSession,caseId:CaseId){
 const f=discovered(s),actions=marks(s);
 const beats=directorBeats.filter(b=>b.caseId===caseId);
 const available=beats.filter(b=>allowed(b.requires,f));
 const eligibleChoices=directorChoices.filter(c=>c.caseId===caseId);
 return {
  caseId,chapter:Math.max(1,available.length),total:beats.length,
  beats:available.map(b=>({...b,watched:actions.includes(tag(b.id))})),
  next:available.find(b=>!actions.includes(tag(b.id)))||null,
  decisions:eligibleChoices.filter(c=>c.requires.every(x=>f.has(x))).map(c=>({...c,effect:actions.includes(tag(c.id))?c.effect:null,available:!eligibleChoices.some(other=>other.exclusive===c.exclusive&&actions.includes(tag(other.id))),chosen:actions.includes(tag(c.id))})),
  lastDecision:eligibleChoices.filter(c=>actions.includes(tag(c.id))).at(-1)?.effect||null,
  evidenceCount:caseId==='case-001'?s.found.size:s.living.case2.found.length,
  unlockedPlaces:caseId==='case-001'?(f.has('E04')?['living','desk','entrance','medical']:['living','desk','entrance']):(f.has('C2')?['reading','server','security','hall']:['reading','server','security']),
  mood:eligibleChoices.some(c=>actions.includes(tag(c.id))&&!c.positive)?'tense':available.length>=3?'rising':'quiet',
  endState:caseId==='case-001'?(s.finalReport?'solved':'open'):(s.living.case2.verdict||'open'),
 };
}
export function applyDirector(s:StoredSession,caseId:CaseId,payload:z.infer<typeof directorSchema>){
 const id=payload.id, f=discovered(s),actions=marks(s);
 if(actions.includes(tag(id)))return{status:409,message:'Това събитие вече е изиграно.'};
 if(s.game09.events.length>=40)return{status:409,message:'Игровият дневник е пълен; не може да се добави още събитие.'};
 if(payload.kind==='scene'){
  const beat=directorBeats.find(b=>b.id===id&&b.caseId===caseId);
  if(!beat)return{status:404,message:'Непозната сцена.'};
  if(!allowed(beat.requires,f))return{status:403,message:'Сцената още не е отключена от доказателствата.'};
  s.game09.events.push({name:tag(id),at:new Date().toISOString()});
  return{status:200,message:beat.line};
 }
 const choice=directorChoices.find(c=>c.id===id&&c.caseId===caseId);
 if(!choice)return{status:404,message:'Непознат сюжетен избор.'};
 if(choice.requires.some(x=>!f.has(x)))return{status:403,message:'Нямаш достатъчно доказателства.'};
 if(directorChoices.some(c=>c.caseId===caseId&&c.exclusive===choice.exclusive&&actions.includes(tag(c.id))))return{status:409,message:'Вече си избрал друг път по тази следа.'};
 s.game09.events.push({name:tag(id),at:new Date().toISOString()});
 return{status:200,message:choice.effect};
}
