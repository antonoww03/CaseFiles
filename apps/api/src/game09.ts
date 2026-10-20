import {z} from 'zod';
import type {StoredSession} from './storage.js';
import {sceneObjects} from './immersive.js';

export type Game09State={
  solved:string[];attempts:Record<string,number>;selectedRoom:'hall'|'living'|'study';
  discovered:string[];missionsDone:string[];newGamePlus:boolean;
  focus:string;events:{name:string;at:string}[];
};
export const newGame09=():Game09State=>({solved:[],attempts:{},selectedRoom:'hall',discovered:[],missionsDone:[],newGamePlus:false,focus:'',events:[]});
export const game09Puzzles=[
 {id:'torn',title:'Скъсаното писмо',type:'assembly',hint:'Началото е призив за проверка, следват оригиналите и фактурите.',needs:['E04'],success:'Възстановеният документ подсказва проверка на оригиналните фактури.'},
 {id:'fingerprint',title:'Наслагване на отпечатъци',type:'overlay',hint:'Пробният контур съвпада при завъртане на 90° и образец B.',needs:['E01'],success:'Геометричната форма съвпада. Самоличността не е доказана.'},
 {id:'cctv',title:'CCTV — засечи детайла',type:'video',hint:'Използвай 01:12:00 и маркирай диагоналната презрамка.',needs:['E06'],success:'Маркиран е моментът с презрамката. Не може да се извлече самоличност.'},
 {id:'cipher',title:'Шифър на сейфа',type:'cipher',hint:'Под UV светлина са изписани символи 3 · 7 · 1.',needs:['E04'],success:'Кодът е разчетен и проверен спрямо предметите.'},
 {id:'testimony',title:'Две свидетелски версии',type:'compare',hint:'Телефонният регистър показва разговор; първоначалното показание отрича контакт.',needs:['E03','E11'],success:'Потвърдено е противоречие, а не физическо присъствие.'},
 {id:'reconstruct',title:'Реконструкция на нощта',type:'chronology',hint:'Кодът в 01:09, асансьорът в 01:12, разговорът в 01:17, заключването в 01:28.',needs:['E03','E05','E06','E08'],success:'Възстановена е доказателствена последователност на събитията.'}
] as const;
export const travelLocations=[
 {id:'apartment',name:'Апартамент 407',tag:'Местопрестъпление',needs:[] as string[]},
 {id:'station',name:'Полицейски участък',tag:'Разпити и архив',needs:[] as string[]},
 {id:'laboratory',name:'Криминалистична лаборатория',tag:'Улики и експертизи',needs:['E01']},
 {id:'office',name:'Служебен архив',tag:'Документални следи',needs:['E04']},
 {id:'archive002',name:'Градският архив — Case #002',tag:'Второ разследване',needs:[] as string[]}
] as const;
export const game09Action=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('puzzle'),id:z.string().max(32),answer:z.string().max(120)}),
 z.object({kind:z.literal('room'),id:z.enum(['hall','living','study'])}),
 z.object({kind:z.literal('vision'),id:z.string().max(35)}),
 z.object({kind:z.literal('focus'),id:z.string().max(30)}),
 z.object({kind:z.literal('newGamePlus')})
]);
export function evaluateGame09(s:StoredSession,action:z.infer<typeof game09Action>):{status:number;message:string}{
 const state=s.game09;
 if(action.kind==='room'){state.selectedRoom=action.id;return {status:200,message:'Придвижване: '+action.id};}
 if(action.kind==='focus'){
  if(!travelLocations.some(x=>x.id===action.id))return {status:404,message:'Невалидна локация.'};
  const location=travelLocations.find(x=>x.id===action.id)!;
  if(location.needs.some(x=>!s.found.has(x)))return {status:403,message:'Тази локация още не е отключена.'};
  state.focus=action.id;return {status:200,message:'Отворена локация: '+location.name};
 }
 if(action.kind==='vision'){
  const o=sceneObjects.find(x=>x.id===action.id);
  if(!o)return {status:404,message:'Неизвестен обект.'};
  if(o.prerequisite&&!s.found.has(o.prerequisite))return {status:403,message:'Недостатъчно доказателства за изследване.'};
  if(!state.discovered.includes(o.id))state.discovered.push(o.id);
  return {status:200,message:'Детективското зрение подчерта: '+o.title};
 }
 if(action.kind==='newGamePlus'){
  if(!s.finalReport&&s.living.case2.verdict!=='solved')return {status:403,message:'Режимът се отключва след приключен случай.'};
  if(state.newGamePlus)return {status:409,message:'New Game+ вече е отключен.'};
  state.newGamePlus=true;return {status:200,message:'New Game+ е активен: отключени са допълнителни предизвикателства.'};
 }
 const p=game09Puzzles.find(x=>x.id===action.id);
 if(!p)return {status:404,message:'Неизвестна задача.'};
 if(p.needs.some(id=>!s.found.has(id)))return {status:403,message:'Първо намери необходимите доказателства.'};
 if(action.id==='cipher'&&!s.immersive.discoveries.includes('uv_marker'))return {status:403,message:'Не е разчетена UV следата.'};
 if(state.solved.includes(p.id))return {status:409,message:'Задачата вече е решена.'};
 state.attempts[p.id]=Math.min(99,(state.attempts[p.id]||0)+1);
 const good=({
  torn:'провери-оригиналните-фактури',
  fingerprint:'B:90',
  cctv:'120:strap',
  cipher:'371',
  testimony:'call-denial',
  reconstruct:'E05>E06>E03>E08'
 } as Record<string,string>)[p.id]===action.answer;
 if(!good)return {status:422,message:'Това решение не съвпада с доказателствата. Опитай отново.'};
 state.solved.push(p.id);state.events.push({name:'Разрешено: '+p.title,at:new Date().toISOString()});state.events=state.events.slice(-40);
 return {status:200,message:p.success};
}
export function game09View(s:StoredSession){
 const g=s.game09;
 const missions=[
  {id:'enter',title:'Огледай местопрестъплението',done:s.immersive.inspected.length>=2,detail:'Открий два предмета от апартамента.'},
  {id:'inventory',title:'Комбинирай уликите',done:s.immersive.discoveries.length>=1,detail:'Използвай инструмент върху намерен предмет.'},
  {id:'forensics',title:'Проведи визуална експертиза',done:g.solved.length>=2,detail:'Реши две задачи от лабораторията.'},
  {id:'interview',title:'Намери противоречие',done:s.verified.size>0||g.solved.includes('testimony'),detail:'Сравни различни показания.'},
  {id:'case2',title:'Разследвай втория случай',done:s.living.case2.found.length>=3,detail:'Открий три архивни улики.'},
  {id:'ending',title:'Достигни финал',done:!!s.finalReport||s.living.case2.verdict==='solved',detail:'Представи обосновано обвинение.'}
 ];
 const totalSteps=s.immersive.inspected.length+s.found.size+g.solved.length+s.cinematic.decisions.length;
 const hints=game09Puzzles.filter(p=>p.needs.every(x=>s.found.has(x))&&!g.solved.includes(p.id)).map(p=>({
  id:p.id,title:p.title,detail:(g.attempts[p.id]||0)>=2?p.hint:'Опитай сам. Подсказка след две грешни проверки.',unlocked:(g.attempts[p.id]||0)>=2
 }));
 const tension=Math.min(100,15+s.cinematic.decisions.length*8+s.living.confrontations.length*14+s.verified.size*8+s.found.size*3);
 const ending= !s.finalReport&&s.living.case2.verdict!=='solved'?'ongoing':
   s.living.case2.verdict==='solved'&&!!s.finalReport?'double-resolution':
   s.living.reputation<40?'controversial':
   s.cinematic.choiceConsequences.some(x=>x.startsWith('block:'))?'fractured':'proven';
 return {
  rooms:['hall','living','study'],
  selectedRoom:g.selectedRoom,
  discovered:g.discovered,
  focus:g.focus,
  inventory:s.immersive.inventory,
  inspected:s.immersive.inspected,
  solved:g.solved,
  puzzles:game09Puzzles.map(p=>({id:p.id,title:p.title,type:p.type,available:p.needs.every(x=>s.found.has(x)),solved:g.solved.includes(p.id),needs:p.needs,attempts:g.attempts[p.id]||0})),
  hints,
  missions,missionCompleted:missions.filter(m=>m.done).length,
  locations:travelLocations.map(x=>({...x,unlocked:x.needs.every(id=>s.found.has(id))})),
  story:{tension,ending,decisions:s.cinematic.choiceConsequences,events:g.events.slice(-12)},
  newGamePlus:g.newGamePlus,newGamePlusAvailable:!!s.finalReport||s.living.case2.verdict==='solved',
  totalSteps,
  tutorial:totalSteps<4?[
   {text:'1. Огледай изтривалката, за да намериш ключ.',target:'doormat'},
   {text:'2. Използвай ключа върху чекмеджето в кабинета.',target:'drawer'},
   {text:'3. Съпостави намерените материали в лабораторията.',target:'lab'}
  ]:[],
  people:s.cinematic.moods
 };
}
