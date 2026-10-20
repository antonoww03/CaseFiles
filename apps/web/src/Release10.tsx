import {useEffect,useRef,useState} from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle2, ClipboardList, FileCheck2, Fingerprint, FolderOpen, KeyRound, Lock, MapPin, Menu, MessageCircle, Microscope, Phone, Play, Save, ScanEye, Search, Settings2, SkipForward, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import './release10.css';
import { ForensicWorkbench } from './ForensicPanels';
import {SceneExtras11,Board11,Dialog11,Timeline11,Tape11} from './Experience11';
import {DirectorStage12,DirectorPortrait,Closeup12} from './Director12';
import {ObjectArt,visualForClue,roomAsset} from './sceneArt';
import {Detective13,Objective13} from './Detective13';
import {InvestigationDesk14} from './InvestigationDesk14';

type CaseId='case-001'|'case-002';
type Stage='scene'|'evidence'|'puzzles'|'interview'|'phone'|'detective'|'desk'|'ending';
type CaseScene={id:string;caseId:string;title:string;subtitle:string;art:string;clueId?:string;clueTitle?:string;available?:boolean;found?:boolean;detail?:string|null};
type Puzzle={id:string;name:string;question:string;available:boolean;solved:boolean;requires:readonly string[];type:string;location:string};
type ArchiveWitness={id:string;name:string;available:boolean;interviewed:boolean;statement:string|null};
type ReleaseState={
 case1:{found:string[];ending:string;reportAvailable:boolean;missions:{id:string;title:string;detail:string;done:boolean}[]};
 case2:{found:string[];interviews:string[];verdict:string|null;ending:string;epilogue:string|null;accusations:number;scenes:CaseScene[];puzzles:Puzzle[];witnesses:ArchiveWitness[];canAccuse:boolean;quality:number};
 beats:Record<CaseId,{id:string;title:string;line:string}[]>;
 totalProgress:number;
};
type Evidence={id:string;title:string;detail:string;type:string};
type PhoneRecord={id:string;app:string;title:string;preview:string;detail:string|null;available:boolean;opened:boolean};
type Digital={phone:PhoneRecord[]};
type Report={headline:string;conclusion:string;score?:{total?:number};ending?:string};
const caseNames:Record<CaseId,string>={'case-001':'Последното обаждане','case-002':'Изчезналият архив'};
const caseMeta:Record<CaseId,{location:string;line:string;image:string;badge:string}>={
 'case-001':{location:'СОФИЯ / АПАРТАМЕНТ 407',line:'Трима заподозрени. Един последен разговор. Нощ, в която времето има значение.',image:'/art/apartment-noir.svg',badge:'УБИЙСТВО · 14 OCT'},
 'case-002':{location:'ПЛОВДИВ / ГРАДСКИ АРХИВ',line:'Един изчезнал договор. Един прекъснат регистър. Шест следи към истината.',image:'/art/archive-noir.svg',badge:'ИЗЧЕЗНАЛ ДОКУМЕНТ · 23:47'}
};
const scene1=[
 {id:'living',title:'Всекидневна',subtitle:'Протокол и последен разговор',clues:['E01','E03'],x:29,y:54},
 {id:'desk',title:'Работен кабинет',subtitle:'Кореспонденция и фактури',clues:['E04'],x:62,y:67},
 {id:'entrance',title:'Вход / охрана',subtitle:'Дневник на достъпа и ключалка',clues:['E05','E08'],x:80,y:41},
 {id:'medical',title:'Първичен преглед',subtitle:'Съдебномедицинска оценка',clues:['E02'],x:40,y:72}
] as const;
const evidenceCatalog:Evidence[]=[
 {id:'E01',title:'Протокол от огледа',detail:'Апартаментът е бил заключен. Няма следи от взлом.',type:'Документ'},
 {id:'E03',title:'Последното обаждане',detail:'01:17 — разговор с Елена, 18 секунди.',type:'Телефон'},
 {id:'E04',title:'Служебна кореспонденция',detail:'Никола изисква оригиналите на фактурите.',type:'Съобщение'},
 {id:'E05',title:'Регистър на входен код',detail:'01:09 — временен код отваря сградата.',type:'Регистър'},
 {id:'E08',title:'Журнал на ключалката',detail:'01:28 — вратата се заключва автоматично.',type:'Регистър'},
 {id:'E02',title:'Медицинска оценка',detail:'Ориентировъчен интервал 01:20–01:25.',type:'Медицина'},
 {id:'E06',title:'Камера / асансьор',detail:'Силует с диагонална презрамка в 01:12.',type:'Видео'},
 {id:'E07',title:'Камера / вход',detail:'Сходен силует напуска в 01:29.',type:'Видео'},
 {id:'E09',title:'Финансова чернова',detail:'Несъответствия по служебни фактури.',type:'Документ'},
 {id:'E10',title:'Регистър на пропуски',detail:'Временен код за уговорено посещение.',type:'Регистър'},
 {id:'E11',title:'Протокол / Елена',detail:'Показанието противоречи на разговорите.',type:'Разпит'},
 {id:'E12',title:'Протокол / Петър',detail:'Часът на шума е приблизителен.',type:'Разпит'}
];
const stages:[Stage,string,typeof Search][]=[['scene','Местопрестъпление',ScanEye],['evidence','Досие',BookOpen],['puzzles','Криминалистика',Microscope],['interview','Разпити',MessageCircle],['phone','Телефон',Phone],['detective','Детективски режим',Search],['desk','Следствено бюро',BookOpen],['ending','Финал',FileCheck2]];
async function request<T>(token:string,path:string,method='GET',body?:unknown):Promise<T>{
 const res=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{'x-case-session':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||'Сървърът не отговаря.');
 return data as T;
}
function useSfx(){
 const ref=useRef<AudioContext|null>(null);
 useEffect(()=>()=>{if(ref.current)void ref.current.close();},[]);
 return (enabled:boolean,pitch=330)=>{
  if(!enabled)return;
  try{
   const context=ref.current&&ref.current.state!=='closed'?ref.current:new AudioContext();ref.current=context;
   const oscillator=context.createOscillator(),gain=context.createGain();
   oscillator.type='triangle';oscillator.frequency.setValueAtTime(pitch,context.currentTime);
   oscillator.frequency.exponentialRampToValueAtTime(pitch*.65,context.currentTime+.19);
   gain.gain.setValueAtTime(.045,context.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.21);
   oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.22);
  }catch{}
 };
}
export function Home10({session,busy,onStart,onContinue,onLegacy,onCommunity}:{session:string;busy:boolean;onStart:(id:CaseId)=>void;onContinue:()=>void;onLegacy:()=>void;onCommunity:()=>void}){
 const [selected,setSelected]=useState<CaseId>(()=>localStorage.getItem('cf10-selected-case')==='case-002'?'case-002':'case-001');
 const [menu,setMenu]=useState<'cases'|'settings'|'none'>('none');
 const [skipIntro,setSkipIntro]=useState(()=>localStorage.getItem('cf10-skip-intro')==='true');
 const [noMotion,setNoMotion]=useState(()=>localStorage.getItem('cf10-reduce-motion')==='true');
 return <div className={'r10-home '+(noMotion?'r10-still':'')}>
  <div className="r10-home-bg" style={{backgroundImage:'url('+caseMeta[selected].image+')'}}/>
  <header className="r10-topbar"><strong>CASE<span>FILES</span></strong><span>RELEASE 1.0 / THE DETECTIVE EXPERIENCE</span><button type="button" onClick={onLegacy}><Menu size={18}/> Класически инструменти</button></header>
  <main className="r10-home-center">
   <div className="r10-home-copy"><span className="r10-eyebrow"><span className="r10-live-dot"/> СЛУЧАЙ {selected==='case-001'?'001':'002'} · {caseMeta[selected].badge}</span>
    <h1>Истината е<br/><em>в детайлите.</em></h1><p>{caseMeta[selected].line}</p>
    <div className="r10-home-actions">
     <button className="r10-gold" disabled={busy} onClick={()=>onStart(selected)} type="button"><Play size={19}/> Започни разследването <ArrowRight size={18}/></button>
     <button className="r10-outline" onClick={onContinue} type="button" disabled={!session||busy}><Save size={18}/> Продължи</button>
    </div>
    <div className="r10-home-options"><button onClick={onCommunity} type="button"><FolderOpen size={16}/> Екипна игра / нови случаи</button><button onClick={()=>setMenu(menu==='cases'?'none':'cases')} type="button"><FolderOpen size={16}/> Избери случай</button><button onClick={()=>setMenu(menu==='settings'?'none':'settings')} type="button"><Settings2 size={16}/> Настройки</button><button onClick={onLegacy} type="button"><Fingerprint size={16}/> Разширен режим</button></div>
    {menu==='cases'&&<div className="r10-select" role="group" aria-label="Избор на случай">{(['case-001','case-002'] as const).map(id=><button type="button" key={id} className={selected===id?'active':''} onClick={()=>{setSelected(id);localStorage.setItem('cf10-selected-case',id);setMenu('none');}}><span>{id==='case-001'?'CASE 001':'CASE 002'}</span><strong>{caseNames[id]}</strong><small>{caseMeta[id].location}</small></button>)}</div>}
    {menu==='settings'&&<div className="r10-settings"><label><input type="checkbox" checked={skipIntro} onChange={e=>{setSkipIntro(e.target.checked);localStorage.setItem('cf10-skip-intro',String(e.target.checked));}}/> Пропускай сюжетните въведения</label><label><input type="checkbox" checked={noMotion} onChange={e=>{setNoMotion(e.target.checked);localStorage.setItem('cf10-reduce-motion',String(e.target.checked));}}/> Намалени анимации</label><p>Звукът е изключен по подразбиране и се включва само в игровия екран.</p></div>}
   </div>
   <aside className="r10-home-files"><span>ДОСИЕТА / ПОВЕРИТЕЛНО</span>{(['case-001','case-002'] as const).map((id,i)=><button key={id} type="button" onClick={()=>{setSelected(id);localStorage.setItem('cf10-selected-case',id);}} className={id===selected?'active':''}><small>0{i+1} / {id==='case-001'?'СОФИЯ':'ПЛОВДИВ'}</small><strong>{caseNames[id]}</strong><span>{id===selected?'АКТИВНО ДОСИЕ':'ИЗБЕРИ'}</span></button>)}<p>Две отделни истории. Без задължителен AI.</p></aside>
  </main><footer className="r10-home-footer"><span>CASEFILES • INVESTIGATE / DEDUCE / DECIDE</span><span>DESKTOP + MOBILE</span></footer>
 </div>;
}
export function FullGame10({session,caseId,found,onFound,onHome,onLegacy}:{session:string;caseId:CaseId;found:string[];onFound:(ids:string[])=>void;onHome:()=>void;onLegacy:(section:string)=>void}){
 const [stage,setStage]=useState<Stage>('scene'),[data,setData]=useState<ReleaseState|null>(null);
 const [scene,setScene]=useState(''),[focus,setFocus]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [suspect,setSuspect]=useState(caseId==='case-002'?'boris':'martin'),[selected,setSelected]=useState<string[]>([]);
 const [puzzleAnswers,setPuzzleAnswers]=useState<Record<string,string>>({}),[phone,setPhone]=useState<Digital|null>(null);
 const [phoneId,setPhoneId]=useState(''),[interviewText,setInterviewText]=useState(''),[interviewReply,setInterviewReply]=useState('');
 const [motive,setMotive]=useState('Финансови несъответствия по фактурите и натиск около оригиналните документи.');
 const [sequence,setSequence]=useState('Първо входният код, после асансьорът, разговорът, приблизителният интервал и изходът.');
 const [report,setReport]=useState<Report|null>(null),[audio,setAudio]=useState(false);
 const [closeup,setCloseup]=useState('');
 const [linkA,setLinkA]=useState(''),[linkB,setLinkB]=useState(''),[knownLinks,setKnownLinks]=useState<{id:string;title:string}[]>([]);
 const [skipIntro]=useState(()=>localStorage.getItem('cf10-skip-intro')==='true');
 const [intro,setIntro]=useState(!skipIntro),[mobileNav,setMobileNav]=useState(false);
 const sound=useSfx();
 const meta=caseMeta[caseId],isFirst=caseId==='case-001';
 const clueIds=isFirst?found:data?.case2.found||[];
 const archiveScene=data?.case2.scenes.find(x=>x.id===scene)||data?.case2.scenes[0];
 const activeScene=isFirst?scene1.find(x=>x.id===scene)||scene1[0]:archiveScene;
 const beats=data?.beats[caseId]||[];
 async function refresh(){
  if(!session)return;
  try{
   const latest=await request<ReleaseState>(session,'/release10');setData(latest);
   if(isFirst&&latest.case1.reportAvailable){void request<Report>(session,'/report').then(setReport).catch(()=>{});}
  }catch(e){setNotice(e instanceof Error?e.message:String(e));}
 }
 useEffect(()=>{setStage('scene');setScene('');setFocus('');setSelected([]);setSuspect(caseId==='case-001'?'martin':'boris');setIntro(!skipIntro);void refresh();},[caseId,session]);
 useEffect(()=>{if(session)void refresh();},[found.join(',')]);
 useEffect(()=>{if(stage==='phone'&&isFirst&&session)void request<Digital>(session,'/cinematic').then(setPhone).catch(()=>{});},[session,stage,caseId]);
 useEffect(()=>{if(stage==='evidence'&&isFirst&&session)void request<{id:string;title:string}[]>(session,'/deductions').then(setKnownLinks).catch(()=>{});},[session,stage,caseId,found.join(',')]);
 async function act<T>(path:string,body:unknown):Promise<T|null>{
  if(busy)return null;setBusy(true);setNotice('');
  try{const result=await request<T>(session,path,'POST',body);sound(audio,460);await refresh();return result;}
  catch(e){setNotice(e instanceof Error?e.message:String(e));sound(audio,160);return null;}
  finally{setBusy(false);}
 }
 const toggle=(id:string)=>setSelected(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 async function findClue(id:string){
  if(isFirst){
   const result=await act<{found:string[]}>('/discover/'+id,{});
   if(result){onFound(result.found);setFocus(id);setNotice('Нова улика е добавена в досието.');}
  }else{
   const result=await act<{story:{found:string[]}}>('/living/case/action',{caseId:'case-002',action:'discover',id});
   if(result){setFocus(id);setNotice('Доказателството е записано в архивното досие.');}
  }
 }
 async function solve(id:string){
  const result=await act<{message:string}>('/release10/action',{kind:'puzzle',id,answer:puzzleAnswers[id]||''});
  if(result)setNotice(result.message);
 }
 async function interrogate(){
  if(!interviewText.trim())return;
  if(isFirst){
   const result=await act<{reply:string;found:string[]}>('/interview',{personId:suspect,message:interviewText,scriptedOnly:true,interviewStyle:'neutral'});
   if(result){setInterviewReply(result.reply);onFound(result.found);setInterviewText('');}
  }else{
   const result=await act<{message:string}>('/living/case/action',{caseId:'case-002',action:'interview',id:suspect});
   if(result)setInterviewReply(result.message);
  }
 }
 async function connectClues(){
  if(!linkA||!linkB||linkA===linkB)return;
  const result=await act<{deduction:{id:string;title:string}}>('/deductions',{firstId:linkA,secondId:linkB});
  if(result){setNotice('Потвърдена логическа връзка: '+result.deduction.title);
   setKnownLinks(await request<{id:string;title:string}[]>(session,'/deductions'));
  }
 }
 async function examinePhone(id:string){
  const result=await act<{message:string}>('/cinematic/action',{kind:'phone',id});
  if(result){setPhoneId(id);setNotice(result.message);setPhone(await request<Digital>(session,'/cinematic'));}
 }
 async function accuse(){
  if(selected.length<3)return;
  if(isFirst){
   const result=await act<{status:string;title:string;explanation:string}>('/accusation',{suspectId:suspect,motive,timeline:sequence,evidenceIds:selected});
   if(result){setNotice(result.title+': '+result.explanation);await refresh();}
  }else{
   const result=await act<{message:string}>('/release10/action',{kind:'accuse002',suspectId:suspect,evidenceIds:selected});
   if(result)setNotice(result.message);
  }
 }
 const suspects=isFirst?[{id:'martin',name:'Мартин Русев'},{id:'elena',name:'Елена Вълчева'},{id:'petar',name:'Петър Добрев'}]:[{id:'raya',name:'Рая Милева'},{id:'boris',name:'Борис Генов'},{id:'teodor',name:'Теодор Колев'}];
 const solved=isFirst?data?.case1.ending==='resolved':data?.case2.verdict==='solved';
 const verdict=isFirst?data?.case1.ending:data?.case2.ending;
 const availableClues=isFirst?evidenceCatalog.filter(x=>found.includes(x.id)):data?.case2.scenes.filter(x=>x.found).map(x=>({id:x.clueId!,title:x.clueTitle!,detail:x.detail||'',type:'Архив'}))||[];
 return <div className={'r10-play '+(intro?'r10-intro-active':'')}>
  <header className="r10-playbar"><button className="r10-logotype" type="button" onClick={onHome}><ArrowLeft size={16}/> CASE<span>FILES</span></button><div><span>АКТИВНО ДОСИЕ</span><strong>{caseNames[caseId]}</strong></div><div className="r10-header-right"><span>{clueIds.length} УЛИКИ</span><button type="button" onClick={()=>setAudio(x=>!x)} aria-label={audio?'Изключи звука':'Включи звука'}>{audio?<Volume2 size={19}/>:<VolumeX size={19}/>}</button><button type="button" onClick={()=>setMobileNav(v=>!v)} aria-label="Игрова навигация" className="r10-mobile-toggle"><Menu size={20}/></button></div></header>
  <div className="r10-progress"><div style={{width:(isFirst?Math.min(100,Math.round(found.length/12*100)):Math.min(100,Math.round(((data?.case2.quality||0)/9)*100)))+'%'}}/></div>
  <nav className={'r10-navigation '+(mobileNav?'open':'')} aria-label="Игрови раздели">{stages.map(([id,name,Icon])=><button key={id} type="button" className={stage===id?'active':''} onClick={()=>{setStage(id);setNotice('');setMobileNav(false);sound(audio);}}><Icon size={17}/>{name}</button>)}<button className="r10-advanced" type="button" onClick={()=>onLegacy('game09')}><Settings2 size={16}/> Допълнителни инструменти</button></nav>
  {notice&&<div className="r10-message" role="status"><Sparkles size={17}/><span>{notice}</span><button aria-label="Затвори известието" type="button" onClick={()=>setNotice('')}><X size={15}/></button></div>}
  {closeup&&<Closeup12 item={closeup} close={()=>setCloseup('')} onAction={()=>setStage(isFirst?'phone':'puzzles')}/>}
  {intro&&<div className="r10-cutscene" role="dialog" aria-label="Начало на случая"><div className="r10-cutscene-art" style={{backgroundImage:'url('+meta.image+')'}}/><div className="r10-cutscene-content"><span>CASEFILES 1.0 · ACT I</span><h2>{caseNames[caseId]}</h2><p>{meta.line}</p><blockquote>{caseId==='case-001'?'„Истината не е в последните думи, а в онова, което никой не е казал.“':'„Някой е отворил фонда. Друг е изтрил следите. Истината чака в архива.“'}</blockquote><button type="button" className="r10-gold" onClick={()=>{setIntro(false);sound(audio,530);}}><SkipForward size={17}/> Влез в разследването</button></div></div>}
  <section className="r10-body">
   <div className="r10-stage-meta"><span>{meta.location}</span><span>CASEFILES / {stage.toUpperCase()}</span></div>
   <Objective13 session={session} caseId={caseId} found={isFirst?found:data?.case2.found||[]} onNavigate={next=>setStage(next as Stage)}/>
   {stage==='scene'&&<div className="r10-scenes"><div className="r10-stage-title"><div><span>АКТ I / ОГЛЕД НА МЯСТОТО</span><h1>{isFirst?'Апартамент 407':activeScene?.title||'Градският архив'}</h1><p>Огледай сцената. Използвай отбелязаните места, за да откриеш следи.</p></div><span className="r10-counter">{clueIds.length} НАМЕРЕНИ</span></div>
    <div className="r10-room-select">{isFirst?scene1.map(r=><button className={activeScene?.id===r.id?'active':''} type="button" onClick={()=>{setScene(r.id);setFocus('');}} key={r.id}>{r.title}</button>):data?.case2.scenes.map(r=><button className={activeScene?.id===r.id?'active':''} type="button" disabled={!r.available} onClick={()=>{setScene(r.id);setFocus('');}} key={r.id}>{r.title}{!r.available?' 🔒':''}</button>)}</div>
    <div className={'r10-scene-art '+(isFirst?'apartment':'archive')} style={{backgroundImage:'url('+roomAsset(activeScene?.id||'living')+')'}}>
     <div className="r10-scene-shade"/><span className="r10-scene-clock">{isFirst?'02:37':'23:47'} / NIGHT SHIFT</span>
     {isFirst?(scene1.find(x=>x.id===activeScene?.id)?.clues||[]).map((id,i)=><button type="button" key={id} className={'r10-hotspot '+(found.includes(id)?'collected':'')} onClick={()=>{setFocus(id);sound(audio,510);}} style={{left:(visualForClue(id,activeScene?.id||'living')?.x??(24+i*42))+'%',top:(visualForClue(id,activeScene?.id||'living')?.y??(46+i*22))+'%'}} aria-label={'Изследвай '+id}><ObjectArt asset={visualForClue(id,activeScene?.id||'living')?.asset||'evidence'} alt={evidenceCatalog.find(x=>x.id===id)?.title||id}/>{found.includes(id)?<Check size={18}/>:<Search size={18}/>}<span>{evidenceCatalog.find(x=>x.id===id)?.title}</span></button>):<button type="button" className={'r10-hotspot '+(archiveScene?.found?'collected':'')} style={{left:(visualForClue(archiveScene?.clueId||'',archiveScene?.id||'reading')?.x??52)+'%',top:(visualForClue(archiveScene?.clueId||'',archiveScene?.id||'reading')?.y??58)+'%'}} onClick={()=>setFocus(archiveScene?.clueId||'')} aria-label={'Изследвай '+activeScene?.title}><ObjectArt asset={visualForClue(archiveScene?.clueId||'',archiveScene?.id||'reading')?.asset||'evidence'} alt={archiveScene?.clueTitle||'Архивна улика'}/>{archiveScene?.found?<Check size={20}/>:<Search size={20}/>}<span>{archiveScene?.clueTitle}</span></button>}
     <div className="r10-scene-caption"><MapPin size={15}/>{activeScene?.title}</div>
    </div>
    <div className="r10-scene-info"><div><h3>{activeScene?.title}</h3><p>{activeScene?.subtitle}</p><small>{focus?(isFirst?evidenceCatalog.find(x=>x.id===focus)?.detail:data?.case2.scenes.find(x=>x.clueId===focus)?.detail||'Материалът ще бъде разкрит след изследване.'):'Избери активния маркер в сцената.'}</small></div><div className="r10-scene-actions">{focus&&<button className="d12-inspect-trigger" type="button" onClick={()=>setCloseup(isFirst?(focus==='E03'?'phone':focus==='E04'?'documents':focus==='E08'?'key':focus==='E02'?'negative':'film'):'archive')}><Search size={16}/> Детайлен оглед</button>}{focus&&<button className="r10-gold" type="button" disabled={busy||clueIds.includes(focus)} onClick={()=>void findClue(focus)}><FileCheck2 size={17}/>{clueIds.includes(focus)?'Открито':'Събери улика'}</button>}{isFirst&&<button className="r10-outline" onClick={()=>onLegacy('game09')}><KeyRound size={16}/> Интерактивен инвентар</button>}</div></div>
    <DirectorStage12 session={session} caseId={caseId} found={isFirst?found:data?.case2.found||[]} room={activeScene?.id||'living'} onRoom={where=>{setScene(where);setFocus('');setStage('scene');}}/>
    <SceneExtras11 session={session} caseId={caseId} sceneId={activeScene?.id||'living'} found={found} onNavigate={dest=>{if(dest.startsWith('room:')){setScene(dest.slice(5));setFocus('');}else setStage(dest as Stage);}}/>
    {beats.length>0&&<div className="r10-storybeat"><span>СЮЖЕТНИ МОМЕНТИ</span>{beats.slice(-2).map(beat=><article key={beat.id}><strong>{beat.title}</strong><p>{beat.line}</p></article>)}</div>}
   </div>}
   {stage==='evidence'&&<div className="r10-dossier"><div className="r10-stage-title"><div><span>ПОТВЪРДЕНИ ДОКАЗАТЕЛСТВА</span><h1>Следствено досие</h1><p>Записват се само действително откритите материали. Използвай ги в разпити и заключения.</p></div></div><div className="r10-grid">{availableClues.map(c=><article key={c.id} className="r10-paper"><span>{c.type} / {c.id}</span><h3>{c.title}</h3><p>{c.detail}</p><button type="button" onClick={()=>{setStage('ending');toggle(c.id);}}><CheckCircle2 size={16}/> Използвай при обвинение</button></article>)}{availableClues.length===0&&<div className="r10-empty"><Search size={26}/>Първо изследвай местопрестъплението.</div>}</div>{isFirst&&availableClues.length>=2&&<Board11 session={session} found={found}/>}{isFirst&&availableClues.length>=2&&<div className="r10-link-desk">
    <div><span>ЛОГИЧЕСКИ ВРЪЗКИ / ДЪСКА</span><h3>Свържи две доказателства</h3><p>Само обоснованите комбинации се приемат от сървъра. Това е част от успешния финал.</p></div>
    <div className="r10-link-pickers"><select aria-label="Първо доказателство" value={linkA} onChange={e=>setLinkA(e.target.value)}><option value="">Първа улика...</option>{availableClues.map(c=><option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select>
    <select aria-label="Второ доказателство" value={linkB} onChange={e=>setLinkB(e.target.value)}><option value="">Втора улика...</option>{availableClues.map(c=><option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select>
    <button className="r10-gold" disabled={!linkA||!linkB||linkA===linkB||busy} type="button" onClick={()=>void connectClues()}><Sparkles size={16}/> Провери връзката</button></div>
    <div className="r10-known-links">{knownLinks.map(c=><span key={c.id}><CheckCircle2 size={14}/>{c.id} / {c.title}</span>)}</div>
   </div>}
  {isFirst&&<div className="r10-hintline"><button onClick={()=>onLegacy('board')} type="button"><ClipboardList size={16}/> Дъска с доказателствени връзки</button><button onClick={()=>onLegacy('lab')} type="button"><Microscope size={16}/> CCTV и документи</button></div>}</div>}
   {stage==='puzzles'&&<div className="r10-dossier"><div className="r10-stage-title"><div><span>ЛАБОРАТОРИЯ / АНАЛИЗИ</span><h1>{isFirst?'Криминалистика 407':'Пъзелите на архива'}</h1><p>Решенията отключват пътя към финала и се потвърждават от сървъра.</p></div></div>{isFirst?<><Timeline11 session={session} found={found} caseId={caseId}/><ForensicWorkbench session={session} onFound={ids=>{onFound(ids);void refresh();}}/><div className="r10-lab-shortcuts"><article><Microscope size={33}/><h3>Анализ на следи</h3><p>Включва сглобяване на документи, UV, отпечатъци, CCTV и реконструкция.</p><button type="button" className="r10-gold" onClick={()=>onLegacy('game09')}>Отвори игровата лаборатория <ArrowRight size={15}/></button></article><article><FileCheck2 size={33}/><h3>Криминалистични доклади</h3><p>Изследвай видеокадрите и документите, за да отключиш скритите E06, E07, E09 и E10.</p><button type="button" className="r10-outline" onClick={()=>onLegacy('lab')}>Отвори лабораторията</button></article></div></>:<div className="r10-grid">{data?.case2.puzzles.map(p=><article className={'r10-puzzle '+(p.solved?'done':'')} key={p.id}><span>{p.type.toUpperCase()} · {p.requires.join(' + ')}</span><h3>{p.name}</h3><p>{p.question}</p><div className="r10-puzzle-control">{p.type==='compare'?<select aria-label={'Отговор за '+p.name} disabled={!p.available||p.solved} value={puzzleAnswers[p.id]||''} onChange={e=>setPuzzleAnswers(v=>({...v,[p.id]:e.target.value}))}><option value="">Избери...</option><option value="raya">Рая Милева</option><option value="boris">Борис Генов</option><option value="teodor">Теодор Колев</option></select>:<input aria-label={'Отговор за '+p.name} disabled={!p.available||p.solved} placeholder={p.type==='timeline'?'HHMM-HHMM':'4 цифри'} maxLength={15} value={puzzleAnswers[p.id]||''} onChange={e=>setPuzzleAnswers(v=>({...v,[p.id]:e.target.value}))}/>}<button className="r10-gold" disabled={busy||!p.available||p.solved||!puzzleAnswers[p.id]} type="button" onClick={()=>void solve(p.id)}>{p.solved?'Разрешено':'Провери'}</button></div><small>{p.solved?'✓ Потвърден анализ':p.available?'Откритите документи са достатъчни.':'Първо открий '+p.requires.join(', ')}</small></article>)}</div>}</div>}
   {stage==='interview'&&<div className="r10-dossier"><div className="r10-stage-title"><div><span>РАЗПИТ / СВИДЕТЕЛСКИ ПОКАЗАНИЯ</span><h1>Очите не лъжат. Думите понякога.</h1><p>Избери човек и постави въпрос. Разпитите работят без AI заявки.</p></div></div><div className="r10-suspects">{suspects.map(s=><button key={s.id} type="button" className={suspect===s.id?'active':''} onClick={()=>{setSuspect(s.id);setInterviewReply('');}}><DirectorPortrait id={s.id} compact mood={suspect===s.id&&interviewReply?"nervous":"neutral"}/><strong>{s.name}</strong><span>{suspect===s.id?'ПОД РАЗПИТ':'ЗАПОДОЗРЯН'}</span></button>)}</div><div className="r10-interview-form"><h3>{suspects.find(s=>s.id===suspect)?.name}</h3><p>{interviewReply||'Изберете как да подходите към разговора. Не всяко признание означава вина.'}</p>{isFirst?<textarea value={interviewText} onChange={e=>setInterviewText(e.target.value)} placeholder="Въведи въпрос към заподозрения..." rows={3} aria-label="Въпрос към заподозрения"/>:<p>След две открити улики можеш да поискаш подробното алиби на този човек.</p>}<button className="r10-gold" type="button" disabled={busy||(isFirst?!interviewText.trim():(data?.case2.found.length||0)<2)} onClick={()=>void interrogate()}><MessageCircle size={16}/> Задай въпрос</button>{isFirst&&<button className="r10-outline" type="button" onClick={()=>onLegacy('interview')}>Подробни разпити и предявяване на доказателства</button>}</div></div>}
   {stage==='interview'&&<Dialog11 session={session} caseId={caseId} found={found} personId={suspect}/>}
   {stage==='phone'&&<div className="r10-dossier"><div className="r10-stage-title"><div><span>ЦИФРОВИ ДОКАЗАТЕЛСТВА</span><h1>{isFirst?'Телефонът на Никола':'Архивни съобщения'}</h1><p>Истинските следи се разкриват постепенно — непровереното съдържание остава заключено.</p></div></div>{isFirst?<div className="r10-phone-layout"><div className="r10-phone-frame"><div className="r10-phone-notch"/><strong>01:17 / УСТРОЙСТВО 001</strong>{phone?.phone.map(r=><button key={r.id} disabled={!r.available} onClick={()=>void examinePhone(r.id)} className={phoneId===r.id?'active':''}><span>{r.available?<Phone size={16}/>:<Lock size={16}/>}</span><div><strong>{r.title}</strong><small>{r.available?r.preview:'Заключено'}</small></div></button>)}</div><div className="r10-phone-reader"><span>ДОСИЕ / ТЕЛЕФОН</span><h3>{phone?.phone.find(x=>x.id===phoneId)?.title||'Избери съобщение'}</h3><p>{phone?.phone.find(x=>x.id===phoneId)?.detail||'Тук ще се появи провереното съдържание от телефона.'}</p><button className="r10-outline" onClick={()=>onLegacy('cinematic')} type="button">Разширен цифров анализ</button></div></div>:<div className="r10-lab-shortcuts"><article><Phone size={35}/><h3>Нощният регистър</h3><p>Контролерът е рестартиран в 23:47. Съпостави електронното събитие с камерата и журналите.</p><button className="r10-outline" onClick={()=>setStage('puzzles')}>Провери времевата линия</button></article><article><BookOpen size={35}/><h3>Вътрешна кореспонденция</h3><p>Документите в ателието разкриват кой е поискал оценката на договора.</p><button className="r10-outline" onClick={()=>{setScene('studio');setStage('scene');}}>Отиди в ателието</button></article></div>}</div>}
   {stage==='phone'&&<Tape11 session={session} caseId={caseId} found={caseId==='case-001'?found:data?.case2.found||[]}/>}
   {stage==='detective'&&<Detective13 session={session} caseId={caseId} found={isFirst?found:data?.case2.found||[]} clues={availableClues} onNavigate={next=>setStage(next as Stage)}/>}
   {stage==='desk'&&<InvestigationDesk14 session={session} caseId={caseId} found={isFirst?found:data?.case2.found||[]} onStage={next=>setStage(next as Stage)} onLegacy={onLegacy}/>}
   {stage==='ending'&&<div className="r10-dossier"><div className="r10-stage-title"><div><span>ПОСЛЕДНА ГЛАВА / СЪДЕБНО ЗАКЛЮЧЕНИЕ</span><h1>{solved?'Разследването е приключено':'Последното решение'}</h1><p>Избери доказателства и посочи обосновано заключение. Грешките имат последствия.</p></div></div>{solved?<div className="r10-final"><CheckCircle2 size={45}/><span>CASE CLOSED / {verdict?.toUpperCase()}</span><h2>{isFirst?'Истината за апартамент 407':'Изчезналият архив — финал'}</h2><p>{isFirst?report?.conclusion||'Установена е доказателствена връзка.':data?.case2.epilogue||'Уликите подкрепят финалното обвинение.'}</p><p>Финален резултат: {isFirst?report?.ending||verdict:verdict}. Различните решения могат да оставят следи в доверието към разследването.</p><button className="r10-gold" type="button" onClick={onHome}><Award size={16}/> Към главното меню</button></div>:<div className="r10-accuse"><div className="r10-accuse-main"><label>Заподозрян<select aria-label="Обвинен заподозрян" value={suspect} onChange={e=>setSuspect(e.target.value)}>{suspects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>{isFirst&&<><label>Мотив<textarea rows={3} value={motive} onChange={e=>setMotive(e.target.value)}/></label><label>Хронология<textarea rows={3} value={sequence} onChange={e=>setSequence(e.target.value)}/></label></>}<button className="r10-gold" disabled={busy||selected.length<3||(!isFirst&&!data?.case2.canAccuse)} onClick={()=>void accuse()} type="button"><FileCheck2 size={16}/> Подай окончателно обвинение</button>{isFirst&&<p>За успешен финал е необходимо да направиш и доказателствени връзки в разследващата дъска. <button onClick={()=>onLegacy('board')} type="button">Отвори дъската <ArrowRight size={14}/></button></p>}{!isFirst&&!data?.case2.canAccuse&&<p>За финала открий минимум четири улики и реши две архивни загадки.</p>}</div><div className="r10-select-evidence"><h3>Избери доказателствата ({selected.length})</h3>{availableClues.map(c=><label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggle(c.id)}/><span>{c.id} — {c.title}</span></label>)}</div></div>}</div>}
   <footer className="r10-in-game-footer"><span>CASEFILES · VERSION 1.3</span><span>РЪЧНИТЕ РЕШЕНИЯ ПРОМЕНЯТ ХОДА НА РАЗСЛЕДВАНЕТО</span></footer>
  </section>
 </div>;
}
