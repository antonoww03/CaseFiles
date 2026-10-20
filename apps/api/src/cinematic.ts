import { z } from 'zod';
import type { StoredSession } from './storage.js';
import { case002 } from './living.js';

export const phoneRecords = [
 {id:'sms-martin',app:'messages',from:'Мартин Русев',time:'00:42',title:'Оригиналните фактури',preview:'Никола: Донеси оригиналните фактури. Няма да отлагам повече.',detail:'Никола: Донеси оригиналните фактури. Няма да отлагам повече. Мартин: Трябва да поговорим на четири очи.',needs:['E04']},
 {id:'sms-elena',app:'messages',from:'Елена Вълчева',time:'01:17',title:'Последен разговор',preview:'Непълен архив на съобщенията.',detail:'Елена: Моля те, не си прави прибързани заключения. Никола: Ще говорим утре.',needs:['E03','E11']},
 {id:'email-report',app:'mail',from:'Служебен архив',time:'23:48',title:'Финансов сигнал — чернова',preview:'Материалът е отбелязан за проверка.',detail:'Предстои сравнение на оригиналните фактури с въведените счетоводни записи.',needs:['E09']},
 {id:'photo-strap',app:'photos',from:'Камера 04',time:'01:12',title:'Силует в асансьора',preview:'Запазен кадър от системата за сигурност.',detail:'Диагоналната презрамка е видима. Самоличността на човека не може да се определи.',needs:['E06']},
 {id:'call-elena',app:'calls',from:'Елена Вълчева',time:'01:17',title:'Изходящ разговор',preview:'Продължителност 18 секунди',detail:'Последният изходящ разговор е в 01:17. Местоположението на абоната не е записано.',needs:['E03']},
 {id:'note-warning',app:'notes',from:'Никола',time:'00:33',title:'Лична бележка',preview:'Трябва да проверя договора преди срещата.',detail:'Ако документите не съвпадат, ще поискам независима проверка.',needs:['E04']}
] as const;

export const reactions = [
 {id:'martin',name:'Мартин Русев',role:'Колега на Никола',initials:'МР',tint:'amber'},
 {id:'elena',name:'Елена Вълчева',role:'Бивша партньорка',initials:'ЕВ',tint:'rose'},
 {id:'petar',name:'Петър Добрев',role:'Съсед и свидетел',initials:'ПД',tint:'slate'}
] as const;

export const dramaticChoices = [
 {id:'martin-calm',personId:'martin',label:'Първо създай доверие',needs:[] as string[],effect:'open',line:'Ще ви кажа какво знам, ако подходите без обвинения.',mood:'neutral'},
 {id:'martin-accuse',personId:'martin',label:'Обвини го директно',needs:[] as string[],effect:'close',line:'Без доказателства? Повече няма да ви отговарям.',mood:'angry'},
 {id:'martin-invoices',personId:'martin',label:'Предяви финансовата чернова',needs:['E04','E09'],effect:'clue',line:'Да, говорихме за фактурите. Не исках тези записи да излизат наяве.',mood:'nervous'},
 {id:'elena-listen',personId:'elena',label:'Изслушай обяснението ѝ',needs:[] as string[],effect:'open',line:'Страхувах се от това как ще изглежда последният разговор.',mood:'sad'},
 {id:'elena-phone',personId:'elena',label:'Съпостави телефонните записи',needs:['E03','E11'],effect:'clue',line:'Говорихме. Това не означава, че съм била в апартамента.',mood:'nervous'},
 {id:'petar-question',personId:'petar',label:'Попитай за часа на шума',needs:['E08'],effect:'clue',line:'Може и да съм объркал часа. Не съм гледал часовника.',mood:'nervous'},
 {id:'petar-support',personId:'petar',label:'Провери фактите, без натиск',needs:[] as string[],effect:'open',line:'Ще съдействам. Само не правете предположения от думите ми.',mood:'neutral'}
] as const;

