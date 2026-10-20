import { z } from 'zod';
import type { StoredSession } from './storage.js';
import { case002, solveCase } from './living.js';
import { game09View } from './game09.js';

export const archivePuzzles=[
 {id:'archive-lock',name:'Сервизният код',requires:['C2','C3'],question:'Съпостави номера на ключовия протокол с часа на предаването. Въведи часа 23:39 като четири цифри.',type:'lock',location:'security'},
 {id:'archive-film',name:'Два кадъра',requires:['C2','C4'],question:'Подреди времето на рестарта и видеокадъра във формат HHMM-HHMM.',type:'timeline',location:'hall'},
 {id:'archive-ledger',name:'Следата на договора',requires:['C5','C6'],question:'Кой е поискал оценка на оригиналния договор?',type:'compare',location:'studio'}
] as const;
const answers:Record<string,string>={'archive-lock':'2339','archive-film':'2347-2352','archive-ledger':'boris'};
export const playableRooms=[
 {id:'apartment',caseId:'case-001',title:'Апартамент 407',subtitle:'Първи оглед · София',art:'apartment'},
 {id:'reading',caseId:'case-002',title:'Читалня',subtitle:'Предаване на смяната',art:'archive'},
 {id:'server',caseId:'case-002',title:'Сървърна',subtitle:'Контролер и събития',art:'server'},
 {id:'security',caseId:'case-002',title:'Пост охрана',subtitle:'Регистър на ключовете',art:'security'},
 {id:'hall',caseId:'case-002',title:'Сервизен коридор',subtitle:'Камера 23:52',art:'hall'},
 {id:'lift',caseId:'case-002',title:'Служебен асансьор',subtitle:'Транспортна количка',art:'lift'},
 {id:'studio',caseId:'case-002',title:'Реставрационно ателие',subtitle:'Вътрешно писмо',art:'studio'}
] as const;
export const storyBeats={
 'case-001':[
  {id:'arrival',title:'01:42 — Последното обаждане',line:'В апартамент 407 телефонът продължава да свети. Трима души са говорили с Никола през последните часове.',requires:[] as string[]},
  {id:'invoice',title:'00:42 — Неизпратеният сигнал',line:'Фактурите подсказват мотив, но само времевата линия може да свърже мотив и присъствие.',requires:['E04']},
  {id:'footage',title:'01:12 — Фигура в асансьора',line:'Светлата презрамка се появява два пъти. Дали е същият човек, остава неясно.',requires:['E06','E07']},
  {id:'truth',title:'Развръзка',line:'Доказателствата са приети. Разследването има окончателен доклад.',requires:['E04','E06','E07']}
 ],
 'case-002':[
  {id:'night',title:'Глава I — Нощната смяна',line:'Вратата на фонда е заключена, но дигиталният контролер е рестартиран след полунощ.',requires:[] as string[]},
  {id:'key',title:'Глава II — Резервният ключ',line:'Подписът в журнала за ключове се появява преди рестарта. Времето има значение.',requires:['C2','C3']},
  {id:'corridor',title:'Глава III — Калъфът',line:'Фигура със син калъф пресича сервизния коридор. Само комбинацията от независими следи сочи отговор.',requires:['C4','C5']},
  {id:'closing',title:'Последна сцена — Архивът проговаря',line:'Договорът е намерен и случаят може да бъде предаден за окончателно заключение.',requires:['C2','C3','C4','C6']}
 ]
} as const;

