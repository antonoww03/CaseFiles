import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, Clapperboard, Clock3, FileSearch, Files, Fingerprint, FolderOpen, LockKeyhole, Microscope, Play, ScanSearch, ShieldCheck, Video } from 'lucide-react';
import './forensic.css';

export type ForensicClip = { id:string; title:string; place:string; start:string; end:string; duration:number; analyzed:boolean };
export type VideoFrame = { second:number; clock:string; visual:string; details:readonly string[] };
export type DocumentCard = { id:string; title:string; category:string; publicSummary:string; available:boolean; analyzed:boolean };
export type DocumentDetail = { id:string; title:string; pages:{id:string;label:string;content:string;finding:string}[]; analyzed:boolean };
type EvidenceResult={found:string[];clueId:string;observation?:string;finding?:string;completed?:boolean};

async function request<T>(session:string,path:string,method='GET',body?:unknown):Promise<T> {
  const res=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{
    method,headers:{'Content-Type':'application/json','x-case-session':session},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const data=await res.json();
  if(!res.ok)throw new Error(data.error||'Неуспешна заявка към лабораторията.');
  return data as T;
}
function fmt(value:number) {return Math.floor(value/60).toString().padStart(2,'0')+':'+(value%60).toString().padStart(2,'0');}

export function ForensicWorkbench({session,onFound}: {session:string;onFound:(found:string[])=>void}) {
  const [section,setSection]=useState<'video'|'documents'>('video');
  const [clips,setClips]=useState<ForensicClip[]>([]);
  const [documents,setDocuments]=useState<DocumentCard[]>([]);
  const [clip,setClip]=useState('elevator');
  const [second,setSecond]=useState(0);
  const [frame,setFrame]=useState<VideoFrame|null>(null);
  const [detail,setDetail]=useState('');
  const [docId,setDocId]=useState('');
  const [doc,setDoc]=useState<DocumentDetail|null>(null);
  const [pageId,setPageId]=useState('');
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);

  async function refresh() {
    if(!session)return;
    try{
      const [nextClips,nextDocs]=await Promise.all([
        request<ForensicClip[]>(session,'/forensics/clips'),
        request<DocumentCard[]>(session,'/forensics/documents')
      ]);
      setClips(nextClips);setDocuments(nextDocs);
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
  }
  useEffect(()=>{void refresh();},[session]);
  useEffect(()=>{
    if(!session)return;
    let alive=true;
    void request<{frame:VideoFrame}>(session,'/forensics/clips/'+clip+'/frame?second='+second).then(data=>{
      if(alive){setFrame(data.frame);setDetail('');}
    }).catch(e=>{if(alive)setNotice(e instanceof Error?e.message:String(e));});
    return()=>{alive=false;};
  },[clip,second,session]);

  const activeClip=clips.find(c=>c.id===clip);
  async function analyze(){
    if(!session||!detail)return;
    setLoading(true);setNotice('');
    try{
      const data=await request<EvidenceResult>(session,'/forensics/clips/'+clip+'/analyze','POST',{second,detail});
      onFound(data.found);setNotice('Доказателството '+data.clueId+' е добавено в досието.');
      await refresh();
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
    finally{setLoading(false);}
  }
  async function openDocument(id:string){
    setDocId(id);setDoc(null);setPageId('');setNotice('');
    try{
      const d=await request<DocumentDetail>(session,'/forensics/documents/'+id);
      setDoc(d);setPageId(d.pages[0]?.id||'');
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
  }
  async function inspectPage(){
    if(!doc||!pageId)return;
    setLoading(true);setNotice('');
    try{
      const data=await request<EvidenceResult>(session,'/forensics/documents/'+doc.id+'/inspect','POST',{pageId});
      onFound(data.found);
      setNotice(data.completed?'Разчетена ключова следа '+data.clueId+'. '+data.finding:data.finding||'Страницата е проверена.');
      await refresh();
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
    finally{setLoading(false);}
  }
  const selectedPage=doc?.pages.find(p=>p.id===pageId);
  return <div className="f04-lab">
    <div className="f04-tabs" role="group" aria-label="Вид криминалистичен анализ">
      <button type="button" className={section==='video'?'active':''} onClick={()=>{setSection('video');setNotice('');}}><Video size={18}/> Видеозаписи <span>02</span></button>
      <button type="button" className={section==='documents'?'active':''} onClick={()=>{setSection('documents');setNotice('');}}><Files size={18}/> Анализ на документи <span>02</span></button>
    </div>
    {section==='video'&&<div className="f04-stack">
      <div className="f04-records">{clips.map(c=><button type="button" className={clip===c.id?'active':''} key={c.id} onClick={()=>{setClip(c.id);setSecond(0);setNotice('');}}>
        <span className="f04-record-icon"><Clapperboard size={22}/></span>
        <span><strong>{c.title}</strong><small>{c.place} · {c.start}–{c.end}</small></span>
        <span className={'f04-dot '+(c.analyzed?'done':'')}>{c.analyzed?<Check size={15}/>:<Play size={13}/>}</span>
      </button>)}</div>
      <div className="f04-video-display">
        <div className="f04-video-bar"><span><span className="f04-rec-dot"/> REC / {activeClip?.title||'КАМЕРА'}</span><span>{frame?.clock||'--:--:--'}</span></div>
        <div className={'f04-video-scene '+(clip==='elevator'?'elevator':'exit')}>
          <span className="f04-video-noise" aria-hidden="true"/>
          <span className="f04-camera-wall"/><span className="f04-camera-door"/><span className="f04-camera-light"/>
          {frame?.visual.includes('Фигура')||frame?.visual.includes('фигура')?<span className="f04-person"><span className="f04-person-head"/><span className="f04-person-strap"/></span>:null}
          <span className="f04-video-reticle" aria-hidden="true"/>
          <div className="f04-video-label"><span>CAMERA / {clip==='elevator'?'04':'01'}</span><strong>{frame?.visual||'Зареждане на записа...'}</strong></div>
        </div>
        <div className="f04-playhead">
          <button type="button" aria-label="Назад с един кадър" onClick={()=>setSecond(v=>Math.max(0,v-60))}><ChevronLeft size={20}/></button>
          <div><label htmlFor="f04-video-seek"><Clock3 size={14}/> ПРЕВЪРТАНЕ / {fmt(second)} ОТ 04:00</label><input id="f04-video-seek" type="range" min={0} max={240} step={60} value={second} onChange={e=>setSecond(Number(e.target.value))}/></div>
          <button type="button" aria-label="Напред с един кадър" onClick={()=>setSecond(v=>Math.min(240,v+60))}><ChevronRight size={20}/></button>
        </div>
      </div>
      <div className="f04-analyze"><div><h3><ScanSearch size={18}/> Анализирай детайла</h3><p>Избери характеристика от текущия кадър и я потвърди. Само съществено наблюдение отключва официална улика.</p></div>
        <div className="f04-analyze-actions"><label><span>НАБЛЮДАВАН ДЕТАЙЛ</span><select value={detail} onChange={e=>setDetail(e.target.value)}><option value="">Избери видим детайл...</option>{(frame?.details||[]).map(value=><option key={value} value={value}>{value}</option>)}</select></label><button type="button" className="primary" disabled={!detail||loading||!session} onClick={()=>void analyze()}><Fingerprint size={16}/> Потвърди наблюдението</button></div>
      </div>
    </div>}
    {section==='documents'&&<div className="f04-stack">
      <div className="f04-doc-cards">{documents.map(d=><button type="button" key={d.id} className={'f04-doc-card '+(d.id===docId?'selected':'')} disabled={!d.available} onClick={()=>void openDocument(d.id)}>
        <span className="f04-file-thumb"><FileSearch size={32}/></span><span><strong>{d.title}</strong><small>{d.category}</small><em>{d.publicSummary}</em></span><span className={'f04-doc-status '+(d.analyzed?'done':'')}>{!d.available?<LockKeyhole size={15}/>:d.analyzed?<Check size={15}/>:<ArrowRight size={15}/>}</span>
      </button>)}</div>
      {doc&&<div className="f04-document"><div className="f04-document-head"><span><FolderOpen size={18}/> ОТВОРЕН ДОКУМЕНТ / {doc.title}</span><span>CASEFILES / 001</span></div>
        <div className="f04-document-pages"><div className="f04-paper-nav">{doc.pages.map((p,i)=><button type="button" key={p.id} className={pageId===p.id?'active':''} onClick={()=>setPageId(p.id)}>СТР. {i+1}<span>{p.label}</span></button>)}</div>
          <div className="f04-paper"><div className="f04-paper-top">ПРИЛОЖЕНИЕ КЪМ ДОСИЕ 001 / СЛУЖЕБЕН МАТЕРИАЛ</div><div className="f04-paper-stamp">CASEFILES<br/>CONFIDENTIAL</div><h3>{selectedPage?.label}</h3><p>{selectedPage?.content}</p><div className="f04-paper-foot">КРАЙ НА СТРАНИЦАТА / СЪХРАНЕН ПРОТОКОЛ</div></div>
        </div><div className="f04-document-bottom"><span><Microscope size={15}/> Провери текущата страница за информация</span><button className="primary" type="button" disabled={loading} onClick={()=>void inspectPage()}><FileSearch size={15}/> Анализирай страницата</button></div>
      </div>}
      {!doc&&<div className="f04-doc-empty"><FileSearch size={28}/><strong>Избери достъпен документ</strong><p>Някои документи се отключват едва след откриване на предварителните улики.</p></div>}
    </div>}
    {notice&&<div className="f04-result" role="status"><ShieldCheck size={17}/>{notice}</div>}
    <div className="f04-disclaimer"><CircleHelp size={16}/> Видеозаписите са игрови възстановки от статични кадри, а не реални видеозаписи. Всички данни са част от измисления криминален случай.</div>
  </div>;
}

export type FinalReportData = {
 status:'solved';headline:string;conclusion:string;
 timeline:{time:string;event:string}[];
 collected:string[];missed:{id:string;title:string}[];
 verifiedFindings:{id:string;title:string;finding:string}[];
 score:{total:number;rank:string;penalty:number;categories:{name:string;earned:number;max:number}[]};
 hintsUsed:number;accusations:number;
};
export function FinalReport({report}:{report:FinalReportData|null}) {
 if(!report)return <div className="f04-locked"><LockKeyhole size={35}/><h3>Докладът е запечатан</h3><p>Пълната реконструкция се отключва само след успешно доказано заключение по случая.</p></div>;
 return <div className="f04-report">
   <div className="f04-report-banner"><ShieldCheck size={31}/><div><span>CASEFILES / ДОКЛАД 001</span><h2>{report.headline}</h2><p>{report.conclusion}</p></div><div className="f04-report-grade"><strong>{report.score.total}</strong><span>/ 100</span></div></div>
   <div className="f04-report-counters"><div><strong>{report.collected.length}</strong><span>Събрани улики</span></div><div><strong>{report.missed.length}</strong><span>Пропуснати улики</span></div><div><strong>{report.hintsUsed}</strong><span>Подсказки</span></div><div><strong>{report.accusations}</strong><span>Обвинения</span></div></div>
   <div className="f04-report-section"><h3><Clock3 size={17}/> Потвърдена хронология</h3><div className="f04-report-timeline">{report.timeline.map(x=><div key={x.time}><strong>{x.time}</strong><span>{x.event}</span></div>)}</div></div>
   <div className="f04-report-section"><h3><Check size={17}/> Проверени противоречия</h3>{report.verifiedFindings.length?report.verifiedFindings.map(x=><div className="f04-report-finding" key={x.id}><strong>{x.title}</strong><p>{x.finding}</p></div>):<p className="f04-muted">Няма допълнително проверени противоречия.</p>}</div>
   <div className="f04-report-section"><h3><FileSearch size={17}/> Пропуснати улики</h3>{report.missed.length?<p className="f04-muted">{report.missed.map(x=>x.id+' — '+x.title).join(' · ')}</p>:<p className="f04-muted">Всички доказателства са събрани.</p>}<p className="f04-muted">Оценка: {report.score.rank}. Наказателни точки за подсказки и повторни обвинения: {report.score.penalty}.</p></div>
 </div>;
}

export function HintStation({session}:{session:string}) {
 const [used,setUsed]=useState(0);
 const [hint,setHint]=useState<{level:number;title:string;text:string}|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!session){setUsed(0);setHint(null);return;}void request<{used:number}>(session,'/hints').then(data=>setUsed(data.used)).catch(()=>{});},[session]);
 async function take(){
   setBusy(true);setError('');
   try{const data=await request<{hint:{level:number;title:string;text:string};used:number}>(session,'/hints','POST',{});setHint(data.hint);setUsed(data.used);}
   catch(e){setError(e instanceof Error?e.message:String(e));}
   finally{setBusy(false);}
 }
 return <div className="f04-hints"><div><CircleHelp size={19}/><strong>Нужна е насока?</strong></div><p>Три степени на помощ. Всяка използвана подсказка намалява крайния резултат.</p>{hint&&<div className="f04-hint-text"><span>ПОДСКАЗКА {hint.level} · {hint.title}</span><p>{hint.text}</p></div>}
  <button type="button" className="secondary" disabled={!session||used>=3||busy} onClick={()=>void take()}>{used>=3?'Няма повече подсказки':'Разкрий подсказка ('+(3-used)+' остават)'}</button>{error&&<span className="f04-hint-error">{error}</span>}
 </div>;
}