export const case2Locations = [
 {id:'reading',title:'Читалня',chapter:0,detail:'Последният подписан протокол от нощната смяна.',clues:['C1']},
 {id:'server',title:'Сървърна',chapter:0,detail:'Контролерът е рестартиран в 23:47.',clues:['C2']},
 {id:'security',title:'Пост охрана',chapter:1,detail:'Журналът за резервните ключове.',clues:['C3']},
 {id:'hall',title:'Сервизен коридор',chapter:1,detail:'Камерата разкрива син калъф.',clues:['C4']},
 {id:'lift',title:'Служебен асансьор',chapter:2,detail:'Транспортен етикет от количка.',clues:['C5']},
 {id:'studio',title:'Реставрационно ателие',chapter:2,detail:'Кореспонденция за оценката на договора.',clues:['C6']}
] as const;
export const case2Decisions = [
 {id:'follow-camera',title:'Проследи кадъра',requires:['C2','C4'],effect:'camera',description:'Съпостави рестарта с времето на преминаване.'},
 {id:'follow-paper',title:'Проследи документите',requires:['C3','C6'],effect:'paper',description:'Провери ключа и предишната кореспонденция.'},
 {id:'question-boris',title:'Притисни Борис без документи',requires:[] as string[],effect:'closed',description:'Може необратимо да затвори разпита.'}
] as const;

