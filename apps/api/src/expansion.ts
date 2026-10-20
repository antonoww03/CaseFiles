import { z } from 'zod';

export const difficultySchema = z.enum(['rookie','detective','expert']);
export type Difficulty = z.infer<typeof difficultySchema>;
export type InvestigationProgress = {
  difficulty: Difficulty;
  actions: { at: string; kind: string; text: string }[];
  milestones: string[];
  suspects: Record<string,number>;
  placements: Record<string,string>;
  classifications: Record<string,string>;
  attempts: { at:string; result:string; selected:string }[];
  tutorial: string[];
  uiSettings: { reducedMotion:boolean; sound:boolean };
};
export const initialProgress = (): InvestigationProgress => ({
  difficulty: 'detective', actions: [], milestones: [], suspects: { martin:50, elena:50, petar:50 },
  placements: {}, classifications: {}, attempts: [], tutorial: [], uiSettings: { reducedMotion:false, sound:false }
});
export const unlocks = [
  { id:'apartment', name:'Апартамент 407', detail:'Място на първоначалния оглед', needs:[] },
  { id:'lobby', name:'Вход и асансьор', detail:'Регистри и камери на сградата', needs:['E05'] },
  { id:'office', name:'Служебен архив', detail:'Следа към финансовите материали', needs:['E04'] },
  { id:'parking', name:'Паркинг и прилежащи улици', detail:'Възможен изход от сградата', needs:['E07'] }
] as const;

export const puzzles = [
  { id:'fingerprints', name:'Сравнение на отпечатъци', type:'fingerprints', requires:['E01'], question:'Кой от трите образеца има еднакъв отличителен разклонен контур?', choices:['Образец A — прекъснат','Образец B — разклонен','Образец C — концентричен'], solution:'1', result:'Съвпадащ геометричен контур на пробния отпечатък. Това не установява самоличност.' },
  { id:'audio', name:'Анализ на аудио', type:'audio', requires:['E12'], question:'Кое маркирано събитие съвпада с най-силния пик на игровата вълнова форма?', choices:['00:42 — съобщение','01:23 — единичен шум','01:29 — външна камера'], solution:'1', result:'Пикът подкрепя възможен шум около 01:23, но не идентифицира източника.' },
  { id:'uv', name:'Оглед с UV фенер', type:'uv', requires:['E01'], question:'Коя зона разкрива скрития маркер при ултравиолетова проверка?', choices:['Прозорец','Чекмедже на бюрото','Входна изтривалка'], solution:'1', result:'Под UV светлина на вътрешната страна на чекмеджето се вижда знак „47A“ — контекстна следа.' },
  { id:'recovery', name:'Възстановяване на файлове', type:'recovery', requires:['E04'], question:'Подреди фрагментите на изтритата бележка в смислен ред.', choices:['фактури → Провери → оригиналните','Провери → оригиналните → фактури','оригиналните → фактури → Провери'], solution:'1', result:'Възстановено е: „Провери оригиналните фактури“. Не се установява нов извършител.' },
  { id:'route', name:'Проверка на маршрут', type:'map', requires:['E05','E06'], question:'Кое твърдение следва от записите за входа и асансьора?', choices:['Известно е точно кой е влязъл','Посетител е могъл да стигне до етаж 4','Мартин със сигурност е бил там'], solution:'1', result:'Интервалът позволява придвижване, но самоличността остава непотвърдена.' },
  { id:'alibi-map', name:'Алиби и местоположение', type:'alibi', requires:['E03','E11'], question:'Какъв извод е допустим от разговор в 01:17?', choices:['Елена непременно е била в апартамента','Местоположението на Елена не е доказано','Елена със сигурност е невинна'], solution:'1', result:'Телефонният разговор сам по себе си не установява физическо местоположение.' },
  { id:'red-herring', name:'Разпознаване на фалшива следа', type:'logic', requires:['E03','E11'], question:'Кое заключение е прибързано?', choices:['Елена е разговаряла с Никола','Липсва съдържанието на разговора','Елена е убиецът, защото е разговаряла с него'], solution:'2', result:'Фалшивата причинно-следствена връзка е отхвърлена.' }
] as const;

