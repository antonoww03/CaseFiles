import { z } from 'zod';

/** All names, locations, transactions and procedures in this module are fictional game content. */
export const caseTemplateSchema=z.object({
 id:z.string().regex(/^custom-[a-z0-9-]{3,24}$/),
 title:z.string().trim().min(4).max(80),
 setting:z.string().trim().min(4).max(140),
 briefing:z.string().trim().min(25).max(1200),
 suspects:z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9]{1,14}$/),name:z.string().trim().min(3).max(65),alibi:z.string().trim().min(10).max(300)})).length(3),
 clues:z.array(z.object({id:z.string().regex(/^C[1-9][0-9]?$/),title:z.string().trim().min(3).max(90),description:z.string().trim().min(12).max(450),location:z.string().trim().min(3).max(50)})).min(5).max(8),
 solution:z.object({suspectId:z.string().max(15),clueIds:z.array(z.string()).min(3).max(5),explanation:z.string().trim().min(30).max(900)})
}).strict().refine(c=>new Set(c.clues.map(x=>x.id)).size===c.clues.length&&new Set(c.suspects.map(x=>x.id)).size===3&&c.suspects.some(x=>x.id===c.solution.suspectId)&&c.solution.clueIds.every(id=>c.clues.some(x=>x.id===id)), 'Некоректни препратки в случая.');
export type CaseTemplate=z.infer<typeof caseTemplateSchema>;

export const case002:CaseTemplate={
 id:'case-002',title:'Изчезналият архив',setting:'Пловдив · нощна смяна · фиктивна история',
 briefing:'Реставраторът Даниел Стоев изчезва след нощно дежурство в градски архив. Системата за достъп е рестартирана, а от запечатан фонд липсва оригинален договор. Трима служители имат причини да скрият истината. Намери кой е инсценирал изчезването на документа и къде е бил отнесен.',
 suspects:[
  {id:'raya',name:'Рая Милева',alibi:'Била е в реставрационното ателие до 23:30; протоколът има пропуснат час.'},
  {id:'boris',name:'Борис Генов',alibi:'Твърди, че е напуснал архива преди полунощ и не е имал достъп до фонда.'},
  {id:'teodor',name:'Теодор Колев',alibi:'Поддържал е сървъра от другия край на сградата.'}
 ],
 clues:[
  {id:'C1',title:'Протокол 23:05',description:'Фондът е бил затворен при предаването на нощната смяна.',location:'Читалня'},
  {id:'C2',title:'Сервизна бележка',description:'Планираният рестарт на контролера е започнал в 23:47.',location:'Сървърна'},
  {id:'C3',title:'Разписка за ключове',description:'Резервен ключ за фонда е подписан от Борис в 23:39.',location:'Охрана'},
  {id:'C4',title:'Камера от коридора',description:'В 23:52 фигура със син транспортен калъф влиза в сервизния коридор.',location:'Коридор'},
  {id:'C5',title:'Следа от кашон',description:'На количка при служебния асансьор е намерен етикет за транспорт на архивни материали.',location:'Асансьор'},
  {id:'C6',title:'Вътрешно писмо',description:'Борис е поискал оценка на оригиналния договор седмица преди инцидента.',location:'Ателие'}
 ],
 solution:{suspectId:'boris',clueIds:['C2','C3','C4','C6'],explanation:'Съвпадението между достъпа до резервния ключ, рестарта, коридора и предишния интерес към договора насочва към Борис. Това е фиктивна игрова развръзка.'}
};
export const caseCatalog=[{id:'case-001',title:'Последното обаждане',setting:'София · апартамент 407',briefing:'Оригиналното разследване.',status:'active'},
 {id:case002.id,title:case002.title,setting:case002.setting,briefing:case002.briefing,status:'playable'}] as const;

