import {useEffect,useState} from 'react';
import {ArrowRight,BookOpen,CheckCircle2,Clock3,Compass,MapPin,MessageCircle,ShieldCheck,Users,Wallet,LockKeyhole,AlertTriangle,Hourglass,BriefcaseBusiness} from 'lucide-react';
import './universe.css';
import {useLanguage} from './i18n';

type CaseId='case-001'|'case-002';
type Action={kind:'travel'|'assign';id:string}|{kind:'talk';id:string;approach:'empathy'|'verify'|'challenge'}|{kind:'wait'|'brief'};
type Place={id:string;name:string;tag:string;description:string;x:number;y:number;open:boolean;active:boolean;visited:boolean;missing:string[]};
type Mission={id:string;title:string;detail:string;cost:number;duration:number;ready:boolean;missing:string[];status:string;remaining:number|null;report:string|null};
type Person={id:string;name:string;role:string;where:string|null;unknown:boolean;nearby:boolean;spoken:boolean;approach:string|null;attitude:string;transcript:string|null;verifyReady:boolean;requires:string[]};
type World={caseId:CaseId;turn:number;time:string;credits:number;location:string;locations:Place[];
 partner:{name:string;advice:string;briefs:number};missions:Mission[];people:Person[];
 journal:{at:number;kind:string;text:string}[]};
