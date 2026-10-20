import { z } from 'zod';
import type { StoredSession } from './storage.js';

export type UniverseCaseId='case-001'|'case-002';
type Job={id:string;started:number;finish:number;done:boolean};
type Talk={id:string;approach:'empathy'|'verify'|'challenge';at:number};
export type DistrictState={turn:number;credits:number;location:string;visited:string[];jobs:Job[];talks:Talk[];briefs:number};
export type UniverseState=Record<UniverseCaseId,DistrictState>;
const initialDistrict=():DistrictState=>({turn:0,credits:120,location:'station',visited:['station'],jobs:[],talks:[],briefs:0});
export const initialUniverse=():UniverseState=>({'case-001':initialDistrict(),'case-002':initialDistrict()});

const sites:Record<UniverseCaseId,{id:string;name:string;tag:string;requires:string[];x:number;y:number;description:string}[]>={
 'case-001':[
  {id:'station',name:'Полицейско управление',tag:'Щаб',requires:[],x:19,y:32,description:'Тук планираш задачите на екипа и проверяваш резултатите.'},
  {id:'apartment',name:'Апартамент 407',tag:'Оглед',requires:[],x:49,y:25,description:'Мястото на инцидента. Следите от огледа водят към други адреси.'},
  {id:'hospital',name:'Съдебна медицина',tag:'Експерти',requires:['E01'],x:78,y:17,description:'Независими медицински заключения — само в рамките на доказуемото.'},
  {id:'laboratory',name:'Криминалистична лаборатория',tag:'Анализи',requires:['E01'],x:76,y:52,description:'Отпечатъци, изображения и сравнение на материали.'},
  {id:'office',name:'Служебен архив',tag:'Документи',requires:['E04'],x:42,y:68,description:'Финансови документи и кореспонденция по случая.'},
  {id:'lobby',name:'Охрана на сградата',tag:'Камери',requires:['E05'],x:21,y:77,description:'Контрол на достъп и записи от общите части.'},
  {id:'cafe',name:'Нощното кафене',tag:'Срещи',requires:['E03'],x:65,y:85,description:'Неофициални срещи. Свидетелите не са постоянно тук.'}
 ],
 'case-002':[
  {id:'station',name:'Разследващ щаб',tag:'Щаб',requires:[],x:18,y:27,description:'Възложи задачи и сравни различните архивни версии.'},
  {id:'archive',name:'Читалня на архива',tag:'Оглед',requires:[],x:46,y:29,description:'Открий първоначалните документи и историята на фонда.'},
  {id:'server',name:'Техническо крило',tag:'Контролер',requires:['C2'],x:77,y:18,description:'Времевите записи показват рестарт, но не и извършител.'},
  {id:'security',name:'Пост охрана',tag:'Достъп',requires:['C1'],x:22,y:68,description:'Ключове, допуски и хронология на смените.'},
  {id:'elevator',name:'Сервизен асансьор',tag:'Транспорт',requires:['C4'],x:80,y:54,description:'Движение на материали по време на нощното дежурство.'},
  {id:'studio',name:'Реставрационно ателие',tag:'Кореспонденция',requires:['C3'],x:47,y:78,description:'Следи от подготовката на оценката на договора.'},
  {id:'cafe',name:'Кафене до архива',tag:'Срещи',requires:['C2'],x:72,y:88,description:'Неформални разговори след края на смяната.'}
 ]
};
const jobs:Record<UniverseCaseId,{id:string;title:string;detail:string;requires:string[];cost:number;duration:number;report:string}[]>={
 'case-001':[
  {id:'medical',title:'Медицинска консултация',detail:'Поискай преглед на вече открития медицински материал.',requires:['E02'],cost:20,duration:2,report:'Интервалът на смъртта е приблизителен. Той не може да бъде стеснен до точна минута.'},
  {id:'cameras',title:'Проследи камерите',detail:'Съпостави показанията на два записа.',requires:['E06','E07'],cost:25,duration:3,report:'Вижда се сходна презрамка, но лицето и самоличността остават недоказани.'},
  {id:'finance',title:'Провери фактурите',detail:'Екипът сравнява наличната служебна кореспонденция.',requires:['E04','E09'],cost:25,duration:2,report:'Документите показват мотив за проверка. Служебният конфликт не установява сам по себе си вина.'},
  {id:'phone',title:'Анализ на телефонните записи',detail:'Прегледай час и продължителност на контакта.',requires:['E03'],cost:15,duration:2,report:'Последният разговор е регистриран в 01:17. Няма надеждни данни за местоположението на участниците.'}
 ],
 'case-002':[
  {id:'key',title:'Провери резервния ключ',detail:'Преглед на дневника за издаване на ключове.',requires:['C3'],cost:20,duration:2,report:'Регистърът отбелязва подпис и час на издаване. Нужна е независима съпоставка.'},
  {id:'server',title:'Техническа експертиза',detail:'Съпостави рестарта на контролера със записа.',requires:['C2','C4'],cost:25,duration:3,report:'Рестартът предхожда появата на фигурата в коридора, но самоличността ѝ не е видима.'},
  {id:'transport',title:'Проследи транспортните следи',detail:'Сравни етикета от количката с договорите.',requires:['C5','C6'],cost:25,duration:2,report:'Служебната кореспонденция и етикетът очертават възможен маршрут, не неопровержимо доказателство.'},
  {id:'protocol',title:'Провери нощните протоколи',detail:'Разговори с дежурните по време на предаването.',requires:['C1'],cost:15,duration:2,report:'В 23:05 фондът е бил отбелязан като затворен. По-късните действия изискват отделно доказване.'}
 ]
};
const people:Record<UniverseCaseId,{id:string;name:string;route:string[];role:string;requires:string[];empathy:string;verify:string;challenge:string}[]>={
 'case-001':[
  {id:'martin',name:'Мартин Русев',role:'Колега',route:['station','office','cafe'],requires:['E04','E09'],
   empathy:'Мартин признава, че конфликтът го е притеснил. Това все още е само негов разказ.',
   verify:'Мартин потвърждава спор за документи, без да описва независимо проверим маршрут.',
   challenge:'Предявените документи показват несъответствия; Мартин отказва да прави допълнителни предположения.'},
  {id:'elena',name:'Елена Вълчева',role:'Последен разговор',route:['cafe','station','apartment'],requires:['E03','E11'],
   empathy:'Елена казва, че се е страхувала как ще изглежда последният им разговор.',
   verify:'Елена потвърждава контакта, но разговорът не установява присъствие в апартамента.',
   challenge:'Противоречието с телефонния запис остава. Елена затваря разговора под натиск.'},
  {id:'petar',name:'Петър Добрев',role:'Съсед',route:['apartment','cafe','station'],requires:['E08','E12'],
   empathy:'Петър уточнява, че не е сверявал часовника си.',
   verify:'Часът на шума е приблизителен и следва да се сравни с автоматичните записи.',
   challenge:'Петър става предпазлив и отказва да посочи минута, която не помни.'}
 ],
 'case-002':[
  {id:'raya',name:'Рая Милева',role:'Реставратор',route:['studio','archive','cafe'],requires:['C1','C5'],
   empathy:'Рая се съгласява да възстанови поредността на работата в ателието.',
   verify:'Липсващият час в протокола трябва да се провери с останалите материали.',
   challenge:'Рая настоява, че не бива да се правят обвинения от непълен протокол.'},
  {id:'boris',name:'Борис Генов',role:'Нощна охрана',route:['security','station','cafe'],requires:['C3','C6'],
   empathy:'Борис признава напрежение около проверката на договора.',
   verify:'Подписът за ключа е регистриран. Той не доказва сам всички действия през нощта.',
   challenge:'Борис прекратява неформалния разговор след представянето на документите.'},
  {id:'teodor',name:'Теодор Колев',role:'Техническа поддръжка',route:['server','station','archive'],requires:['C2','C4'],
   empathy:'Теодор описва планираната процедура по рестартиране.',
   verify:'Рестартът на контролера може да се сравни със записите от камерите.',
   challenge:'Теодор настоява, че техническият достъп сам по себе си не установява вина.'}
 ]
};
export const universeActionSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('travel'),id:z.string().max(24)}).strict(),
 z.object({kind:z.literal('assign'),id:z.string().max(24)}).strict(),
 z.object({kind:z.literal('talk'),id:z.string().max(24),approach:z.enum(['empathy','verify','challenge'])}).strict(),
 z.object({kind:z.literal('wait')}).strict(),
 z.object({kind:z.literal('brief')}).strict()
]);

