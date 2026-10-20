import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,BookOpen,BrainCircuit,CheckCircle2,ChevronRight,Clock3,Compass,Eye,FileCheck2,Files,HelpCircle,LockKeyhole,RotateCcw,Scale,ScanSearch,ShieldAlert,Sparkles,Target,X} from 'lucide-react';
import './detective13.css';
type CaseId='case-001'|'case-002';
type Category='reason'|'challenge'|'compare'|'theory';
type CaseClue={id:string;title:string;detail:string;type:string};
type Challenge={id:string;title:string;kind:Category;chapter:number;person:string|null;available:boolean;completed:boolean;attempts:number;prompt:string|null;options:{id:string;label:string}[];missing:string[];explanation:string|null};
type Snapshot={caseId:CaseId;chapter:number;chapters:{number:number;title:string;active:boolean}[];objective:{id:string;text:string;target:string};tasks:{id:string;text:string;done:boolean;target:string}[];challenges:Challenge[];progress:{solved:number;total:number;wrongAttempts:number;found:number;reviewUnlocked:boolean};review:{title:string;solved:number;missed:{id:string;title:string;requires:string[]}[];mistakes:number;ending:string;branchDecisions:string[];recommendations:string}|null;replay:{available:boolean;enabled:boolean}};
const typeLabels:Record<Category,string>={reason:'ДЕТЕКТИВСКА ЛОГИКА',challenge:'ОСПОРИ ПОКАЗАНИЕ',compare:'СЪПОСТАВИ УЛИКИ',theory:'ПОСТРОЙ ТЕОРИЯ'};
const imageIds:Record<string,string>={E01:'evidence',E02:'evidence',E03:'phone',E04:'papers',E05:'terminal',E06:'cctv',E07:'cctv',E08:'safe',E09:'documents',E10:'terminal',E11:'evidence',E12:'evidence',C1:'contract',C2:'terminal',C3:'logbook',C4:'cctv',C5:'cart',C6:'contract'};
async function api<T>(session:string,caseId:CaseId,payload?:{id:string;answer:string}):Promise<T>{
 const r=await fetch((import.meta.env.VITE_API_URL||'')+'/api/detective13/'+caseId+(payload?'/action':''),{method:payload?'POST':'GET',headers:{'Content-Type':'application/json','x-case-session':session},...(payload?{body:JSON.stringify(payload)}:{})});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||data.message||'Нещо се обърка при проверката.');
 return data as T;
}
export function Objective13({session,caseId,found,onNavigate}:{session:string;caseId:CaseId;found:string[];onNavigate:(stage:string)=>void}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[open,setOpen]=useState(false);
 useEffect(()=>{if(session)void api<Snapshot>(session,caseId).then(setSnapshot).catch(()=>{});},[session,caseId,found.join(',')]);
 if(!snapshot)return null;
 return <div className="d13-objective"><div className="d13-objective-head"><span><Target size={17}/> ТЕКУЩА СЛЕДСТВЕНА ЦЕЛ</span><span>ГЛАВА {snapshot.chapter}/5</span></div><div className="d13-objective-row"><strong>{snapshot.objective.text}</strong><button type="button" onClick={()=>onNavigate(snapshot.objective.target)}>{snapshot.objective.target==='scene'?'Огледай':'Продължи'} <ArrowRight size={15}/></button><button type="button" className="d13-compact" aria-expanded={open} aria-label="Покажи всички цели" onClick={()=>setOpen(v=>!v)}><ChevronRight size={17}/></button></div>{open&&<div className="d13-tutorial"><strong>Следствено обучение — учиш чрез действия</strong>{snapshot.tasks.map((task,i)=><button key={task.id} type="button" onClick={()=>onNavigate(task.target)}><span>{task.done?<CheckCircle2 size={17}/>:<span>{i+1}</span>}</span><span>{task.text}</span><ArrowRight size={13}/></button>)}</div>}</div>;
}
export function Detective13({session,caseId,found,clues,onNavigate}:{session:string;caseId:CaseId;found:string[];clues:CaseClue[];onNavigate:(stage:string)=>void}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[selectedId,setSelectedId]=useState(''),[choice,setChoice]=useState(''),[category,setCategory]=useState<Category|'all'>('all');
 const [compareA,setCompareA]=useState(''),[compareB,setCompareB]=useState(''),[expanded,setExpanded]=useState(false);
 const [feedback,setFeedback]=useState(''),[correct,setCorrect]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setSnapshot(null);setSelectedId('');setChoice('');setCompareA('');setCompareB('');setCategory('all');setFeedback('');void api<Snapshot>(session,caseId).then(setSnapshot).catch(e=>setError(e instanceof Error?e.message:String(e)));},[session,caseId]);
 useEffect(()=>{if(session)void api<Snapshot>(session,caseId).then(setSnapshot).catch(()=>{});},[session,caseId,found.join(',')]);
 const challenges=snapshot?.challenges||[];
 const visible=challenges.filter(c=>category==='all'||c.kind===category);
 const current=challenges.find(c=>c.id===selectedId)||null;
 const choose=(c:Challenge)=>{setSelectedId(c.id);setChoice('');setFeedback('');setCorrect(false);};
 const checked=useMemo(()=>[compareA,compareB].filter(Boolean).map(id=>clues.find(c=>c.id===id)).filter((c):c is CaseClue=>!!c),[compareA,compareB,clues]);
 const send=async()=>{
  if(!current||!choice||busy)return;setBusy(true);setFeedback('');setError('');
  try{
   const r=await api<{message:string;progress:Snapshot}>(session,caseId,{id:current.id,answer:choice});
   setSnapshot(r.progress);setFeedback(r.message);setCorrect(true);
  }catch(e){const message=e instanceof Error?e.message:String(e);setFeedback(message);setCorrect(false);
   // A wrong decision is saved by the server; read updated attempt totals.
   try{setSnapshot(await api<Snapshot>(session,caseId));}catch{}
  }finally{setBusy(false);}
 };
 return <section className="d13-root">
  <header className="d13-heading"><div><span><BrainCircuit size={15}/> CASEFILES 1.3 / DETECTIVE'S INSTINCT</span><h1>Мисли като детектив.</h1><p>Съпостави факти, предяви доказателства, изгради теория. Играта няма да направи заключението вместо теб.</p></div><div className="d13-score"><strong>{snapshot?.progress.solved||0}<small>/{snapshot?.progress.total||5}</small></strong><span>ПОТВЪРДЕНИ ИЗВОДИ</span></div></header>
  {error&&<p role="alert" className="d13-feedback">{error}</p>}
  <div className="d13-chapters">{snapshot?.chapters.map(x=><div key={x.number} className={x.active?'active':''}><span>АКТ {x.number}</span><strong>{x.title}</strong></div>)}</div>
  <div className="d13-tabs" role="group" aria-label="Филтър на разследването">{([{id:'all',title:'Всички'},{id:'reason',title:'Логика'},{id:'compare',title:'Сравнение'},{id:'challenge',title:'Разпити'},{id:'theory',title:'Теории'}] as const).map(x=><button key={x.id} type="button" aria-pressed={category===x.id} className={category===x.id?'active':''} onClick={()=>setCategory(x.id)}>{x.title}</button>)}</div>
  <div className="d13-body"><nav aria-label="Предизвикателства" className="d13-questions">{visible.map(c=><button type="button" key={c.id} className={selectedId===c.id?'active':''} onClick={()=>choose(c)} disabled={!c.available}><span>{c.completed?<CheckCircle2 size={17}/>:c.available?<ScanSearch size={17}/>:<LockKeyhole size={17}/>} {typeLabels[c.kind]}</span><strong>{c.title}</strong><small>{c.completed?'РАЗРЕШЕНО':c.available?'ПРОВЕРИ ДОКАЗАТЕЛСТВАТА':'Нужни са още улики · '+c.missing.join(', ')}</small></button>)}</nav>
  <div className="d13-investigate">{current?.available?<><span className="d13-quest-type">{typeLabels[current.kind]} / АКТ {current.chapter}</span><h2>{current.title}</h2><p>{current.prompt}</p>
   {current.kind==='compare'&&<div className="d13-comparison"><strong><Files size={16}/> СЪПОСТАВИ ДВА ДОКУМЕНТА</strong><div>{[compareA,compareB].map((value,i)=><label key={i}>УЛИКА {i+1}<select aria-label={'Улика '+(i+1)} value={value} onChange={e=>(i===0?setCompareA:setCompareB)(e.target.value)}><option value="">Избери намерена улика...</option>{clues.map(c=><option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select></label>)}</div><div className="d13-evidence-pair">{checked.map(c=><article key={c.id}><img src={'/art/objects/'+(imageIds[c.id]==='documents'?'papers':imageIds[c.id]||'evidence')+'.svg'} alt={'Илюстрация на '+c.title}/><strong>{c.title}</strong><p>{c.detail}</p></article>)}</div></div>}
   <div className="d13-answers" role="group" aria-label="Възможни заключения">{current.options.map((option,i)=><button type="button" key={option.id} aria-pressed={choice===option.id} className={choice===option.id?'selected':''} disabled={current.completed} onClick={()=>setChoice(option.id)}><span>{String.fromCharCode(65+i)}</span>{option.label}</button>)}</div>
   {current.completed&&<div className="d13-feedback success"><CheckCircle2 size={18}/>{current.explanation}</div>}
   {!current.completed&&<button type="button" className="d13-verify" disabled={!choice||busy} onClick={()=>void send()}><Scale size={18}/> {busy?'Проверявам...':'Провери заключението'}</button>}
   {feedback&&<div className={'d13-feedback '+(correct?'success':'warning')} role="status">{correct?<CheckCircle2 size={18}/>:<ShieldAlert size={18}/>} {feedback}</div>}
   {current.attempts>0&&<small>Опити за преразглеждане: {current.attempts}. Неправилните теории не прекъсват разследването.</small>}
  </>:<div className="d13-empty"><Eye size={37}/><h2>Избери следствен въпрос</h2><p>Намерете уликите в основните помещения. Заключенията се отключват, когато има реална доказателствена основа.</p><button type="button" onClick={()=>onNavigate('scene')}>Към местопрестъплението <ArrowRight size={16}/></button></div>}</div></div>
  <div className="d13-after"><section><h3><Target size={18}/> Следващи цели</h3>{snapshot?.tasks.map((task,i)=><button key={task.id} type="button" onClick={()=>onNavigate(task.target)}><span>{task.done?<CheckCircle2 size={16}/>:<Clock3 size={16}/>}</span><strong>{task.text}</strong><ChevronRight size={16}/></button>)}</section>
  <section><h3><BookOpen size={18}/> Детективски дневник</h3><p>Потвърдени изводи: {snapshot?.progress.solved||0}. Преразгледани предположения: {snapshot?.progress.wrongAttempts||0}.</p><button type="button" onClick={()=>setExpanded(v=>!v)}><Compass size={16}/> {expanded?'Скрий съвета':'Как да различавам факт от теория?'}</button>{expanded&&<p>Факт е това, което е записано в проверена улика. Теорията е обяснение, подкрепено от няколко независими факта. Дори правилният заподозрян не оправдава прибързан извод.</p>}</section></div>
  {snapshot?.review?<section className="d13-review"><span><FileCheck2 size={18}/> CASE REVIEW · ОТКЛЮЧЕН</span><h2>Преглед на разследването</h2><p>Потвърдени заключения: {snapshot.review.solved}/{snapshot.progress.total}. Неправилни опити: {snapshot.review.mistakes}.</p><div>{snapshot.review.missed.map(q=><article key={q.id}><strong>Пропуснато: {q.title}</strong><small>{q.requires.length?'Неоткрити улики: '+q.requires.join(', '):'Разгледай задачата отново.'}</small></article>)}</div><p>{snapshot.review.recommendations}</p>{snapshot.review.branchDecisions.length>0&&<p>Сюжетни решения: {snapshot.review.branchDecisions.join(' · ')}</p>}<button type="button" onClick={()=>onNavigate('ending')}><RotateCcw size={16}/> Прегледай развръзката</button></section>:<div className="d13-review-locked"><LockKeyhole size={18}/> Подробният Case Review се отключва след успешния финал на случая.</div>}
 </section>;
}