const origin=(import.meta.env.VITE_API_URL||'')+'/api/universe/';
async function fetchWorld<T>(session:string,caseId:CaseId,body?:Action):Promise<T>{
 const res=await fetch(origin+caseId+(body?'/action':''),{method:body?'POST':'GET',
  headers:{'Content-Type':'application/json','x-case-session':session},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||'Системата е временно недостъпна.');
 return data as T;
}
export function InvestigationUniverse({session,caseId,onStage,onLegacy}:{
 session:string;caseId:CaseId;onStage:(stage:string)=>void;onLegacy:(section:string)=>void;
}){
 const {t}=useLanguage();
 const [world,setWorld]=useState<World|null>(null);
 const [mode,setMode]=useState<'partner'|'city'|'people'>('city');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const [approaches,setApproaches]=useState<Record<string,'empathy'|'verify'|'challenge'>>({});
 useEffect(()=>{
  let active=true;setWorld(null);setError('');setNotice('');
  if(session)void fetchWorld<World>(session,caseId).then(data=>{if(active)setWorld(data);}).catch(e=>{if(active)setError(String(e));});
  return()=>{active=false;};
 },[caseId,session]);
 async function act(action:Action){
  if(busy)return;
  setBusy(true);setNotice('');setError('');
  try{
   const result=await fetchWorld<{message:string;world:World}>(session,caseId,action);
   setNotice(result.message);setWorld(result.world);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 const active=world?.locations.find(x=>x.id===world.location);
 return <section className="u17">
  <header className="u17-hero"><div><span>CASEFILES 1.5–1.7 / DETECTIVE UNIVERSE</span><h1>{t('Градът пази своите тайни.')}</h1><p>{t('Изпращай екипа, придвижвай се между районите и разговаряй с хора, чиито маршрути се променят с игровото време.')}</p></div>
   <div className="u17-clock"><Clock3 size={23}/><strong>{world?.time||'--:--'}</strong><span>{t('ИГРОВО ВРЕМЕ · ХОД')} {world?.turn||0}/60</span></div>
  </header>
  <div className="u17-mode" role="group" aria-label={t('Раздели на детективския свят')}>
   <button type="button" aria-pressed={mode==='city'} className={mode==='city'?'selected':''} onClick={()=>setMode('city')}><Compass size={17}/> {t('Интерактивен град')}</button>
   <button type="button" aria-pressed={mode==='partner'} className={mode==='partner'?'selected':''} onClick={()=>setMode('partner')}><BriefcaseBusiness size={17}/> {t('Партньор и задачи')}</button>
   <button type="button" aria-pressed={mode==='people'} className={mode==='people'?'selected':''} onClick={()=>setMode('people')}><Users size={17}/> {t('Живи заподозрени')}</button>
  </div>
  {notice&&<p role="status" className="u17-notice">{t(notice)}</p>}
  {error&&<p role="alert" className="u17-error">{t(error)}</p>}
  {!world?<div className="u17-loading">{t('Свързване с игровия свят…')}</div>:<>
   <div className="u17-stats"><span><MapPin size={17}/> {t(active?.name||'Щаб')}</span><span><Wallet size={17}/> {world.credits} {t('бюджетни точки')}</span><span><Hourglass size={17}/> {world.missions.filter(m=>m.status==='running').length} {t('активни задачи')}</span></div>
   {mode==='city'&&<>
    <div className="u17-title"><span>{t('РАЙОННА КАРТА')}</span><h2>{caseId==='case-001'?t('София · Нощен район'):t('Пловдив · Архивен район')}</h2><p>{t('Схематична игрова карта. Всяко пътуване напредва с 20 минути; отключването зависи от наличните доказателства.')}</p></div>
    <div className="u17-map" role="group" aria-label={t('Карта на разследването')}>
     <div className="u17-road u17-road-a"/><div className="u17-road u17-road-b"/><div className="u17-road u17-road-c"/>
     <span className="u17-watermark">CASEFILES / DISTRICT {caseId==='case-001'?'SOFIA':'PLOVDIV'}</span>
     {world.locations.map(p=><button type="button" key={p.id} className={'u17-pin '+(p.active?'active ':'')+(!p.open?'locked':'')} style={{left:p.x+'%',top:p.y+'%'}}
      disabled={busy||!p.open||p.active} onClick={()=>void act({kind:'travel',id:p.id})} aria-label={t('Пътувай до')+' '+t(p.name)}>
      <span className="u17-pin-mark">{p.open?(p.active?<MapPin size={21}/>:<Compass size={18}/>):<LockKeyhole size={18}/>}</span><strong>{t(p.name)}</strong><small>{p.open?(p.active?t('ТУК СИ'):t(p.tag)):t('ЗАКЛЮЧЕНО')}</small></button>)}
    </div>
    <div className="u17-cards">{world.locations.map(p=><article key={p.id} className={'u17-card '+(p.active?'u17-current':'')}>
     <div className="u17-card-head"><strong>{t(p.name)}</strong><small>{p.active?t('ТЕКУЩО МЯСТО'):t(p.tag)}</small></div>
     <p>{p.open?t(p.description):t('Отключи със следите:')+' '+p.missing.join(', ')}</p>
     <button type="button" disabled={busy||!p.open||p.active} onClick={()=>void act({kind:'travel',id:p.id})}>{p.active?t('На място'):p.open?t('Пътувай'):t('Заключено')} <ArrowRight size={15}/></button>
    </article>)}</div>
    <div className="u17-actions"><button type="button" disabled={busy||world.turn>=60} onClick={()=>void act({kind:'wait'})}><Clock3 size={16}/> {t('Изчакай 20 игрови минути')}</button><button type="button" onClick={()=>onStage('scene')}><BookOpen size={16}/> {t('Огледай основния случай')}</button></div>
   </>}
   {mode==='partner'&&<>
    <article className="u17-partner"><div className="u17-agent"><span>AD</span><strong>{t(world.partner.name)}</strong><small>{t('ОПЕРАТИВЕН ПАРТНЬОР · СЦЕНАРЕН AI')}</small></div><blockquote>{t(world.partner.advice)}</blockquote><div className="u17-actions"><button type="button" disabled={busy||world.location!=='station'||world.partner.briefs>=8||world.turn>=60} onClick={()=>void act({kind:'brief'})}><MessageCircle size={16}/> {t('Оперативен брифинг')} ({world.partner.briefs}/8)</button><button type="button" disabled={busy||world.location==='station'} onClick={()=>void act({kind:'travel',id:'station'})}>{t('Към щаба')} <ArrowRight size={14}/></button></div></article>
    <div className="u17-title"><span>{t('УПРАВЛЕНИЕ НА ЕКИП')}</span><h2>{t('Възложи експертиза')}</h2><p>{t('До две едновременни задачи. Възложените операции имат бюджет, продължителност и проверим, предварително написан доклад. Не добавят тайно нови улики.')}</p></div>
    <div className="u17-cards">{world.missions.map(m=><article className="u17-card" key={m.id}>
     <div className="u17-card-head"><strong>{t(m.title)}</strong><small>{t(m.status==='done'?'ЗАВЪРШЕНА':m.status==='running'?'В РАБОТА':'ОЧАКВА')}</small></div>
     <p>{t(m.report||m.detail)}</p>
     <div className="u17-tags"><span>{m.cost} {t('точки')}</span><span>{m.duration} {t('хода')}</span>{m.missing.length>0&&<span>{t('Липсват:')} {m.missing.join(', ')}</span>}{m.remaining!==null&&<span>{t('Остават')} {m.remaining} {t('хода')}</span>}</div>
     <button type="button" disabled={busy||m.status!=='available'||!m.ready||world.location!=='station'||world.credits<m.cost||world.turn>=60} onClick={()=>void act({kind:'assign',id:m.id})}>
      {m.status==='done'?<><CheckCircle2 size={16}/> {t('Прочети доклада')}</>:m.status==='running'?t('Екипът работи'):t('Възложи задача')} <ArrowRight size={15}/></button>
    </article>)}</div>
   </>}
   {mode==='people'&&<>
    <div className="u17-title"><span>{t('ПОВЕДЕНИЕ И ПАМЕТ')}</span><h2>{t('Говори с хората на място')}</h2><p>{t('Маршрутите им се сменят на всеки два игрови хода. Всеки разговор има един окончателен подход и последствия за доверието. Тук няма автоматично издаване на присъда.')}</p></div>
    <div className="u17-cards">{world.people.map(p=>{
     const approach=approaches[p.id]||'empathy';
     return <article key={p.id} className={'u17-card '+(p.nearby?'u17-current':'')}>
      <div className="u17-card-head"><strong>{p.name}</strong><small>{t(p.attitude).toLocaleUpperCase()}</small></div>
      <p>{t(p.role)}</p>
      <div className="u17-tags"><span><MapPin size={13}/> {p.unknown?t('Местоположение неизвестно'):t(world.locations.find(l=>l.id===p.where)?.name||'В движение')}</span><span>{t(p.spoken?'Разговорът е проведен':p.nearby?'Наблизо':'Не е тук')}</span></div>
      {p.transcript&&<blockquote className="u17-transcript">{t(p.transcript)}</blockquote>}
      {!p.spoken&&<><label className="u17-field">{t('Подход към разговора')}
       <select value={approach} onChange={e=>setApproaches(xs=>({...xs,[p.id]:e.target.value as 'empathy'|'verify'|'challenge'}))}>
        <option value="empathy">{t('Изслушване и доверие')}</option><option value="verify">{t('Проверка с доказателства')}</option><option value="challenge">{t('Оспорване на показанията')}</option>
       </select></label>
       {!p.verifyReady&&approach!=='empathy'&&<small>{t('Нужни са още:')} {p.requires.join(', ')}</small>}
       <button type="button" disabled={busy||!p.nearby||(approach!=='empathy'&&!p.verifyReady)||world.turn>=60} onClick={()=>void act({kind:'talk',id:p.id,approach})}><MessageCircle size={15}/> {t(p.nearby?'Проведи разговор':'Потърси човека')}</button></>}
     </article>;
    })}</div>
    <div className="u17-actions"><button type="button" onClick={()=>setMode('city')}><Compass size={16}/> {t('Отвори картата')}</button><button type="button" onClick={()=>onLegacy('interview')}><ShieldCheck size={16}/> {t('Класически разпити')}</button><button type="button" disabled={busy||world.turn>=60} onClick={()=>void act({kind:'wait'})}>{t('Следващ игрови час')} <ArrowRight size={15}/></button></div>
   </>}
   {world.journal.length>0&&<section className="u17-log"><h3><BookOpen size={18}/> {t('Последни действия')}</h3>{world.journal.map((j,i)=><p key={j.kind+j.at+i}>{t('ХОД')} {j.at} · {t(j.text)}</p>)}</section>}
   <footer className="u17-foot"><AlertTriangle size={15}/> {t('Времето, маршрутите, бюджетът и поведенията са фикционална симулация, не реално проследяване на хора.')}</footer>
  </>}
 </section>;
}