export const warrantDefinitions=[
 {id:'office',title:'Заповед за служебния архив',needs:['E04','E09'],reason:'Финансова кореспонденция и чернова',place:'Служебен архив'},
 {id:'basement',title:'Заповед за сервизния вход',needs:['E05','E10'],reason:'Код за достъп и регистър',place:'Сервизен вход'}
] as const;
export const expertDefinitions=[
 {id:'medical',name:'Съдебномедицинска експертиза',needs:['E02'],report:'Интервалът 01:20–01:25 е приблизителен. Не е възможно да се определи минутата със сигурност.'},
 {id:'video',name:'Видео идентификация',needs:['E06','E07'],report:'Презрамката е визуално сходна в двата кадъра. Не е възможно надеждно лицево разпознаване.'},
 {id:'financial',name:'Счетоводно становище',needs:['E04','E09'],report:'Установява се повод за проверка на оригинални фактури. Несъответствието само по себе си не доказва убийство.'}
] as const;
export const confrontationDefinitions=[
 {id:'contact',title:'Елена ↔ телефонен регистър',needs:['E03','E11'],result:'Елена признава разговора, но отрича присъствие на мястото. Противоречието не доказва вина.'},
 {id:'invoices',title:'Мартин ↔ финансови документи',needs:['E04','E09'],result:'Мартин признава спор за фактурите. Става по-предпазлив при следващи въпроси.'}
] as const;
export const transactions=[
 {id:'T01',time:'12:11',from:'Архив Проект',to:'Доставка',amount:1200,flag:false,detail:'Редовно плащане по договор.'},
 {id:'T02',time:'14:27',from:'Архив Проект',to:'Консулт ЕООД',amount:4800,flag:true,detail:'Плащане без посочено приложение към фактурата.'},
 {id:'T03',time:'16:02',from:'Консулт ЕООД',to:'Транзитна сметка',amount:4600,flag:true,detail:'Прехвърлена е почти цялата сума в рамките на деня.'},
 {id:'T04',time:'17:41',from:'Доставка',to:'Архив Проект',amount:145,flag:false,detail:'Възстановена надплатена такса.'}
] as const;