export const classificationTargets = [
 {id:'E06',label:'Записът показва презрамка', correct:'observation'},
 {id:'E11',label:'Елена е отрекла контакт', correct:'testimony'},
 {id:'E05',label:'Кодът е бил използван в 01:09', correct:'observation'},
 {id:'H01',label:'Посетителят непременно е Мартин', correct:'hypothesis'}
] as const;

export const witnesses = [
 {id:'guard',name:'Служител по сигурността',requires:['E05'],statement:'Проверявам журнала на системата, но той доказва използван код, не самоличност.'},
 {id:'cleaner',name:'Портиерът',requires:['E07'],statement:'На записа фигурата е неясна. Не мога да потвърдя кого показва камерата.'}
] as const;

export const timelineItems = [
 {id:'t1',time:'00:42',event:'Искане за оригиналните фактури',requires:'E04'},
 {id:'t2',time:'01:09',event:'Отваряне с временен код',requires:'E05'},
 {id:'t3',time:'01:12',event:'Фигура в асансьора',requires:'E06'},
 {id:'t4',time:'01:17',event:'Последен телефонен разговор',requires:'E03'},
 {id:'t5',time:'01:28',event:'Автоматично заключване',requires:'E08'},
 {id:'t6',time:'01:29',event:'Фигура напуска сградата',requires:'E07'}
] as const;

export const tutorial = [
 {id:'scene',title:'Разгледай местопрестъплението',info:'Използвай маркерите върху предметите и събери първата улика.'},
 {id:'forensics',title:'Анализирай материал',info:'Прегледай видео или документ от криминалистичния модул.'},
 {id:'deduction',title:'Направи логическа връзка',info:'Свържи две намерени доказателства на дъската.'},
 {id:'interview',title:'Проведи разпит',info:'Предяви доказателство и провери показанията.'}
] as const;

export const actionSchema = z.discriminatedUnion('kind',[
 z.object({kind:z.literal('puzzle'),id:z.string().max(40),answer:z.string().max(80)}),
 z.object({kind:z.literal('classify'),id:z.string().max(40),answer:z.enum(['observation','testimony','hypothesis'])}),
 z.object({kind:z.literal('suspect'),id:z.enum(['martin','elena','petar']),score:z.number().int().min(0).max(100)}),
 z.object({kind:z.literal('timeline'),id:z.string().max(30),position:z.string().max(30)}),
 z.object({kind:z.literal('tutorial'),id:z.string().max(30)}),
 z.object({kind:z.literal('settings'),sound:z.boolean(),reducedMotion:z.boolean()}),
 z.object({kind:z.literal('witness'),id:z.string().max(40)})
]);
export function canEnter(locationId:string, found:Set<string>) {
 const place=unlocks.find(x=>x.id===locationId);
 return !!place&&place.needs.every(id=>found.has(id));
}
export function achievements(found:Set<string>,links:Set<string>,verified:Set<string>,milestones:string[],attempts:number,solved:boolean){
 const achieved=new Set(milestones);
 return [
  {id:'first-evidence',title:'Първа следа',done:found.size>=1},
  {id:'all-evidence',title:'Пълен архив',done:found.size>=12},
  {id:'deduction',title:'Логическо мислене',done:links.size>=3},
  {id:'alibi',title:'Проверено алиби',done:verified.size>=1},
  {id:'lab',title:'Криминалист',done:achieved.has('fingerprints')&&achieved.has('audio')},
  {id:'explorer',title:'Изследовател',done:achieved.has('uv')&&achieved.has('route')},
  {id:'solved',title:'Разрешен случай',done:solved},
  {id:'perfect',title:'Без грешни обвинения',done:solved&&attempts===1}
 ];
}
export function outcome(solved:boolean, mistakes:number, score:number) {
 return !solved?'Продължаващо разследване':score>=85&&mistakes===0?'Пълно разкритие':'Доказано обвинение';
}