export type CinematicState = {
 opened:string[]; decrypted:string[]; decisions:string[]; moods:Record<string,string>;
 chapterVisits:string[]; choiceConsequences:string[]; effectsPlayed:number;
};
export const initialCinematic=():CinematicState=>({opened:[],decrypted:[],decisions:[],moods:{martin:'neutral',elena:'neutral',petar:'neutral'},chapterVisits:[],choiceConsequences:[],effectsPlayed:0});
export const cinematicActionSchema = z.discriminatedUnion('kind',[
 z.object({kind:z.literal('phone'),id:z.string().max(50)}),
 z.object({kind:z.literal('recover'),answer:z.string().max(30)}),
 z.object({kind:z.literal('dialogue'),id:z.string().max(45)}),
 z.object({kind:z.literal('location'),id:z.string().max(30)}),
 z.object({kind:z.literal('branch'),id:z.string().max(45)})
]);
export function cinematicOverview(s:StoredSession) {
 const c=s.cinematic;
 const unlocked=phoneRecords.filter(p=>p.needs.every(x=>s.found.has(x)));
 const case2Found=new Set(s.living.case2.found);
 const currentChapter=Math.min(2,Math.floor(case2Found.size/2));
 return {
  phone:phoneRecords.map(({detail,...r})=>({...r,available:r.needs.every(id=>s.found.has(id)),opened:c.opened.includes(r.id),detail:c.opened.includes(r.id)?detail:null})),
  recovered:c.decrypted.includes('sms-fragment'),recoverAvailable:s.found.has('E03')&&s.found.has('E04'),
  personas:reactions.map(r=>({...r,mood:c.moods[r.id]||'neutral'})),
  choices:dramaticChoices.map(d=>({id:d.id,personId:d.personId,label:d.label,available:d.needs.every(e=>s.found.has(e))&&!c.choiceConsequences.includes('block:'+d.personId),done:c.decisions.includes(d.id),needs:d.needs})),
  lastLines:c.decisions.map(id=>{const d=dramaticChoices.find(x=>x.id===id)!;return {id,personId:d.personId,line:d.line,mood:d.mood}}),
  case2:{
   chapter:currentChapter,found:s.living.case2.found,verdict:s.living.case2.verdict,
   locations:case2Locations.map(l=>({...l,available:l.chapter<=currentChapter,visited:c.chapterVisits.includes(l.id)})),
   choices:case2Decisions.map(d=>({id:d.id,title:d.title,description:d.description,available:d.requires.every(id=>case2Found.has(id)),done:c.decisions.includes(d.id)})),
   consequences:c.choiceConsequences
  },
  profile:{
   evidence:s.found.size+case2Found.size,
   solved:[!!s.finalReport,s.living.case2.verdict==='solved',s.living.customProgress.verdict==='solved'].filter(Boolean).length,
   interviews:Object.values(s.messages).reduce((n,x)=>n+x.filter(m=>m.role==='player').length,0)+s.immersive.dialogue.length+c.decisions.filter(id=>dramaticChoices.some(d=>d.id===id)).length,
   deductions:s.links.size+s.verified.size,
   challenges:s.expansion.milestones.length+s.immersive.solved.length,
   visits:c.chapterVisits.length,
   choices:c.decisions.length,
   achievements:[] as string[],
   total:0,level:0,next:0
  }
 };
}
export function profileSnapshot(s:StoredSession) {
 const p=cinematicOverview(s).profile;
 p.total=p.evidence*12+p.solved*250+p.interviews*8+p.deductions*28+p.challenges*18+p.visits*12+p.choices*9;
 p.level=1+Math.floor(p.total/250);
 p.next=p.level*250;
 p.achievements=[
  ...(p.evidence>0?['Първа улика']:[]),
  ...(p.evidence>=10?['Търсач на истини']:[]),
  ...(p.interviews>=3?['Разпитващ']:[]),
  ...(p.solved>=1?['Разрешен случай']:[]),
  ...(p.solved>=2?['Ветеран']:[]),
  ...(p.choices>=3?['Преценяващ']:[])
 ];
 return p;
}
export function useCinematicChoice(s:StoredSession,raw:z.infer<typeof cinematicActionSchema>):{status:number;message:string} {
 const c=s.cinematic;
 if(raw.kind==='phone'){
  const record=phoneRecords.find(r=>r.id===raw.id);
  if(!record)return {status:404,message:'Непознат запис.'};
  if(record.needs.some(id=>!s.found.has(id)))return {status:403,message:'Телефонът още няма достъп до този запис.'};
  if(!c.opened.includes(record.id))c.opened.push(record.id);
  return {status:200,message:record.detail};
 }
 if(raw.kind==='recover'){
  if(!s.found.has('E03')||!s.found.has('E04'))return {status:403,message:'Липсва телефон или служебна кореспонденция.'};
  if(raw.answer!=='407')return {status:422,message:'Фрагментите не образуват правилния номер на апартамента.'};
  if(!c.decrypted.includes('sms-fragment'))c.decrypted.push('sms-fragment');
  return {status:200,message:'Възстановен фрагмент: „Ще говорим в апартамент 407“ — часът не е установен.'};
 }
 if(raw.kind==='dialogue'){
  const d=dramaticChoices.find(x=>x.id===raw.id);
  if(!d)return {status:404,message:'Непознат избор.'};
  if(c.decisions.includes(d.id))return {status:409,message:'Репликата вече е използвана.'};
  if(d.needs.some(id=>!s.found.has(id)))return {status:403,message:'Няма достатъчно доказателства.'};
  if(c.choiceConsequences.includes('block:'+d.personId))return {status:409,message:'Заподозреният отказва нови въпроси.'};
  c.decisions.push(d.id);c.moods[d.personId]=d.mood;
  if(d.effect==='close')c.choiceConsequences.push('block:'+d.personId);
  if(d.effect==='clue')c.choiceConsequences.push('admission:'+d.personId);
  return {status:200,message:d.line};
 }
 if(raw.kind==='location'){
  const l=case2Locations.find(x=>x.id===raw.id);
  if(!l)return {status:404,message:'Няма такава локация.'};
  const chapter=Math.min(2,Math.floor(s.living.case2.found.length/2));
  if(l.chapter>chapter)return {status:403,message:'Тази локация се отключва в следваща глава.'};
  if(!c.chapterVisits.includes(l.id))c.chapterVisits.push(l.id);
  return {status:200,message:l.detail};
 }
 const d=case2Decisions.find(x=>x.id===raw.id);
 if(!d)return {status:404,message:'Няма такъв сюжетен избор.'};
 if(c.decisions.includes(d.id))return {status:409,message:'Решението вече е взето.'};
 if(d.requires.some(id=>!s.living.case2.found.includes(id)))return {status:403,message:'Липсват улики за тази линия.'};
 c.decisions.push(d.id);
 if(d.effect==='closed')c.choiceConsequences.push('block-boris');
 else c.choiceConsequences.push('path:'+d.effect);
 return {status:200,message:d.effect==='closed'?'Борис отказва по-нататъшни въпроси. Другите доказателствени пътища остават отворени.':'Открит е нов път към реконструкцията: '+d.description};
}
