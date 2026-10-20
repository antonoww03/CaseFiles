import {z} from 'zod';
import type {StoredSession} from './storage.js';
import {evidence} from './case.js';
import {case002} from './living.js';
import {directorView} from './director12.js';

type CaseId='case-001'|'case-002';
type Challenge={id:string;caseId:CaseId;kind:'reason'|'compare'|'challenge'|'theory';title:string;prompt:string;options:{id:string;label:string}[];answer:string;requires:string[];explained:string;wrong:string;person?:string;chapter:number};
export const challenges:Challenge[]=[
 {id:'access',caseId:'case-001',kind:'reason',chapter:1,title:'Никой ли не е влизал?',prompt:'Кое доказателство противоречи на твърдението, че никой не е използвал входа след 01:00?',options:[{id:'call',label:'Обаждането в 01:17'},{id:'code',label:'Временният входен код в 01:09'},{id:'medical',label:'Медицинската оценка'}],answer:'code',requires:['E05'],explained:'Кодът доказва достъп до сградата, но не идентифицира кой го е използвал.',wrong:'Търси физическия достъп, а не само разговор или приблизителен час.'},
 {id:'contact',caseId:'case-001',kind:'challenge',chapter:2,title:'Показанието на Елена',person:'elena',prompt:'Елена първоначално отрича контакт с Никола. С кое доказателство можеш да оспориш думите ѝ?',options:[{id:'E03',label:'Регистърът на последното обаждане'},{id:'E08',label:'Дневник на ключалката'},{id:'E02',label:'Медицинска оценка'}],answer:'E03',requires:['E03','E11'],explained:'Разговорът опровергава отрицанието за контакт. Това не доказва, че Елена е била в апартамента.',wrong:'Не смесвай телефонния контакт с физическото присъствие.'},
 {id:'financial',caseId:'case-001',kind:'compare',chapter:3,title:'Два финансови документа',prompt:'В две независими улики има общ детайл. Кое е действителното им съвпадение?',options:[{id:'invoices',label:'И двете сочат проверка на оригинални фактури'},{id:'identity',label:'И двете посочват извършителя'},{id:'door',label:'И двете описват отваряне на врата'}],answer:'invoices',requires:['E04','E09'],explained:'Двете записи подкрепят финансов мотив. Не установяват сами по себе си вина.',wrong:'Сравнявай само това, което реално присъства и в двата документа.'},
 {id:'timeline',caseId:'case-001',kind:'compare',chapter:3,title:'Две независими камери',prompt:'Кой детайл може да бъде съпоставен между двата CCTV кадъра?',options:[{id:'face',label:'Ясно разпознаваемо лице'},{id:'strap',label:'Сходна диагонална презрамка'},{id:'plate',label:'Автомобилен регистрационен номер'}],answer:'strap',requires:['E06','E07'],explained:'Сходната презрамка подкрепя версия за движение, но не доказва самоличност.',wrong:'Кадрите нямат надеждна лицева идентификация.'},
 {id:'hypothesis',caseId:'case-001',kind:'theory',chapter:4,title:'Версия на разследването',prompt:'Коя теория различава мотив, достъп и липсваща идентификация?',options:[{id:'certain',label:'Фактурите са пряко доказателство за убийство'},{id:'balanced',label:'Има финансов мотив и времева следа, но е нужна проверка на самоличността'},{id:'ignore',label:'След като няма взлом, не е имало посетител'}],answer:'balanced',requires:['E04','E05','E09'],explained:'Различаването на хипотеза от доказан факт е основата на аргументираното обвинение.',wrong:'Не превръщай предположение или липса на взлом в сигурно заключение.'},
 {id:'archiveaccess',caseId:'case-002',kind:'reason',chapter:1,title:'Кой е имал възможност?',prompt:'Кой документ подкрепя съмнение за достъп до архивния фонд преди рестарта?',options:[{id:'C3',label:'Разписката за резервния ключ в 23:39'},{id:'C1',label:'Протоколът за затваряне в 23:05'},{id:'C5',label:'Етикет от количка'}],answer:'C3',requires:['C3'],explained:'Подписът свързва служител с възможност за достъп, но още не доказва преместване на договора.',wrong:'Нужен е документът за конкретен достъп, а не косвено обстоятелство.'},
 {id:'archiveclaim',caseId:'case-002',kind:'challenge',chapter:2,title:'Алибито на Борис',person:'boris',prompt:'Борис твърди, че не е имал достъп до фонда. С коя следа ще обориш твърдението?',options:[{id:'C3',label:'Подписът за резервния ключ'},{id:'C4',label:'Неясната фигура с калъф'},{id:'C1',label:'Протоколът от читалнята'}],answer:'C3',requires:['C3'],explained:'Подписът противоречи на отрицанието за достъп. Камерата не идентифицира лицето.',wrong:'Предяви документа, който действително свързва служителя с ключа.'},
 {id:'archivetime',caseId:'case-002',kind:'compare',chapter:3,title:'Рестарт срещу камера',prompt:'Кое следва непосредствено след събитието от системния лог?',options:[{id:'chronology',label:'Рестарт 23:47, после фигура в коридора в 23:52'},{id:'reverse',label:'Фигурата влиза преди рестарта'},{id:'same',label:'Двете събития са по едно и също време'}],answer:'chronology',requires:['C2','C4'],explained:'Хронологията подкрепя възможен маршрут, но не доказва чия е фигурата.',wrong:'Сравни точните часове от двата независими източника.'},
 {id:'archivemotive',caseId:'case-002',kind:'compare',chapter:3,title:'Два документа за интерес',prompt:'Кой документ подкрепя предварителен интерес към липсващия договор?',options:[{id:'C6',label:'Вътрешното писмо за оценка на оригинала'},{id:'C2',label:'Рестартът на контролера'},{id:'C5',label:'Етикетът от количката'}],answer:'C6',requires:['C5','C6'],explained:'Писмото дава контекст за мотива, докато транспортната следа показва движение.',wrong:'Не бъркай техническо събитие с документ за предварителен интерес.'},
 {id:'archivetheory',caseId:'case-002',kind:'theory',chapter:4,title:'Обоснована архивна теория',prompt:'Коя версия комбинира независимо достъп, време и предишен интерес?',options:[{id:'alibi',label:'Един рестарт доказва кой е изнесъл договора'},{id:'mixed',label:'Подпис, рестарт, камера и писмо образуват проверима, но косвена верига'},{id:'dismiss',label:'Камерата е достатъчна за еднозначно лицево разпознаване'}],answer:'mixed',requires:['C2','C3','C4','C6'],explained:'Комбинацията подкрепя проверима версия, без да преувеличава качеството на отделните улики.',wrong:'Добрата теория отчита ограниченията на всеки източник.'}
];
export const detective13Schema=z.object({id:z.string().min(2).max(32),answer:z.string().min(1).max(32)}).strict();
const mark=(caseId:CaseId,id:string)=>'d13:'+caseId+':'+id;
const records=(s:StoredSession)=>s.expansion.actions.filter(a=>a.kind==='detective13');
const passed=(s:StoredSession,caseId:CaseId,id:string)=>records(s).some(r=>r.text===mark(caseId,id)+':pass');
const failed=(s:StoredSession,caseId:CaseId,id:string)=>records(s).filter(r=>r.text===mark(caseId,id)+':fail').length;
const allFound=(s:StoredSession,caseId:CaseId)=>caseId==='case-001'?new Set(s.found):new Set(s.living.case2.found);
const levels=['Първи оглед','Показания и противоречия','Криминалистичен анализ','Проверка на теориите','Заключение'] as const;
export function detective13View(s:StoredSession,caseId:CaseId){
 const found=allFound(s,caseId),items=challenges.filter(q=>q.caseId===caseId);
 const decisions=items.map(q=>({
  id:q.id,title:q.title,kind:q.kind,chapter:q.chapter,person:q.person||null,
  available:q.requires.every(id=>found.has(id)),completed:passed(s,caseId,q.id),attempts:failed(s,caseId,q.id),
  prompt:q.requires.every(id=>found.has(id))?q.prompt:null,
  options:q.requires.every(id=>found.has(id))?q.options:[],
  missing:q.requires.filter(id=>!found.has(id)),
  explanation:passed(s,caseId,q.id)?q.explained:null
 }));
 const success=decisions.filter(x=>x.completed).length,attempts=decisions.reduce((sum,x)=>sum+x.attempts,0);
 const verdict=caseId==='case-001'?(s.finalReport?'solved':'ongoing'):s.living.case2.verdict||'ongoing';
 const steps=[{
  id:'first-clue',text:'Огледай предмет и открий първото доказателство',done:found.size>=1,
  target:'scene'
 },{
  id:'second-clue',text:'Намери още една независима улика',done:found.size>=2,target:'scene'
 },{
  id:'reason',text:'Направи първото си аргументирано заключение',done:decisions.some(d=>d.completed&&d.kind==='reason'),target:'detective'
 },{
  id:'challenge',text:'Оспори твърдение с реална улика',done:decisions.some(d=>d.completed&&d.kind==='challenge'),target:'detective'
 },{
  id:'theory',text:'Изгради проверима теория, без прибързано обвинение',done:decisions.some(d=>d.completed&&d.kind==='theory'),target:'detective'
 },{
  id:'conclusion',text:'Предай финално обвинение с доказателства',done:verdict==='solved',target:'ending'
 }];
 const firstPending=steps.find(x=>!x.done);
 const currentChapter=Math.min(5,Math.max(1,Math.ceil((found.size+success)/3)));
 const reviewUnlocked=verdict==='solved';
 return {
  caseId,chapter:currentChapter,chapters:levels.map((title,i)=>({number:i+1,title,active:i+1<=currentChapter})),
  tasks:steps,objective:firstPending||{id:'complete',text:'Прегледай досието и пропуснатите следи',target:'detective'},
  challenges:decisions,
  progress:{solved:success,total:decisions.length,wrongAttempts:attempts,found:found.size,reviewUnlocked},
  review:reviewUnlocked?{
   title:'Детективски анализ след финала',
   solved:success,missed:decisions.filter(x=>!x.completed).map(x=>({id:x.id,title:x.title,requires:x.missing})),
   mistakes:attempts,
   ending:verdict,branchDecisions:directorView(s,caseId).decisions.filter(d=>d.chosen).map(d=>d.label),
   recommendations:success===decisions.length?'Всички специални заключения са проверени.':'При следващо разследване провери и пропуснатите заключения.'
  }:null,
  replay:{available:reviewUnlocked,enabled:s.game09.newGamePlus}
 };
}
export function submitDetective13(s:StoredSession,caseId:CaseId,answer:z.infer<typeof detective13Schema>){
 const challenge=challenges.find(x=>x.caseId===caseId&&x.id===answer.id);
 if(!challenge)return {status:404,message:'Невалидно предизвикателство.'};
 if(!challenge.requires.every(x=>allFound(s,caseId).has(x)))return {status:403,message:'Първо открий необходимите доказателства.'};
 if(passed(s,caseId,challenge.id))return {status:409,message:'Заключението вече е потвърдено.'};
 if(!challenge.options.some(o=>o.id===answer.answer))return {status:400,message:'Невалиден избор.'};
 const valid=answer.answer===challenge.answer;
 if(s.expansion.actions.length>=120){
  // Preserve story flags as much as possible; never silently discard successful deductions.
  const idx=s.expansion.actions.findIndex(x=>x.kind==='detective13'&&x.text.endsWith(':fail'));
  if(idx>=0)s.expansion.actions.splice(idx,1);
  else return {status:409,message:'Историята на действията е запълнена. Експортирай досието и започни нов случай.'};
 }
 s.expansion.actions.push({at:new Date().toISOString(),kind:'detective13',text:mark(caseId,challenge.id)+(valid?':pass':':fail')});
 return {status:valid?200:422,message:valid?challenge.explained:challenge.wrong};
}
export function detective13Catalog(){return {
 cases:['case-001','case-002'],chapters:levels,
 challengeCount:challenges.length,
 kinds:['reason','compare','challenge','theory'],
 };}
