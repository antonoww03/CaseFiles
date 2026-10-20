import { z } from 'zod';
import type { StoredSession } from './storage.js';
import { case002 } from './living.js';

export type DeskCaseId = 'case-001' | 'case-002';
const caseIds = ['case-001', 'case-002'] as const;

const persons: Record<DeskCaseId, { id:string; name:string; role:string; sources:string[]; conclusion:string }[]> = {
  'case-001': [
    {id:'martin',name:'Мартин Русев',role:'Служебен конфликт',sources:['E04','E09'],conclusion:'Кореспонденцията и финансовата чернова подкрепят проверка на мотива, но не доказват сами по себе си присъствие.'},
    {id:'elena',name:'Елена Вълчева',role:'Последният разговор',sources:['E03','E11'],conclusion:'Разговорът опровергава твърдение за липса на контакт; не установява къде е била Елена.'},
    {id:'petar',name:'Петър Добрев',role:'Свидетелски час',sources:['E08','E12'],conclusion:'Неточният час на шума следва да се съпостави с автоматичния запис на ключалката.'}
  ],
  'case-002': [
    {id:'raya',name:'Рая Милева',role:'Документална следа',sources:['C1','C5'],conclusion:'Записът за договора и транспортният етикет изискват съпоставка; не идентифицират сами по себе си извършител.'},
    {id:'boris',name:'Борис Генов',role:'Достъп и движение',sources:['C3','C4'],conclusion:'Журналът за ключовете и видеокадърът са свързани по време, но камерата не установява лице.'},
    {id:'teodor',name:'Теодор Колев',role:'Техническа следа',sources:['C2','C6'],conclusion:'Рестартът и служебната кореспонденция са проверими факти; не са самостоятелно доказателство за вина.'}
  ]
};

const editorial = {
  facts: {title:'Редакция: само проверени факти', effect:5, note:'Общественото доверие расте: представени са само потвърдени обстоятелства.'},
  privacy: {title:'Редакция: защити свидетелите', effect:3, note:'Личните данни и непотвърдените подозрения остават извън публикацията.'},
  sensation: {title:'Редакция: сензационно заглавие', effect:-12, note:'Спекулативният тон подкопава доверието в разследването.'}
} as const;

export const deskActionSchema = z.discriminatedUnion('kind',[
  z.object({kind:z.literal('profile'),personId:z.string().max(20),evidenceId:z.string().max(10)}).strict(),
  z.object({kind:z.literal('publish'),style:z.enum(['facts','privacy','sensation'])}).strict()
]);

function foundFor(s:StoredSession,caseId:DeskCaseId):Set<string> {
  return caseId==='case-001'?s.found:new Set(s.living.case2.found);
}
function isSolved(s:StoredSession,caseId:DeskCaseId):boolean {
  return caseId==='case-001'?!!s.finalReport:s.living.case2.verdict==='solved';
}
function eventName(caseId:DeskCaseId,kind:string,id:string):string {
  return 'desk14:' + caseId + ':' + kind + ':' + id;
}
function pressStyle(s:StoredSession,caseId:DeskCaseId):keyof typeof editorial|null {
  for(const style of ['facts','privacy','sensation'] as const) {
    if(s.game09.events.some(e=>e.name===eventName(caseId,'publish',style)))return style;
  }
  return null;
}