export type ChainEntry={id:string;source:string;at:string;officer:string;location:string;lawful:boolean};
export type LivingState={
 reputation:number;phase:number;actions:number;warrants:string[];denied:string[];chain:ChainEntry[];
 expertRequests:string[];experts:string[];confrontations:string[];events:string[];
 locked:string[];secrets:string[];financial:string[];court:{outcome:string;reason:string}|null;
 courtAttempts:number;policy:string[];lastAction:string;
 case2:{found:string[];dialogue:string[];accusations:number;verdict:string|null};
 custom:CaseTemplate|null;customProgress:{found:string[];verdict:string|null};
};
export function initialLiving():LivingState{return {reputation:60,phase:0,actions:0,warrants:[],denied:[],chain:[],expertRequests:[],experts:[],confrontations:[],events:[],locked:[],secrets:[],financial:[],court:null,courtAttempts:0,policy:[],lastAction:'',case2:{found:[],dialogue:[],accusations:0,verdict:null},custom:null,customProgress:{found:[],verdict:null}};}
export function progressTick(s:LivingState):void {
 s.actions=Math.min(500,s.actions+1);s.phase=Math.min(4,Math.floor(s.actions/3));
 if(s.actions>=3&&!s.events.includes('phone'))s.events.push('phone');
 if(s.actions>=6&&!s.events.includes('witness'))s.events.push('witness');
 if(s.actions>=9&&!s.events.includes('letter'))s.events.push('letter');
}
export function canWarrant(id:string,found:ReadonlySet<string>,reputation:number) {
 const w=warrantDefinitions.find(w=>w.id===id);
 return !!w&&w.needs.every(e=>found.has(e))&&reputation>=35;
}
export function capture(s:LivingState,id:string,source:string,location:string,lawful=true,now=new Date().toISOString()) {
 if(!s.chain.some(e=>e.id===id))s.chain.push({id,source,at:now,officer:'Детектив / CASEFILES',location,lawful});
}
export function canAdmit(s:LivingState,id:string):boolean {
 const entry=s.chain.find(e=>e.id===id);
 return !!entry&&entry.lawful&&!s.locked.includes('evidence:'+id);
}
export function visibility(s:LivingState,found:ReadonlySet<string>) {
 return {
 reputation:s.reputation,phase:s.phase,actions:s.actions,warrants:warrantDefinitions.map(w=>({...w,approved:s.warrants.includes(w.id),eligible:canWarrant(w.id,found,s.reputation),denied:s.denied.includes(w.id)})),
 chain:s.chain,experts:expertDefinitions.map(x=>({id:x.id,name:x.name,available:x.needs.every(e=>found.has(e)),requested:s.expertRequests.includes(x.id),ready:s.experts.includes(x.id),report:s.experts.includes(x.id)?x.report:null})),
 confrontations:confrontationDefinitions.map(x=>({id:x.id,title:x.title,available:x.needs.every(e=>found.has(e)),done:s.confrontations.includes(x.id),result:s.confrontations.includes(x.id)?x.result:null})),
 events:s.events.map(id=>({id,title:id==='phone'?'Нов пропуснат разговор':id==='witness'?'Допълнителен свидетел':'Анонимно писмо',message:id==='phone'?'Проверете часовете от телефонния регистър.':id==='witness'?'Портиерът напомня, че силует не доказва самоличност.':'Копие на финансов сигнал е оставено в пощенската кутия.'})),
 locked:s.locked,policy:s.policy,secrets:[
 {id:'martin',title:'Скрита служебна кореспонденция',unlocked:s.secrets.includes('martin'),text:s.secrets.includes('martin')?'Мартин е бил предупреден, че фактурите ще бъдат прегледани.':'Нужно е финансово становище.'},
 {id:'elena',title:'Причина за премълчан разговор',unlocked:s.secrets.includes('elena'),text:s.secrets.includes('elena')?'Елена е премълчала разговора от страх, че ще бъде обвинена.':'Нужно е доказано противоречие.'},
 {id:'petar',title:'Неточен часови спомен',unlocked:s.secrets.includes('petar'),text:s.secrets.includes('petar')?'Петър обърква времето на шума с времето на заключването.':'Нужно е видео становище.'}
 ],
 transactions:transactions.map(t=>({...t,analyzed:s.financial.includes(t.id),detail:s.financial.includes(t.id)?t.detail:null,flag:s.financial.includes(t.id)?t.flag:null})),
 financialComplete:s.financial.includes('T02')&&s.financial.includes('T03'),
 court:s.court,courtAttempts:s.courtAttempts,case2:{...s.case2},custom:s.custom?{id:s.custom.id,title:s.custom.title,briefing:s.custom.briefing,setting:s.custom.setting}:null,
 customProgress:s.customProgress,
 clockLabel:['Оглед','Събиране на данни','Експертизи','Оспорване','Заключение'][s.phase]
 };
}
export const warrantAction=z.object({id:z.enum(['office','basement'])});
export const expertAction=z.object({id:z.enum(['medical','video','financial'])});
export const confrontationAction=z.object({id:z.enum(['contact','invoices'])});
export const financeAction=z.object({id:z.enum(['T01','T02','T03','T04'])});
export const policyAction=z.object({choice:z.enum(['respect','publicize','force'])});
export const courtAction=z.object({route:z.enum(['financial','temporal']),evidenceIds:z.array(z.string().max(10)).min(3).max(8)});
export const caseAction=z.object({caseId:z.string().max(32),action:z.enum(['discover','interview','accuse']),id:z.string().max(30),evidenceIds:z.array(z.string()).max(8).optional()});
export function solveCase(state:{found:string[];dialogue:string[];accusations:number;verdict:string|null},template:CaseTemplate,suspectId:string,evidenceIds:string[]) {
 const selected=new Set(evidenceIds.filter(id=>state.found.includes(id)));
 const valid=selected.size>=3&&template.solution.clueIds.filter(id=>selected.has(id)).length>=3;
 return !valid?'insufficient':suspectId===template.solution.suspectId?'solved':'incorrect';
}
export function publicStory(template:CaseTemplate,state:{found:string[];dialogue:string[];accusations:number;verdict:string|null}) {
 return {id:template.id,title:template.title,setting:template.setting,briefing:template.briefing,
 suspects:template.suspects,clues:template.clues.map(c=>({id:c.id,title:state.found.includes(c.id)?c.title:'Неоткрита следа',description:state.found.includes(c.id)?c.description:null,location:c.location,found:state.found.includes(c.id)})),
 found:state.found,dialogue:state.dialogue,accusations:state.accusations,verdict:state.verdict,
 ending:state.verdict==='solved'?template.solution.explanation:null};
}
