import { useEffect,useState } from 'react';
import { ArrowRight,BookOpen,CheckCircle2,FileCheck2,FolderOpen,Gavel,Newspaper,ShieldAlert,ShieldCheck,Users } from 'lucide-react';
import './desk14.css';

type CaseId='case-001'|'case-002';
type Profile={id:string;name:string;role:string;knownEvidence:string[];ready:boolean;confirmed:boolean;conclusion:string|null;missingCount:number};
type Archive={id:string;title:string;solved:boolean;evidence:number;attempts:number};
type View={
 caseId:CaseId;solved:boolean;evidenceCount:number;reputation:number;profiles:Profile[];
 news:{id:string;title:string;body:string;available:boolean}[];
 editorialAvailable:boolean;edition:{title:string;body:string;style:string;publishedAt:string|null}|null;
 editorialOptions:{id:string;title:string;effect:number}[];
 activity:{id:string;text:string}[];archive:Archive[];replayUnlocked:boolean;
 courtOutcome:{outcome:string;reason:string}|null;ending:unknown;
};

async function deskRequest<T>(session:string,caseId:CaseId,body?:unknown):Promise<T>{
 const response=await fetch((import.meta.env.VITE_API_URL||'')+'/api/desk14/'+caseId+(body?'/action':''),{
  method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-case-session':session},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const json=await response.json();
 if(!response.ok)throw new Error(json.error||'Възникна грешка в редакцията.');
 return json as T;
}

export function InvestigationDesk14({session,caseId,found,onStage,onLegacy}:{
 session:string;caseId:CaseId;found:string[];onStage:(stage:string)=>void;onLegacy:(section:string)=>void;
}){
 const [data,setData]=useState<View|null>(null);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [chosen,setChosen]=useState('facts');
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  setData(null);setFeedback('');setError('');
  if(session)void deskRequest<View>(session,caseId).then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(String(e));});
  return()=>{active=false;};
 },[session,caseId,found.join(',')]);
 async function doAction(body:unknown){
  if(busy)return;
  setBusy(true);setFeedback('');setError('');
  try{
   const result=await deskRequest<{message:string;desk:View}>(session,caseId,body);
   setData(result.desk);setFeedback(result.message);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 return <section className="d14">
  <header className="d14-hero">
   <span>CASEFILES / СЛЕДСТВЕН АНАЛИЗ / ПУБЛИЧЕН ОТЗВУК</span>
   <h1>Профили, преса и архив</h1>
   <p>Публикувай само проверени обстоятелства. Всяко твърдение е обвързано с доказателства, а публичните решения се запазват в досието.</p>
  </header>
  {error&&<p className="d14-error" role="alert">{error}</p>}
  {feedback&&<p className="d14-feedback" role="status">{feedback}</p>}
  {!data?<p className="d14-loading">Зареждане на следственото бюро…</p>:<>
   <div className="d14-stats"><span><BookOpen size={17}/> {data.evidenceCount} улики</span><span><ShieldCheck size={17}/> Репутация {data.reputation}/100</span><span><Gavel size={17}/> {data.solved?'Случаят е разрешен':'Активно разследване'}</span></div>
   <div className="d14-header"><Users size={21}/><h2>Психологически и доказателствени профили</h2></div>
   <p className="d14-intro">Това са игрови аналитични хипотези, не клинични диагнози или предварителни присъди. За проверен профил са нужни две независими следи.</p>
   <div className="d14-grid">{data.profiles.map(p=><article key={p.id} className="d14-card">
    <div className="d14-card-top"><strong>{p.name}</strong>{p.confirmed?<span className="d14-success"><CheckCircle2 size={14}/> Потвърден</span>:<span>{p.role}</span>}</div>
    <p>{p.conclusion||'Нямаш достатъчно доказателства, за да формулираш защитим извод за този човек.'}</p>
    <div className="d14-clues">{p.knownEvidence.map(id=><span key={id}>{id}</span>)}{p.missingCount>0&&<span className="d14-missing">Неоткрити: {p.missingCount}</span>}</div>
    <button type="button" disabled={busy||!p.ready||p.confirmed} onClick={()=>void doAction({kind:'profile',personId:p.id,evidenceId:p.knownEvidence[0]})}><FileCheck2 size={16}/>{p.confirmed?'Проверен профил':p.ready?'Потвърди с уликите':'Събери още доказателства'}</button>
   </article>)}</div>
   <div className="d14-header"><Newspaper size={21}/><h2>Медиен отзвук</h2></div>
   <div className="d14-grid">{data.news.map(n=><article className="d14-card d14-news" key={n.id}><small>ИЗМИСЛЕНА НОВИНАРСКА ПУБЛИКАЦИЯ</small><h3>{n.title}</h3><p>{n.body}</p></article>)}</div>
   <article className="d14-editor">
    <div><span>РЕДАКЦИОНЕН ИЗБОР</span><h3>{data.edition?'Публикуван материал':'Как ще представиш резултата?'}</h3><p>Стилът на съобщението влияе на репутацията. Изборът е окончателен за този случай.</p></div>
    {data.edition?<div className="d14-published"><CheckCircle2 size={22}/><div><h3>{data.edition.title}</h3><p>{data.edition.body}</p><small>{data.edition.publishedAt?new Date(data.edition.publishedAt).toLocaleString('bg-BG'):''}</small></div></div>:<>
     <label htmlFor="d14-editor-style">Редакционна политика</label>
     <select id="d14-editor-style" value={chosen} onChange={e=>setChosen(e.target.value)}>
      {data.editorialOptions.map(x=><option value={x.id} key={x.id}>{x.title} ({x.effect>0?'+':''}{x.effect} репутация)</option>)}
     </select>
     <button type="button" className="d14-publish" disabled={busy||!data.editorialAvailable} onClick={()=>void doAction({kind:'publish',style:chosen})}><Newspaper size={16}/> {data.solved?'Публикувай заключението':'Достъпно след успешно разследване'}</button>
    </>}
   </article>
   {data.activity.length>0&&<><div className="d14-header"><ShieldAlert size={21}/><h2>Нови събития</h2></div><div className="d14-activity">{data.activity.map(a=><p key={a.id}>{a.text}</p>)}</div></>}
   <div className="d14-header"><FolderOpen size={21}/><h2>Архив на разследванията</h2></div>
   <div className="d14-grid">{data.archive.map(a=><article key={a.id} className="d14-card"><strong>{a.title}</strong><p>{a.solved?'Разрешено':'Незавършено'} · {a.evidence} улики · {a.attempts} опита</p><small>{a.id}</small></article>)}</div>
   <div className="d14-actions">
    <button type="button" onClick={()=>onStage('detective')}>Проверка на противоречия <ArrowRight size={15}/></button>
    <button type="button" onClick={()=>onLegacy('living')}>Съдебен процес и редактор на случаи <ArrowRight size={15}/></button>
    <button type="button" onClick={()=>onStage('ending')}>Финално заключение <ArrowRight size={15}/></button>
    {data.replayUnlocked&&<button type="button" onClick={()=>onLegacy('game09')}>New Game+ и преиграване <ArrowRight size={15}/></button>}
   </div>
  </>}
 </section>;
}