export function deskView(s:StoredSession,caseId:DeskCaseId) {
  const found=foundFor(s,caseId);
  const solved=isSolved(s,caseId);
  const style=pressStyle(s,caseId);
  const count=found.size;
  const reports=[
    {id:'start',title:caseId==='case-001'?'Неясни обстоятелства около апартамент 407':'Изчезнал договор от градския архив',body:'Разследването продължава. Нито свидетелско твърдение, нито единичен запис установява виновен.',available:true},
    {id:'lead',title:'Разследващите проверяват нови следи',body:caseId==='case-001'?'Документите и времевите записи се сравняват. Самоличността в камерата остава непотвърдена.':'Журналът, видеото и служебните документи се проверяват за съвместимост.',available:count>=3},
    {id:'verdict',title:solved?'Делото приключи след проверка на доказателствата':'Финално решение още няма',body:solved?'Заключението е подкрепено от събраните материали. Редакционният подход определя публичната реакция.':'Публикация за виновен не може да бъде издадена преди обосновано заключение.',available:solved}
  ];
  const activeEdition=style===null?null:{
    title: style==='sensation'?'Шокираща развръзка по случая!':style==='privacy'?'Разследването завърши: самоличностите на свидетели са защитени':'Проверените доказателства доведоха до приключване на случая',
    body:editorial[style].note,
    style,
    publishedAt:s.game09.events.find(e=>e.name===eventName(caseId,'publish',style))?.at||null
  };
  return {
    caseId,solved,evidenceCount:count,reputation:s.living.reputation,
    profiles:persons[caseId].map(p=>{
      const known=p.sources.filter(id=>found.has(id));
      const confirmed=s.game09.events.some(e=>e.name===eventName(caseId,'profile',p.id));
      return {id:p.id,name:p.name,role:p.role,knownEvidence:known,ready:known.length===p.sources.length,confirmed,
        conclusion:known.length===p.sources.length?p.conclusion:null,missingCount:p.sources.length-known.length};
    }),
    news:reports.filter(r=>r.available),editorialAvailable:solved&&!style,edition:activeEdition,
    editorialOptions:Object.entries(editorial).map(([id,v])=>({id,title:v.title,effect:v.effect})),
    activity:s.living.events.map(e=>({id:e,text:({
      phone:'Появи се нова телефонна следа.',witness:'Постъпи допълнително свидетелско сведение.',letter:'Получено е анонимно писмо.'
    } as Record<string,string>)[e]||'Ново развитие по делото.'})),
    archive:[
      {id:'case-001',title:'Последното обаждане',solved:!!s.finalReport,evidence:s.found.size,attempts:s.expansion.attempts.length},
      {id:'case-002',title:'Изчезналият архив',solved:s.living.case2.verdict==='solved',evidence:s.living.case2.found.length,attempts:s.living.case2.accusations},
      ...(s.living.custom?[{id:s.living.custom.id,title:s.living.custom.title,solved:s.living.customProgress.verdict==='solved',evidence:s.living.customProgress.found.length,attempts:s.living.customProgress.accusations}]:[])
    ],
    replayUnlocked:!!s.finalReport||s.living.case2.verdict==='solved',
    courtOutcome:caseId==='case-001'?s.living.court:null,
    ending:solved?(caseId==='case-001'?s.finalReport?.ending||'resolved':'resolved'):null
  };
}

export function performDeskAction(s:StoredSession,caseId:DeskCaseId,action:z.infer<typeof deskActionSchema>):{status:number;message:string} {
  if(!caseIds.includes(caseId))return {status:404,message:'Непознато досие.'};
  const found=foundFor(s,caseId);
  if(action.kind==='profile'){
    const person=persons[caseId].find(p=>p.id===action.personId);
    if(!person)return {status:404,message:'Непознат заподозрян.'};
    if(!found.has(action.evidenceId))return {status:403,message:'Не можеш да използваш неоткрита улика.'};
    if(!person.sources.includes(action.evidenceId))return {status:422,message:'Тази следа не е достатъчно свързана с избрания профил.'};
    if(!person.sources.every(id=>found.has(id)))return {status:403,message:'Нужна е и втора независима следа за обоснован профил.'};
    const name=eventName(caseId,'profile',person.id);
    if(s.game09.events.some(e=>e.name===name))return {status:409,message:'Профилът вече е проверен.'};
    if(s.game09.events.length>=40)return {status:409,message:'Дневникът на случая е запълнен.'};
    s.game09.events.push({name,at:new Date().toISOString()});
    return {status:200,message:'Профилът е проверен. Изводът е ограничен до доказуемите факти, не е диагноза или присъда.'};
  }
  if(!isSolved(s,caseId))return {status:403,message:'Преди публикация е нужно успешно приключено разследване.'};
  if(pressStyle(s,caseId))return {status:409,message:'Редакционното решение вече е окончателно.'};
  if(s.game09.events.length>=40)return {status:409,message:'Дневникът на случая е запълнен.'};
  const chosen=editorial[action.style];
  s.game09.events.push({name:eventName(caseId,'publish',action.style),at:new Date().toISOString()});
  s.living.reputation=Math.max(0,Math.min(100,s.living.reputation+chosen.effect));
  return {status:200,message:chosen.note};
}
