import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,BookOpen,BrainCircuit,CheckCircle2,ChevronRight,Clock3,Compass,Eye,FileCheck2,Files,LockKeyhole,RotateCcw,Scale,ScanSearch,ShieldAlert,Sparkles,Target} from 'lucide-react';
import './detective13.css';
import {useLanguage} from './i18n';
type CaseId='case-001'|'case-002';
type Category='reason'|'challenge'|'compare'|'theory';
type CaseClue={id:string;title:string;detail:string;type:string};
type Challenge={id:string;title:string;kind:Category;chapter:number;person:string|null;available:boolean;completed:boolean;attempts:number;prompt:string|null;options:{id:string;label:string}[];missing:string[];explanation:string|null};
type Snapshot={caseId:CaseId;chapter:number;chapters:{number:number;title:string;active:boolean}[];objective:{id:string;text:string;target:string};tasks:{id:string;text:string;done:boolean;target:string}[];challenges:Challenge[];progress:{solved:number;total:number;wrongAttempts:number;found:number;reviewUnlocked:boolean};review:{title:string;solved:number;missed:{id:string;title:string;requires:string[]}[];mistakes:number;ending:string;branchDecisions:string[];recommendations:string}|null;replay:{available:boolean;enabled:boolean}};
const typeLabels:Record<Category,string>={reason:'ДЕТЕКТИВСКА ЛОГИКА',challenge:'ОСПОРИ ПОКАЗАНИЕ',compare:'СЪПОСТАВИ УЛИКИ',theory:'ПОСТРОЙ ТЕОРИЯ'};
const imageIds:Record<string,string>={E01:'evidence',E02:'evidence',E03:'phone',E04:'papers',E05:'terminal',E06:'cctv',E07:'cctv',E08:'safe',E09:'documents',E10:'terminal',E11:'evidence',E12:'evidence',C1:'contract',C2:'terminal',C3:'logbook',C4:'cctv',C5:'cart',C6:'contract'};
async function api<T>(session:string,caseId:CaseId,payload?:{id:string;answer:string;evidenceIds?:string[]}):Promise<T>{
 const r=await fetch((import.meta.env.VITE_API_URL||'')+'/api/detective13/'+caseId+(payload?'/action':''),{method:payload?'POST':'GET',headers:{'Content-Type':'application/json','x-case-session':session},...(payload?{body:JSON.stringify(payload)}:{})});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||data.message||'Нещо се обърка при проверката.');
 return data as T;
}
export function Objective13({session,caseId,found,onNavigate}:{session:string;caseId:CaseId;found:string[];onNavigate:(stage:string)=>void}){
 const {t}=useLanguage();
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[open,setOpen]=useState(false);
 useEffect(()=>{if(session)void api<Snapshot>(session,caseId).then(setSnapshot).catch(()=>{});},[session,caseId,found.join(',')]);
 if(!snapshot)return null;
 return <div className="d13-objective"><div className="d13-objective-head"><span><Target size={17}/> {t('ТЕКУЩА СЛЕДСТВЕНА ЦЕЛ')}</span><span>{t('ГЛАВА')} {snapshot.chapter}/5</span></div><div className="d13-objective-row"><strong>{t(snapshot.objective.text)}</strong><button type="button" onClick={()=>onNavigate(snapshot.objective.target)}>{t(snapshot.objective.target==='scene'?'Огледай':'Продължи')} <ArrowRight size={15}/></button><button type="button" className="d13-compact" aria-expanded={open} aria-label={t('Покажи всички цели')} onClick={()=>setOpen(v=>!v)}><ChevronRight size={17}/></button></div>{open&&<div className="d13-tutorial"><strong>{t('Следствено обучение — учиш чрез действия')}</strong>{snapshot.tasks.map((task,i)=><button key={task.id} type="button" onClick={()=>onNavigate(task.target)}><span>{task.done?<CheckCircle2 size={17}/>:<span>{i+1}</span>}</span><span>{t(task.text)}</span><ArrowRight size={13}/></button>)}</div>}</div>;
}
export function Detective13({session,caseId,found,clues,onNavigate}:{session:string;caseId:CaseId;found:string[];clues:CaseClue[];onNavigate:(stage:string)=>void}){
 const {t}=useLanguage();
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
 const activateReplay=async()=>{
  if(!snapshot?.replay.available||snapshot.replay.enabled)return;
  setBusy(true);
  try{
   const response=await fetch((import.meta.env.VITE_API_URL||'')+'/api/game09/action',{method:'POST',headers:{'Content-Type':'application/json','x-case-session':session},body:JSON.stringify({kind:'newGamePlus'})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||'Неуспешно отключване.');
   setSnapshot(await api<Snapshot>(session,caseId));
   setFeedback('New Game+ е отключен: вече можеш да изпробваш допълнителни разследващи предизвикателства.');
   setCorrect(true);
  }catch(e){setFeedback(e instanceof Error?e.message:String(e));setCorrect(false);}
  finally{setBusy(false);}
 };
 const send=async()=>{
  if(!current||!choice||busy)return;setBusy(true);setFeedback('');setError('');
  try{
   const r=await api<{message:string;progress:Snapshot}>(session,caseId,{id:current.id,answer:choice,...(current.kind==='compare'?{evidenceIds:[compareA,compareB]}:{})});
   setSnapshot(r.progress);setFeedback(r.message);setCorrect(true);
  }catch(e){const message=e instanceof Error?e.message:String(e);setFeedback(message);setCorrect(false);
   // A wrong decision is saved by the server; read updated attempt totals.
   try{setSnapshot(await api<Snapshot>(session,caseId));}catch{}
  }finally{setBusy(false);}
 };
 return <section className="d13-root">
  <header className="d13-heading"><div><span><BrainCircuit size={15}/> CASEFILES 1.3 / DETECTIVE'S INSTINCT</span><h1>{t('Мисли като детектив.')}</h1><p>{t('Съпостави факти, предяви доказателства, изгради теория. Играта няма да направи заключението вместо теб.')}</p></div><div className="d13-score"><strong>{snapshot?.progress.solved||0}<small>/{snapshot?.progress.total||5}</small></strong><span>{t('ПОТВЪРДЕНИ ИЗВОДИ')}</span></div></header>
  {error&&<p role="alert" className="d13-feedback">{t(error)}</p>}
  <div className="d13-chapters">{snapshot?.chapters.map(x=><div key={x.number} className={x.active?'active':''}><span>{t('АКТ')} {x.number}</span><strong>{t(x.title)}</strong></div>)}</div>
  <div className="d13-tabs" role="group" aria-label={t('Филтър на разследването')}>{([{id:'all',title:'Всички'},{id:'reason',title:'Логика'},{id:'compare',title:'Сравнение'},{id:'challenge',title:'Разпити'},{id:'theory',title:'Теории'}] as const).map(x=><button key={x.id} type="button" aria-pressed={category===x.id} className={category===x.id?'active':''} onClick={()=>setCategory(x.id)}>{t(x.title)}</button>)}</div>
  <div className="d13-body"><nav aria-label={t('Предизвикателства')} className="d13-questions">{visible.map(c=><button type="button" key={c.id} className={selectedId===c.id?'active':''} onClick={()=>choose(c)} disabled={!c.available}><span>{c.completed?<CheckCircle2 size={17}/>:c.available?<ScanSearch size={17}/>:<LockKeyhole size={17}/>} {t(typeLabels[c.kind])}</span><strong>{t(c.title)}</strong><small>{c.completed?t('РАЗРЕШЕНО'):c.available?t('ПРОВЕРИ ДОКАЗАТЕЛСТВАТА'):t('Нужни са още улики')+' · '+c.missing.join(', ')}</small></button>)}</nav>
  <div className="d13-investigate">{current?.available?<><span className="d13-quest-type">{t(typeLabels[current.kind])} / {t('АКТ')} {current.chapter}</span><h2>{t(current.title)}</h2><p>{t(current.prompt||'')}</p>
   {current.kind==='compare'&&<div className="d13-comparison"><strong><Files size={16}/> {t('СЪПОСТАВИ ДВА ДОКУМЕНТА')}</strong><div>{[compareA,compareB].map((value,i)=><label key={i}>{t('УЛИКА')} {i+1}<select aria-label={t('Улика')+' '+(i+1)} value={value} onChange={e=>(i===0?setCompareA:setCompareB)(e.target.value)}><option value="">{t('Избери намерена улика...')}</option>{clues.map(c=><option key={c.id} value={c.id}>{c.id} — {t(c.title)}</option>)}</select></label>)}</div><div className="d13-evidence-pair">{checked.map(c=><article key={c.id}><img src={'/art/objects/'+(imageIds[c.id]==='documents'?'papers':imageIds[c.id]||'evidence')+'.svg'} alt={t('Илюстрация на')+' '+t(c.title)}/><strong>{t(c.title)}</strong><p>{t(c.detail)}</p></article>)}</div></div>}
   <div className="d13-answers" role="group" aria-label={t('Възможни заключения')}>{current.options.map((option,i)=><button type="button" key={option.id} aria-pressed={choice===option.id} className={choice===option.id?'selected':''} disabled={current.completed} onClick={()=>setChoice(option.id)}><span>{String.fromCharCode(65+i)}</span>{t(option.label)}</button>)}</div>
   {current.completed&&<div className="d13-feedback success"><CheckCircle2 size={18}/>{t(current.explanation||'')}</div>}
   {!current.completed&&<button type="button" className="d13-verify" disabled={!choice||busy||(current.kind==='compare'&&(!compareA||!compareB||compareA===compareB))} onClick={()=>void send()}><Scale size={18}/> {t(busy?'Проверявам...':'Провери заключението')}</button>}
   {feedback&&<div className={'d13-feedback '+(correct?'success':'warning')} role="status">{correct?<CheckCircle2 size={18}/>:<ShieldAlert size={18}/>} {t(feedback)}</div>}
   {current.attempts>0&&<small>{t('Опити за преразглеждане:')} {current.attempts}. {t('Неправилните теории не прекъсват разследването.')}</small>}
  </>:<div className="d13-empty"><Eye size={37}/><h2>{t('Избери следствен въпрос')}</h2><p>{t('Намерете уликите в основните помещения. Заключенията се отключват, когато има реална доказателствена основа.')}</p><button type="button" onClick={()=>onNavigate('scene')}>{t('Към местопрестъплението')} <ArrowRight size={16}/></button></div>}</div></div>
  <div className="d13-after"><section><h3><Target size={18}/> {t('Следващи цели')}</h3>{snapshot?.tasks.map(task=><button key={task.id} type="button" onClick={()=>onNavigate(task.target)}><span>{task.done?<CheckCircle2 size={16}/>:<Clock3 size={16}/>}</span><strong>{t(task.text)}</strong><ChevronRight size={16}/></button>)}</section>
  <section><h3><BookOpen size={18}/> {t('Детективски дневник')}</h3><p>{t('Потвърдени изводи:')} {snapshot?.progress.solved||0}. {t('Преразгледани предположения:')} {snapshot?.progress.wrongAttempts||0}.</p><button type="button" onClick={()=>setExpanded(v=>!v)}><Compass size={16}/> {t(expanded?'Скрий съвета':'Как да различавам факт от теория?')}</button>{expanded&&<p>{t('Факт е това, което е записано в проверена улика. Теорията е обяснение, подкрепено от няколко независими факта. Дори правилният заподозрян не оправдава прибързан извод.')}</p>}</section></div>
  {snapshot?.review?<section className="d13-review"><span><FileCheck2 size={18}/> CASE REVIEW · {t('ОТКЛЮЧЕН')}</span><h2>{t('Преглед на разследването')}</h2><p>{t('Потвърдени заключения:')} {snapshot.review.solved}/{snapshot.progress.total}. {t('Неправилни опити:')} {snapshot.review.mistakes}.</p><div>{snapshot.review.missed.map(q=><article key={q.id}><strong>{t('Пропуснато:')} {t(q.title)}</strong><small>{q.requires.length?t('Неоткрити улики:')+' '+q.requires.join(', '):t('Разгледай задачата отново.')}</small></article>)}</div><p>{t(snapshot.review.recommendations)}</p>{snapshot.review.branchDecisions.length>0&&<p>{t('Сюжетни решения:')} {snapshot.review.branchDecisions.map(t).join(' · ')}</p>}<button type="button" onClick={()=>onNavigate('ending')}><RotateCcw size={16}/> {t('Прегледай развръзката')}</button>
   <button type="button" disabled={snapshot.replay.enabled||busy} onClick={()=>void activateReplay()}><Sparkles size={16}/> {t(snapshot.replay.enabled?'New Game+ е отключен':'Отключи New Game+ предизвикателствата')}</button></section>:<div className="d13-review-locked"><LockKeyhole size={18}/> {t('Подробният Case Review се отключва след успешния финал на случая.')}</div>}
 </section>;
}
