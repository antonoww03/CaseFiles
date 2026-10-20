import { useEffect, useState } from 'react';
import {
  Activity, Archive, ArrowRight, BookOpen, Check,
  Clock3, FileCheck2, FileSearch, Files, Fingerprint, FolderLock,
  Gavel, Handshake, Lock, Scale,
  ShieldAlert, ShieldCheck, Timer, UserRound, Wallet, X
} from 'lucide-react';
import './living.css';
import {VisualCaseEditor} from './VisualCaseEditor';

type Warrant={id:string;title:string;place:string;reason:string;needs:string[];eligible:boolean;approved:boolean;denied:boolean};
type Entry={id:string;source:string;at:string;officer:string;location:string;lawful:boolean};
type Expert={id:string;name:string;available:boolean;requested:boolean;ready:boolean;report:string|null};
type Confrontation={id:string;title:string;available:boolean;done:boolean;result:string|null};
type Event={id:string;title:string;message:string};
type Secret={id:string;title:string;unlocked:boolean;text:string};
type Transfer={id:string;time:string;from:string;to:string;amount:number;analyzed:boolean;detail:string|null;flag:boolean|null};
type Living={reputation:number;phase:number;actions:number;warrants:Warrant[];chain:Entry[];experts:Expert[];confrontations:Confrontation[];events:Event[];locked:string[];policy:string[];secrets:Secret[];transactions:Transfer[];financialComplete:boolean;court:{outcome:string;reason:string}|null;courtAttempts:number;case2:{found:string[];dialogue:string[];accusations:number;verdict:string|null};custom:{id:string;title:string;briefing:string;setting:string}|null;customProgress:{found:string[];verdict:string|null};clockLabel:string};
type Story={id:string;title:string;setting:string;briefing:string;suspects:{id:string;name:string;alibi:string}[];clues:{id:string;title:string;description:string|null;location:string;found:boolean}[];found:string[];dialogue:string[];accusations:number;verdict:string|null;ending:string|null};
type Catalog={id:string;title:string;briefing:string;setting:string;status:string}[];
const sections=[
 {id:'warrants',name:'Заповеди и улики',icon:FileCheck2},
 {id:'experts',name:'Разследване',icon:Fingerprint},
 {id:'finance',name:'Финанси и съд',icon:Scale},
 {id:'cases',name:'Библиотека със случаи',icon:Files},
 {id:'editor',name:'Редактор на истории',icon:BookOpen}
] as const;
type Section=(typeof sections)[number]['id'];
const demoTemplate={
 id:'custom-nightshift',title:'Тайната на нощната смяна',setting:'Варна, измислен хотел',
 briefing:'След изчезването на служебен договор трима служители дават противоречиви показания. Разследващият трябва да намери шестте документа и да възстанови маршрута на липсващата папка.',
 suspects:[
  {id:'ina',name:'Ина Петрова',alibi:'Бях на рецепцията от двадесет до двадесет и три часа.'},
  {id:'misho',name:'Михаил Георгиев',alibi:'Проверявах складовите помещения през цялата смяна.'},
  {id:'nora',name:'Нора Иванова',alibi:'Приключвах с администрацията далеч от архива.'}
 ],
 clues:[
  {id:'C1',title:'Дневник за достъп',description:'Входната система отчита отключване на архивното помещение в 23:17.',location:'Рецепция'},
  {id:'C2',title:'Служебно съобщение',description:'Получено е съобщение за липсващия договор час по-рано.',location:'Телефон'},
  {id:'C3',title:'Транспортен протокол',description:'В протокола липсва подпис при преместването на папките.',location:'Склад'},
  {id:'C4',title:'Кадър от коридора',description:'На записа се вижда служебна количка, преминаваща в 23:20.',location:'Коридор'},
  {id:'C5',title:'Разписка',description:'Била е издадена разписка за архивна кутия без получател.',location:'Офис'},
  {id:'C6',title:'Изтрит имейл',description:'Възстановеното писмо посочва дата за извеждане на договора.',location:'Компютър'}
 ],
 solution:{suspectId:'misho',clueIds:['C1','C3','C4','C6'],explanation:'Маршрутът, времето на достъп и изтритото писмо подкрепят заключението за Михаил в тази измислена история.'}
};
async function request<T>(session:string,path:string,method='GET',body?:unknown):Promise<T>{
 const resp=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{method,headers:{'Content-Type':'application/json',...(session?{'x-case-session':session}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await resp.json();if(!resp.ok)throw new Error(data.error||'Грешка при заявка.');
 return data as T;
}
const formatTime=(value:string)=>new Date(value).toLocaleString('bg-BG',{dateStyle:'short',timeStyle:'short'});
export function LivingInvestigation({session,found}:{session:string;found:string[]}) {
 const [section,setSection]=useState<Section>('warrants');
 const [living,setLiving]=useState<Living|null>(null);
 const [catalog,setCatalog]=useState<Catalog>([]);
 const [story,setStory]=useState<Story|null>(null);
 const [caseId,setCaseId]=useState('case-002');
 const [chosen,setChosen]=useState<string[]>([]);
 const [suspect,setSuspect]=useState('');
 const [route,setRoute]=useState<'financial'|'temporal'>('financial');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [template,setTemplate]=useState(demoTemplate);
 useEffect(()=>{void request<Catalog>('','/cases').then(setCatalog).catch(()=>{});},[]);
 async function refresh(){
  if(!session)return;
  try {setLiving(await request<Living>(session,'/living'));}
  catch(e){setNotice(e instanceof Error?e.message:String(e));}
 }
 async function refreshStory(id=caseId){
  if(!session||id==='case-001')return;
  try {setStory(await request<Story>(session,'/living/case/'+encodeURIComponent(id)));}
  catch(e){setStory(null);setNotice(e instanceof Error?e.message:String(e));}
 }
 useEffect(()=>{setLiving(null);void refresh();},[session,found.join(',')]);
 useEffect(()=>{setStory(null);void refreshStory();},[session,caseId]);
 async function act(kind:string,extra:Record<string,unknown>){
  if(busy||!session)return;
  setBusy(true);setNotice('');
  try {const data=await request<{message:string;progress:Living}>(session,'/living/action','POST',{kind,...extra});setLiving(data.progress);setNotice(data.message);}
  catch(e){setNotice(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 async function storyAct(action:string,id:string){
  if(busy||!session||caseId==='case-001')return;
  setBusy(true);setNotice('');
  try{const data=await request<{message:string;story:Story}>(session,'/living/case/action','POST',{caseId,action,id,evidenceIds:chosen});setStory(data.story);setNotice(data.message);await refresh();}
  catch(e){setNotice(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 async function createStory(){
  if(busy||!session)return;
  setBusy(true);setNotice('');
  try{const data=await request<{id:string;title:string}>(session,'/living/case/editor','POST',template);setNotice('Историята е записана в тази игрова сесия.');setCaseId(data.id);setSection('cases');}
  catch(e){setNotice(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 const toggle=(id:string)=>setChosen(a=>a.includes(id)?a.filter(x=>x!==id):a.length>=8?a:[...a,id]);
 return <div className="liv-root">
  <nav className="liv-nav" aria-label="Разширени разследвания">{sections.map(s=><button key={s.id} className={section===s.id?'active':''} onClick={()=>{setSection(s.id);setNotice('');}} type="button"><s.icon size={17}/>{s.name}</button>)}</nav>
  {notice&&<div className="liv-notice" role="status"><ShieldAlert size={18}/><span>{notice}</span><button type="button" onClick={()=>setNotice('')} aria-label="Затвори"><X size={16}/></button></div>}
  {!session?<div className="liv-empty"><Lock size={27}/>Първо започни игрова сесия, за да отключиш разследванията.</div>:!living?<div className="liv-empty">Зареждане на следствените данни...</div>:<>
  <div className="liv-overview">
    <div><span><Clock3 size={15}/> ИГРОВИ ЧАСОВНИК</span><strong>ФАЗА {living.phase+1} / 5</strong><small>{living.clockLabel} · {living.actions} действия</small></div>
    <div><span><Handshake size={15}/> РЕПУТАЦИЯ</span><strong>{living.reputation} / 100</strong><div className="liv-meter"><span style={{width:living.reputation+'%'}}/></div></div>
    <div><span><Activity size={15}/> ДИНАМИЧНИ СЪБИТИЯ</span><strong>{living.events.length} активни</strong><small>Отключват се с игровия напредък</small></div>
  </div>
  {section==='warrants'&&<div className="liv-column">
   <Header icon={FolderLock} title="Разрешения за обиск" detail="Исканията се разглеждат по доказателства и репутация. Това са игрови правила, не реална правна процедура."/>
   <div className="liv-grid">{living.warrants.map(w=><article className="liv-card" key={w.id}><div className="liv-label">{w.approved?'РАЗРЕШЕНО':w.eligible?'ГОТОВО ЗА ПОДАВАНЕ':'НЯМА ДОСТАТЪЧНО ОСНОВАНИЯ'}</div><h3>{w.title}</h3><p>{w.reason}</p><small>{w.place} · Улики: {w.needs.join(', ')}</small><button type="button" className="primary" disabled={busy||!w.eligible||w.approved} onClick={()=>void act('warrant',{id:w.id})}>{w.approved?<><Check size={15}/> Разрешено</>:<>Поискай заповед <ArrowRight size={15}/></>}</button></article>)}</div>
   <Header icon={Archive} title="Верига на доказателствата" detail="Кога е записана уликата в CASEFILES, откъде идва и кой я е обработил. Исторически събирания преди този ъпдейт може да липсват."/>
   <div className="liv-table-wrap"><table><thead><tr><th>Улика</th><th>Събиране</th><th>Източник</th><th>Статус</th></tr></thead><tbody>{living.chain.map(c=><tr key={c.id}><td><strong>{c.id}</strong><small>{c.location}</small></td><td>{formatTime(c.at)}</td><td>{c.source}</td><td><span className={c.lawful?'liv-ok':'liv-bad'}>{c.lawful?'С протокол':'Оспоримо'}</span></td></tr>)}</tbody></table>{living.chain.length===0&&<div className="liv-empty">Все още няма новозаписани доказателства.</div>}</div>
   <Header icon={ShieldCheck} title="Допустимост на материалите" detail="В съдебната фаза се проверява както произходът, така и наличието на игрово разрешение за защитени документи."/>
   <p className="liv-muted">Финансовата чернова E09 изисква разрешение за служебния архив. Данните за пропуска E10 изискват разрешение за сервизния вход. Материали без проследим произход не се приемат автоматично.</p>
  </div>}
  {section==='experts'&&<div className="liv-column">
   <Header icon={Fingerprint} title="Експертни заключения" detail="Назначи специалист, продължи с друго действие и получи експертно становище."/>
   <div className="liv-grid">{living.experts.map(e=><article className="liv-card" key={e.id}><div className="liv-label">{e.ready?'ЕКСПЕРТИЗАТА Е ГОТОВА':e.requested?'НАЗНАЧЕНА':'ДОСТЪПНА ПРИ НАЛИЧНИ УЛИКИ'}</div><h3>{e.name}</h3><p>{e.report||'Експертният анализ ще бъде разкрит след приключване.'}</p><button type="button" className="secondary" disabled={!e.available||e.ready||busy} onClick={()=>void act('expert',{id:e.id})}>{e.ready?'Готово':e.requested?'Провери резултата':'Назначи експертиза'}</button></article>)}</div>
   <Header icon={UserRound} title="Конфронтации и тайни в досиетата" detail="Предяви доказателствата. Определени избори могат необратимо да блокират линия на разпит."/>
   <div className="liv-grid">{living.confrontations.map(c=><article className="liv-card" key={c.id}><div className="liv-label">{c.done?'ПРОВЕДЕНА':living.locked.includes(c.id)?'ЗАТВОРЕНА ЛИНИЯ':'ОЧАКВА ПОКАЗАНИЯ'}</div><h3>{c.title}</h3><p>{c.result||'Заключението остава скрито до конфронтацията.'}</p><button type="button" className="secondary" disabled={busy||!c.available||c.done||living.locked.includes(c.id)} onClick={()=>void act('confront',{id:c.id})}>Съпостави показанията</button></article>)}</div>
   <div className="liv-grid">{living.secrets.map(s=><article className="liv-card liv-secret" key={s.id}><span className="liv-label">{s.unlocked?'РАЗКРИТА ТАЙНА':'ЗАСЕКРЕТЕНО ДОСИЕ'}</span><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
   <Header icon={Scale} title="Трудни решения" detail="Еднократни избори. Прибързаното разгласяване и натискът могат да затворят следи."/>
   <div className="liv-grid three">{[{choice:'respect',title:'Спазвай процедурата',detail:'Повишава доверието към разследването.'},{choice:'publicize',title:'Разпространи обвинения',detail:'Намалява репутацията и може да затвори разговора с Елена.'},{choice:'force',title:'Използвай натиск',detail:'Намалява репутацията и може да затвори линията с Мартин.'}].map(a=><article className="liv-card" key={a.choice}><h3>{a.title}</h3><p>{a.detail}</p><button type="button" className="secondary" disabled={busy||living.policy.includes(a.choice)} onClick={()=>void act('policy',{choice:a.choice})}>{living.policy.includes(a.choice)?'Вече избрано':'Вземи решение'}</button></article>)}</div>
   <Header icon={Timer} title="Събития според напредъка" detail="Няма реално чакане. Новите сигнали се появяват при достигане на съответната игрова фаза."/>
   <div className="liv-grid">{living.events.map(e=><article className="liv-card" key={e.id}><span className="liv-label">НОВО СЪБИТИЕ</span><h3>{e.title}</h3><p>{e.message}</p></article>)}{living.events.length===0&&<div className="liv-empty">Още няма отключени събития.</div>}</div>
  </div>}
  {section==='finance'&&<div className="liv-column">
    <Header icon={Wallet} title="Разследване на финансови следи" detail="Измислена финансова мрежа. Анализирай транзакциите и потърси необичайните маршрути на средства."/>
    <div className="liv-timeline">{living.transactions.map(t=><article key={t.id} className="liv-transfer"><div><span>{t.time}</span><strong>€{t.amount.toLocaleString('bg-BG')}</strong></div><div><h3>{t.from} <ArrowRight size={15}/> {t.to}</h3><p>{t.analyzed?t.detail:'Детайлите изискват служебно разрешение.'}</p>{t.analyzed&&<span className={t.flag?'liv-bad':'liv-ok'}>{t.flag?'Необичаен поток':'Обичаен запис'}</span>}</div><button type="button" className="secondary" disabled={busy||t.analyzed} onClick={()=>void act('finance',{id:t.id})}>{t.analyzed?'Анализирано':'Изследвай'}</button></article>)}</div>
    <Header icon={Gavel} title="Съдебна фаза" detail="Избери доказателства и аргументация. Прокурорът може да оспори произхода, разрешението или достатъчността на уликите."/>
    <div className="liv-court">
      <div className="liv-switch"><button type="button" className={route==='financial'?'active':''} onClick={()=>setRoute('financial')}>Финансов мотив</button><button type="button" className={route==='temporal'?'active':''} onClick={()=>setRoute('temporal')}>Времева реконструкция</button></div>
      <div className="liv-evidence-picker">{living.chain.map(e=><label key={e.id}><input type="checkbox" checked={chosen.includes(e.id)} onChange={()=>toggle(e.id)}/><strong>{e.id}</strong><span>{e.location}</span></label>)}{living.chain.length===0&&<p>Събери доказателства, за да ги представиш.</p>}</div>
      <button className="primary" type="button" disabled={busy||chosen.length<3} onClick={()=>void act('court',{route,evidenceIds:chosen})}><Scale size={16}/> Представи аргументацията</button>
      {living.court&&<div className={'liv-verdict '+(living.court.outcome==='Приети доказателства'?'success':'')}><strong>{living.court.outcome}</strong><p>{living.court.reason}</p><small>Опити: {living.courtAttempts} · Алтернативни доказателствени пътища</small></div>}
    </div>
  </div>}
  {section==='cases'&&<div className="liv-column">
    <Header icon={Files} title="Библиотека с криминални случаи" detail="Избери Case #002 или своя създаден сценарий. Всеки има отделен прогрес в текущата сесия."/>
    <div className="liv-grid">{catalog.map(t=><button type="button" className={'liv-case '+(caseId===t.id?'selected':'')} key={t.id} onClick={()=>{setCaseId(t.id);setSuspect('');setChosen([]);}}><span className="liv-label">{t.id.toUpperCase()}</span><strong>{t.title}</strong><small>{t.setting}</small><p>{t.briefing}</p></button>)}{living.custom&&<button type="button" className={'liv-case '+(caseId===living.custom.id?'selected':'')} onClick={()=>{setCaseId(living.custom!.id);setSuspect('');setChosen([]);}}><span className="liv-label">СОБСТВЕН СЛУЧАЙ</span><strong>{living.custom.title}</strong><small>{living.custom.setting}</small><p>{living.custom.briefing}</p></button>}</div>
    {caseId==='case-001'?<p className="liv-muted">Оригиналният случай се играе през основните табове „Досие“, „Оглед“, „Разпити“ и „Обвинение“.</p>:story&&<>
     <div className="liv-story-hero"><span className="liv-label">{story.id.toUpperCase()} / АКТИВНО ДОСИЕ</span><h2>{story.title}</h2><p>{story.briefing}</p><small>{story.setting} · Открити следи: {story.found.length}/{story.clues.length}</small></div>
     <Header icon={FileSearch} title="Откриване на доказателства" detail="Началните материали са достъпни веднага; следващите следи се отключват след първите две."/>
     <div className="liv-grid">{story.clues.map((clue,i)=><article className="liv-card" key={clue.id}><div className="liv-label">{clue.id} · {clue.location}</div><h3>{clue.title}</h3><p>{clue.description||'Съдържанието се разкрива след огледа.'}</p><button type="button" className="secondary" disabled={busy||clue.found||(i>=3&&story.found.length<2)} onClick={()=>void storyAct('discover',clue.id)}>{clue.found?<><Check size={15}/> Намерено</>:'Изследвай материала'}</button></article>)}</div>
     <Header icon={UserRound} title="Разпитай заподозрените" detail="Свидетелските показания стават достъпни след две открити улики."/>
     <div className="liv-grid three">{story.suspects.map(p=><article className="liv-card" key={p.id}><h3>{p.name}</h3><p>{story.dialogue.includes(p.id)?p.alibi:'Алибито е заключено до разпит.'}</p><button className="secondary" type="button" disabled={busy||story.found.length<2||story.dialogue.includes(p.id)} onClick={()=>void storyAct('interview',p.id)}>{story.dialogue.includes(p.id)?'Разпитан':'Попитай за алибито'}</button></article>)}</div>
     <Header icon={Gavel} title="Подай обвинение" detail="Използвай поне три подкрепящи улики. При успешно решение се отключва финалното обяснение."/>
     <div className="liv-court"><div className="liv-evidence-picker">{story.clues.filter(c=>c.found).map(c=><label key={c.id}><input type="checkbox" checked={chosen.includes(c.id)} onChange={()=>toggle(c.id)}/><strong>{c.id}</strong><span>{c.title}</span></label>)}</div>
      <select aria-label="Посочи заподозрян" value={suspect} onChange={e=>setSuspect(e.target.value)}><option value="">Избери заподозрян...</option>{story.suspects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <button type="button" className="primary" disabled={busy||chosen.length<3||!suspect} onClick={()=>void storyAct('accuse',suspect)}>Обвини заподозрения <ArrowRight size={16}/></button>
      {story.verdict&&<div className={'liv-verdict '+(story.verdict==='solved'?'success':'')}><strong>{story.verdict==='solved'?'Случаят е разрешен':story.verdict==='incorrect'?'Неправилно обвинение':'Недостатъчно доказателства'}</strong>{story.ending&&<p>{story.ending}</p>}</div>}
     </div>
    </>}
   </div>}
  {section==='editor'&&<div className="liv-column">
    <Header icon={BookOpen} title="Визуален редактор на криминални истории" detail="Редактирай историята, тримата заподозрени, уликите и решението с форми. Всичко се проверява на сървъра."/>
    <VisualCaseEditor template={template} onChange={setTemplate} onSave={()=>void createStory()} busy={busy}/>
    <p className="liv-muted">Редакторът е за собствени измислени случаи и не публикува съдържание глобално. Засега поддържа три заподозрени, 5–8 улики и една проверявана развръзка.</p>
   </div>}
   </>}
 </div>;
}
function Header({icon:Icon,title,detail}:{icon:typeof FileCheck2;title:string;detail:string}){return <div className="liv-heading"><Icon size={23}/><div><h2>{title}</h2><p>{detail}</p></div></div>;}
