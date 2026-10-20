import {z} from 'zod';
import type {StoredSession} from './storage.js';
import {sceneObjects,tools,interaction} from './immersive.js';
import {case002} from './living.js';
import {findDeduction} from './deductions.js';
import {archivePuzzles} from './release10.js';
import {game09Puzzles,travelLocations} from './game09.js';

export const stageLocations=[
 {id:'living',caseId:'case-001',name:'Всекидневна',image:'living',description:'Телефонът, прозорецът и старите мебели пазят важни детайли.',needs:[] as string[]},
 {id:'desk',caseId:'case-001',name:'Работен кабинет',image:'desk',description:'Договорите, лампата и чекмеджето разказват различни истории.',needs:[] as string[]},
 {id:'entrance',caseId:'case-001',name:'Антре',image:'entrance',description:'Вратата и изтривалката посочват маршрута на посетителя.',needs:[] as string[]},
 {id:'medical',caseId:'case-001',name:'Оглед и лаборатория',image:'medical',description:'Следите говорят за времето, не за самоличността.',needs:['E01']},
 {id:'reading',caseId:'case-002',name:'Читалня',image:'reading',description:'Протоколът за затваряне е оставен до настолната лампа.',needs:[] as string[]},
 {id:'server',caseId:'case-002',name:'Сървърна',image:'server',description:'Системният журнал показва неочаквано рестартиране.',needs:[] as string[]},
 {id:'security',caseId:'case-002',name:'Пост охрана',image:'security',description:'Последното подписване в дневника е от ключово значение.',needs:[] as string[]},
 {id:'hall',caseId:'case-002',name:'Сервизен коридор',image:'hall',description:'Камерата вижда калъф, но не разпознава човек.',needs:['C1','C2']},
 {id:'lift',caseId:'case-002',name:'Служебен асансьор',image:'lift',description:'Количката е оставила следа по металния под.',needs:['C1','C2']},
 {id:'studio',caseId:'case-002',name:'Реставрационно ателие',image:'studio',description:'Вътрешното писмо може да изясни мотив.',needs:['C1','C2']}
] as const;
const audioFiles=[
 {id:'nikola-draft',title:'Гласова бележка на Никола',voice:'Трябва да намеря оригиналите на фактурите. Ако не съвпадат, ще поискам независима проверка.',requires:['E04']},
 {id:'elena-call',title:'Опис на разговор 01:17',voice:'В регистъра има обаждане от 18 секунди, но няма съхранен гласов запис на разговора.',requires:['E03']},
 {id:'archive-guard',title:'Диктовка от охраната',voice:'Преди полунощ е подписан резервният ключ. След това контролерът прекъсна връзката.',requires:['C2','C3']},
 {id:'archive-restorer',title:'Бележка на реставратора',voice:'Част от фонда е подготвяна за външна оценка. Трябва да проверим кой е поискал документа.',requires:['C5','C6']}
] as const;
export const examineSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('use'),item:z.string().max(30),target:z.string().max(30)}),
 z.object({kind:z.literal('observe'),target:z.string().max(30),side:z.enum(['front','back']),rotation:z.number().int().min(-360).max(360)}),
 z.object({kind:z.literal('board'),first:z.string().max(10),second:z.string().max(10)})
]);
const itemTargets=[
 {item:'brass_key',target:'drawer',needs:[] as string[],effect:'Отварянето на чекмеджето разкрива фотографски негатив.'},
 {item:'magnifier',target:'negative',needs:[] as string[],effect:'Увеличението открива папка на снимката, без да идентифицира човека.'},
 {item:'uv_lamp',target:'papers',needs:['E04'],effect:'Под ултравиолетова светлина проблясва код 3 · 7 · 1.'}
] as const;
export function worldSnapshot(s:StoredSession){
 const case2=new Set(s.living.case2.found);
 const found=new Set([...s.found,...case2]);
 const journal=[
  ...[...s.found].map(id=>({id,type:'evidence',title:'Улика '+id,detail:'Добавена към досието на апартамент 407'})),
  ...case002.clues.filter(x=>case2.has(x.id)).map(c=>({id:c.id,type:'archive',title:c.title,detail:c.description})),
  ...s.immersive.dialogue.slice(-10).map(x=>({id:x.choiceId,type:'dialogue',title:'Разпит: '+x.personId,detail:x.reply})),
  ...s.game09.events.slice(-10).map(e=>({id:e.name,type:'event',title:e.name,detail:'Записано игрово събитие'}))
 ].slice(-55);
 const lastBeat=s.game09.events.length?s.game09.events[s.game09.events.length-1].name:null;
 const unsolved=game09Puzzles.filter(p=>p.id!=='bonus'&&p.needs.every(id=>s.found.has(id))&&!s.game09.solved.includes(p.id));
 const awaiting=archivePuzzles.filter(p=>p.requires.every(id=>case2.has(id))&&!s.game09.missionsDone.includes('v1:'+p.id));
 const hint=unsolved.length?('Провери лабораторията: '+unsolved[0].title):awaiting.length?'Архивът: '+awaiting[0].name:
  found.size<2?'Започни с два достъпни документа в основната сцена.':
  'Съпостави свидетелските показания с времевата линия.';
 return {
  locations:stageLocations.map(l=>({...l,available:l.needs.every(x=>found.has(x))})),
  inventory:tools.filter(t=>s.immersive.inventory.includes(t.id)),
  sceneItems:sceneObjects.map(o=>({id:o.id,title:o.title,room:o.room,inspected:s.immersive.inspected.includes(o.id),requiresItem:o.requiresItem,prerequisite:o.prerequisite,available:(!o.prerequisite||s.found.has(o.prerequisite)),x:o.x,y:o.y})),
  recordings:audioFiles.map(r=>({id:r.id,title:r.title,available:r.requires.every(x=>found.has(x)),voice:r.requires.every(x=>found.has(x))?r.voice:null})),
  board:[...s.links].map(id=>({id,confirmed:true})),
  journal,
  event:lastBeat,
  hints:{suggestion:hint,failedAttempts:Object.values(s.game09.attempts).reduce((sum,n)=>sum+n,0)},
  story:{
   tension:Math.min(100,15+s.found.size*5+s.living.case2.found.length*3+s.cinematic.decisions.length*8),
   achievements:s.game09.missionsDone.length,
   branches:s.cinematic.choiceConsequences,
   complete:!!s.finalReport||s.living.case2.verdict==='solved'
  }
 };
}
export function executeWorld(s:StoredSession,action:z.infer<typeof examineSchema>):{status:number;message:string}{
 if(action.kind==='board'){
  if(!s.found.has(action.first)||!s.found.has(action.second))return{status:403,message:'Можеш да свързваш само открити материали.'};
  const match=findDeduction(action.first,action.second);
  if(!match)return{status:422,message:'Тези материали нямат обоснована следствена връзка.'};
  s.links.add(match.id);return{status:200,message:'Потвърдена връзка: '+match.title+'. '+match.explanation};
 }
 if(action.kind==='observe'){
  const target=sceneObjects.find(o=>o.id===action.target);
  if(!target)return{status:404,message:'Непознат предмет.'};
  if(target.prerequisite&&!s.found.has(target.prerequisite))return{status:403,message:'Този предмет още не е достъпен.'};
  if(action.side==='back'&&Math.abs(action.rotation)<120)return{status:422,message:'Завърти предмета, за да провериш гърба му.'};
  if(target.id==='drawer'&&!s.immersive.inventory.includes('brass_key'))return{status:403,message:'За чекмеджето е нужен ключ.'};
  if(action.side==='back'&&target.id==='papers')return{status:200,message:'На гърба има избледняло мастило. UV фенерът може да го разкрие.'};
  if(action.side==='back'&&target.id==='doormat')return{status:200,message:'Под ъгъла на изтривалката има малко вдлъбване.'};
  return{status:200,message:'Огледът не разкрива нова следа. Потърси друг ъгъл или инструмент.'};
 }
 const target=itemTargets.find(x=>x.item===action.item&&x.target===action.target);
 if(!target)return{status:422,message:'Този инструмент не е подходящ за обекта.'};
 if(!s.immersive.inventory.includes(action.item))return{status:403,message:'Инструментът не е в инвентара.'};
 if(target.needs.some(id=>!s.found.has(id)))return{status:403,message:'Липсва съответният материал.'};
 if(action.item==='brass_key'){
  const result=interaction(s.immersive,s.found,{kind:'inspect',objectId:'drawer'});
  return{status:result.status,message:result.message};
 }
 const companion=action.item==='magnifier'?'negative':'cipher_strip';
 if(!s.immersive.inventory.includes(companion))return{status:403,message:'Нужен е и обектът, който ще анализираш.'};
 const result=interaction(s.immersive,s.found,{kind:'combine',first:action.item,second:companion});
 return{status:result.status,message:result.status===200?target.effect:result.message};
}