const jobSchema=z.object({id:z.string().max(24),started:z.number().int().min(0).max(60),finish:z.number().int().min(0).max(60),done:z.boolean()}).strict();
const talkSchema=z.object({id:z.string().max(24),approach:z.enum(['empathy','verify','challenge']),at:z.number().int().min(0).max(60)}).strict();
const districtSchema=z.object({
 turn:z.number().int().min(0).max(60),credits:z.number().int().min(0).max(200),location:z.string().max(24),
 visited:z.array(z.string().max(24)).max(12),jobs:z.array(jobSchema).max(4),talks:z.array(talkSchema).max(3),briefs:z.number().int().min(0).max(8)
}).strict();
export const universeStateSchema=z.object({'case-001':districtSchema,'case-002':districtSchema}).strict();

function evidence(s:StoredSession,caseId:UniverseCaseId):Set<string>{
 return caseId==='case-001'?s.found:new Set(s.living.case2.found);
}
const canAccess=(s:StoredSession,caseId:UniverseCaseId,requires:readonly string[])=>requires.every(id=>evidence(s,caseId).has(id));
function currentPlace(d:DistrictState,route:readonly string[]):string{return route[Math.floor(d.turn/2)%route.length];}
function timeOf(d:DistrictState):string {
 const minutes=(21*60+30+d.turn*20)%(24*60);
 return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
function advance(d:DistrictState) {
 d.turn=Math.min(60,d.turn+1);
 for(const j of d.jobs)if(!j.done&&j.finish<=d.turn){j.done=true;d.credits=Math.min(200,d.credits+8);}
}
function advisor(s:StoredSession,caseId:UniverseCaseId):string {
 const d=s.universe[caseId],known=evidence(s,caseId);
 const ready=jobs[caseId].find(j=>j.requires.every(id=>known.has(id))&&!d.jobs.some(x=>x.id===j.id));
 const completed=d.jobs.filter(j=>j.done).length;
 if(completed>0)return 'Партньорът: „Разгледай завършените експертизи, но не ги бъркай с присъда. Опитай да съпоставиш две независими следи.“';
 if(ready)return 'Партньорът: „Вече имаме материал за '+ready.title.toLowerCase()+'. Върни се в щаба, за да възложиш задачата.“';
 if(known.size<2)return 'Партньорът: „Започни с огледа. Искам поне две проверими улики преди разпит.“';
 return 'Партньорът: „Подреди фактите във времето. Провери достъпа и свидетелските показания, без да допускаш предположения за самоличност.“';
}
export function universeView(s:StoredSession,caseId:UniverseCaseId){
 const d=s.universe[caseId],known=evidence(s,caseId);
 const locations=sites[caseId].map(x=>({...x,open:x.requires.every(id=>known.has(id)),visited:d.visited.includes(x.id),active:d.location===x.id,missing:x.requires.filter(id=>!known.has(id))}));
 return {caseId,turn:d.turn,time:timeOf(d),credits:d.credits,location:d.location,locations,
  partner:{name:'Инспектор Алекс Димов',advice:advisor(s,caseId),briefs:d.briefs},
  missions:jobs[caseId].map(j=>{
   const assigned=d.jobs.find(x=>x.id===j.id);
   return {id:j.id,title:j.title,detail:j.detail,cost:j.cost,duration:j.duration,ready:j.requires.every(id=>known.has(id)),
     missing:j.requires.filter(id=>!known.has(id)),status:assigned?(assigned.done?'done':'running'):'available',
     remaining:assigned&&!assigned.done?Math.max(0,assigned.finish-d.turn):null,report:assigned?.done?j.report:null};
  }),
  people:people[caseId].map(p=>{
   const place=currentPlace(d,p.route);
   const talked=d.talks.find(t=>t.id===p.id);
   const accessible=locations.some(l=>l.id===place&&l.open);
   const reveals=!!talked&&talked.approach!=='challenge';
   return {id:p.id,name:p.name,role:p.role,where:accessible?place:null,unknown:!accessible,
     nearby:d.location===place&&accessible,spoken:!!talked,approach:talked?.approach||null,
     attitude:talked?(talked.approach==='challenge'?'затворен':talked.approach==='empathy'?'доверчив':'предпазлив'):'неизвестен',
     transcript:talked?(talked.approach==='empathy'?p.empathy:talked.approach==='verify'?p.verify:p.challenge):null,
     verifyReady:p.requires.every(id=>known.has(id)),requires:p.requires.filter(id=>!known.has(id)),reveals};
  }),
  journal:[
   ...d.jobs.map(j=>({at:j.started,kind:'task',text:'Възложена задача: '+jobs[caseId].find(x=>x.id===j.id)?.title})),
   ...d.talks.map(t=>({at:t.at,kind:'talk',text:'Разговор: '+people[caseId].find(x=>x.id===t.id)?.name}))
  ].sort((a,b)=>b.at-a.at).slice(0,10)
 };
}
export function executeUniverse(s:StoredSession,caseId:UniverseCaseId,action:z.infer<typeof universeActionSchema>):{status:number;message:string}{
 const d=s.universe[caseId];
 if(d.turn>=60)return {status:409,message:'Симулираната нощ приключи. Наличните данни остават в досието.'};
 if(action.kind==='travel'){
  const place=sites[caseId].find(p=>p.id===action.id);
  if(!place)return {status:404,message:'Няма такъв адрес.'};
  if(!canAccess(s,caseId,place.requires))return {status:403,message:'Този район изисква открити следи.'};
  if(d.location===place.id)return {status:409,message:'Вече се намираш тук.'};
  d.location=place.id;
  if(!d.visited.includes(place.id))d.visited.push(place.id);
  advance(d);
  return {status:200,message:'Пристигна: '+place.name+'. В игровия свят времето напредна с 20 минути.'};
 }
 if(action.kind==='assign'){
  const task=jobs[caseId].find(j=>j.id===action.id);
  if(!task)return {status:404,message:'Непозната задача.'};
  if(d.location!=='station')return {status:403,message:'Възлагането става само от полицейския щаб.'};
  if(!canAccess(s,caseId,task.requires))return {status:403,message:'Липсват нужните доказателства.'};
  if(d.jobs.some(j=>j.id===task.id))return {status:409,message:'Тази задача е възложена.'};
  if(d.jobs.filter(j=>!j.done).length>=2)return {status:409,message:'Екипът може да изпълнява най-много две задачи едновременно.'};
  if(d.turn+task.duration>60)return {status:409,message:'До края на игровата нощ няма време за тази експертиза.'};
  if(d.credits<task.cost)return {status:409,message:'Недостатъчен бюджет за експертиза.'};
  d.credits-=task.cost;d.jobs.push({id:task.id,started:d.turn,finish:d.turn+task.duration,done:false});
  advance(d);
  return {status:200,message:'Задачата е възложена на екипа. Върни се след още игрови действия.'};
 }
 if(action.kind==='talk'){
  const person=people[caseId].find(p=>p.id===action.id);
  if(!person)return {status:404,message:'Непознат човек.'};
  if(d.location!==currentPlace(d,person.route))return {status:409,message:'Този човек не е на текущото местоположение.'};
  if(d.talks.some(t=>t.id===person.id))return {status:409,message:'Проведеният разговор е окончателен за тази нощ.'};
  if(action.approach!=='empathy'&&!canAccess(s,caseId,person.requires))return {status:403,message:'За проверка и конфронтация са нужни конкретни доказателства.'};
  d.talks.push({id:person.id,approach:action.approach,at:d.turn});
  advance(d);
  return {status:200,message:person[action.approach]};
 }
 if(action.kind==='brief'){
  if(d.briefs>=8)return {status:409,message:'Лимитът на оперативните брифинги е достигнат.'};
  if(d.location!=='station')return {status:403,message:'Брифингът е достъпен в щаба.'};
  d.briefs++;advance(d);
  return {status:200,message:advisor(s,caseId)};
 }
 advance(d);
 return {status:200,message:'Изминаха 20 игрови минути. Локациите на свидетелите и задачите се обновиха.'};
}
/** Portable archives are user-editable. Re-validate references against authentic unlocked evidence. */
export function restoreUniverse(raw:unknown,found:Set<string>,case2Found:readonly string[]):UniverseState {
 const parsed=universeStateSchema.safeParse(raw);
 if(!parsed.success)return initialUniverse();
 const out=initialUniverse();
 for(const caseId of ['case-001','case-002'] as const){
  const v=parsed.data[caseId],dst=out[caseId],known=caseId==='case-001'?found:new Set(case2Found);
  const allowed=sites[caseId].filter(x=>x.requires.every(id=>known.has(id)));
  const allowedIds=allowed.map(x=>x.id);
  dst.turn=v.turn;
  dst.location=allowedIds.includes(v.location)?v.location:'station';
  dst.visited=['station',...new Set(v.visited.filter(id=>allowedIds.includes(id)))].slice(0,12);
  if(!dst.visited.includes(dst.location))dst.visited.push(dst.location);
  dst.jobs=jobs[caseId].filter(j=>j.requires.every(id=>known.has(id))).flatMap(j=>{
   const saved=v.jobs.find(x=>x.id===j.id);
   return saved&&saved.started<=v.turn&&saved.finish===saved.started+j.duration&&saved.done===(saved.finish<=v.turn)?[saved]:[];
  });
  dst.talks=people[caseId].flatMap(p=>{
   const t=v.talks.find(x=>x.id===p.id);
   return t&&t.at<=v.turn&&(t.approach==='empathy'||p.requires.every(id=>known.has(id)))?[t]:[];
  });
  dst.credits=v.credits;
  dst.briefs=v.briefs;
 }
 return out;
}