export const releaseActionSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('puzzle'),id:z.enum(['archive-lock','archive-film','archive-ledger']),answer:z.string().trim().max(40)}),
 z.object({kind:z.literal('accuse002'),suspectId:z.enum(['raya','boris','teodor']),evidenceIds:z.array(z.string().max(10)).min(3).max(6)})
]);
const solvedMarker=(id:string)=>'v1:'+id;
export function solvedArchive(s:StoredSession,id:string){return s.game09.missionsDone.includes(solvedMarker(id));}
export function snapshot10(s:StoredSession){
 const clues=s.living.case2.found;
 const progress=game09View(s);
 const completed=archivePuzzles.filter(x=>solvedArchive(s,x.id)).length;
 const confidence=clues.length+completed;
 const case2Verdict=s.living.case2.verdict;
 const case1Ending=s.finalReport?'resolved':s.expansion.attempts.some(x=>x.result==='incorrect')?'contested':'ongoing';
 const case2Ending=case2Verdict==='solved'
  ?s.cinematic.choiceConsequences.includes('block-boris')?'fractured':s.living.case2.accusations>1?'contested':completed===3?'complete':'resolved'
  :case2Verdict==='incorrect'?'contested':'ongoing';
 return {
  case1:{found:[...s.found],ending:case1Ending,reportAvailable:!!s.finalReport,missions:progress.missions},
  case2:{
   found:clues,interviews:s.living.case2.dialogue,verdict:case2Verdict,ending:case2Ending,
   accusations:s.living.case2.accusations,
   epilogue:case2Verdict!=='solved'?null:
    case2Ending==='fractured'?'Договорът е възстановен, но прибързаният натиск е унищожил доверието на един от свидетелите. Истината идва с цена.':
    case2Ending==='contested'?'След повторен преглед на неверните обвинения архивната следа най-сетне издържа проверка. Ранните грешки остават в досието.':
    case2Ending==='complete'?'Часът на рестарта, резервният ключ и финансовата следа образуват непрекъсната доказателствена история. Случаят е окончателно приключен.':
    'Откритите документи стигат за аргументирано обвинение, но някои второстепенни детайли остават неизяснени.',
   scenes:playableRooms.filter(x=>x.caseId==='case-002').map((room,i)=>({
    ...room,clueId:case002.clues[i].id,clueTitle:case002.clues[i].title,
    available:i<3||clues.length>=2,found:clues.includes(case002.clues[i].id),
    detail:clues.includes(case002.clues[i].id)?case002.clues[i].description:null
   })),
   puzzles:archivePuzzles.map(p=>({id:p.id,name:p.name,question:p.question,type:p.type,location:p.location,
    available:p.requires.every(e=>clues.includes(e)),solved:solvedArchive(s,p.id),requires:p.requires})),
   witnesses:case002.suspects.map(p=>({id:p.id,name:p.name,interviewed:s.living.case2.dialogue.includes(p.id),
    available:clues.length>=2,statement:s.living.case2.dialogue.includes(p.id)?p.alibi:null})),
   canAccuse:clues.length>=4&&completed>=2,
   quality:confidence
  },
  beats:{
   'case-001':storyBeats['case-001'].filter(b=>(b.id!=='truth'||!!s.finalReport)&&b.requires.every(x=>s.found.has(x))).map(x=>({id:x.id,title:x.title,line:x.line})),
   'case-002':storyBeats['case-002'].filter(b=>b.requires.every(x=>clues.includes(x))).map(x=>({id:x.id,title:x.title,line:x.line}))
  },
  totalProgress:Math.min(100,Math.round((s.found.size+s.living.case2.found.length+completed)/21*100))
 };
}
export function evaluateRelease10(s:StoredSession,action:z.infer<typeof releaseActionSchema>):{status:number;message:string}{
 if(action.kind==='puzzle'){
  const puzzle=archivePuzzles.find(p=>p.id===action.id)!;
  if(!puzzle.requires.every(id=>s.living.case2.found.includes(id)))return {status:403,message:'Необходими са уликите от предишните сцени.'};
  if(solvedArchive(s,puzzle.id))return {status:409,message:'Загадката вече е разрешена.'};
  if(action.answer.toLocaleLowerCase('bg-BG')!==answers[action.id])return {status:422,message:'Решението не съответства на запазените игрови доказателства.'};
  if(s.game09.missionsDone.length>=12)return {status:429,message:'Достигнат е лимитът на етапите за тази сесия.'};
  s.game09.missionsDone.push(solvedMarker(puzzle.id));
  s.game09.events.push({name:'Архивът: '+puzzle.name,at:new Date().toISOString()});
  s.game09.events=s.game09.events.slice(-40);
  return {status:200,message:'Успешен анализ: '+puzzle.name+'. Открита е връзка между материалите.'};
 }
 const ids=[...new Set(action.evidenceIds)];
 if(ids.some(id=>!s.living.case2.found.includes(id)))return {status:403,message:'Използвай само намерени архивни улики.'};
 if(s.living.case2.found.length<4||archivePuzzles.filter(p=>solvedArchive(s,p.id)).length<2)return {status:403,message:'Завърши поне две експертизи и открий минимум четири улики преди финала.'};
 s.living.case2.accusations++;
 s.living.case2.verdict=solveCase(s.living.case2,case002,action.suspectId,ids);
 return {status:200,message:s.living.case2.verdict==='solved'?'Случаят е разрешен. Финалът е отключен.':
   s.living.case2.verdict==='incorrect'?'Обвинението е оспорено. Преразгледай материалите.':'Нямаш достатъчно взаимно подкрепящи се улики.'};
}
