import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Person = { id: string; name: string; role: string; initial: string; opening: string };
type Evidence = { id: string; title: string; type: string; detail: string; icon: string };
type CaseInfo = { title: string; location: string; date: string; briefing: string; people: Person[] };
type Chat = { role: string; text: string };
type Deduction = { id: string; title: string; explanation: string; evidenceIds: readonly [string,string] };
type View = 'briefing' | 'scene' | 'lab' | 'evidence' | 'board' | 'timeline' | 'interview' | 'accusation';
const tabs: { id: View; name: string; icon: string }[] = [
  { id: 'briefing', name: 'Досие', icon: '▤' },
  { id: 'scene', name: 'Апартамент 407', icon: '⌖' },
  { id: 'lab', name: 'Криминалистика', icon: '◈' },
  { id: 'evidence', name: 'Доказателства', icon: '▦' },
  { id: 'board', name: 'Връзки', icon: '⥈' },
  { id: 'timeline', name: 'Хронология', icon: '◷' },
  { id: 'interview', name: 'Разпити', icon: '◎' },
  { id: 'accusation', name: 'Обвинение', icon: '⚖' }
];
const sceneIds = ['E01','E03','E04','E08','E09'];
const labIds = ['E05','E06','E07','E10','E02'];
const allEvidence: Evidence[] = [
  ['E01','Протокол от огледа','Документ','Апартаментът е намерен заключен. Няма следи от взлом.','▤'],
  ['E03','Последно обаждане','Телефон','В 01:17 е проведен 18-секунден разговор с Елена. Записът не разкрива съдържанието.','☎'],
  ['E04','Съобщение 00:42','Кореспонденция','Никола е поискал от Мартин да донесе оригиналните фактури.','✉'],
  ['E08','Дневник на ключалката','Системен лог','В 01:28 входната врата се затваря и заключва автоматично.','⚿'],
  ['E09','Финансова чернова','Документ','Никола е подготвял сигнал за несъответствия по фактури.','▥'],
  ['E05','Дневник на входния код','Системен лог','В 01:09 временен код отваря входа на сградата.','⌁'],
  ['E06','Камера: асансьор','Видео','В 01:12 човек със светла диагонална презрамка се качва към четвъртия етаж.','▣'],
  ['E07','Камера: вход','Видео','В 01:29 човек със сходна презрамка напуска сградата. Лицето е неясно.','▣'],
  ['E10','Карта на пропуските','Регистър','Временният код е издаден за уговорено посещение. Не доказва самостоятелно самоличност.','▦'],
  ['E02','Съдебномедицинска оценка','Експертиза','Ориентировъчният интервал на смъртта е 01:20–01:25; оценката не е точна до минута.','✚'],
  ['E11','Показания на Елена','Протокол','Първоначално Елена отрича контакт, въпреки че телефонният регистър показва разговор.','◈'],
  ['E12','Показания на Петър','Протокол','Петър посочва приблизително време на шума, но не е сигурен за минутата.','◈']
].map(([id,title,type,detail,icon])=>({id,title,type,detail,icon}));
const timeline = [
  ['00:42','Съобщение за оригинални фактури','E04'],
  ['01:09','Временен код отваря входа','E05'],
  ['01:12','Камера засича фигура в асансьора','E06'],
  ['01:17','Последният разговор на Никола','E03'],
  ['≈ 01:20–01:25','Приблизителен интервал на смъртта','E02'],
  ['01:28','Автоматично заключване','E08'],
  ['01:29','Фигура напуска сградата','E07'],
  ['02:37','Откриване на тялото','E01']
] as const;
const storageKey = 'casefiles-demo-session';
async function call<T>(path: string, method='GET', body?: unknown, session?: string): Promise<T> {
  const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api' + path,{method,headers:{'Content-Type':'application/json',...(session?{'x-case-session':session}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || 'Връзката със сървъра е прекъсната.');
  return data;
}
function App(){
 const [view,setView]=useState<View>('briefing');
 const [info,setInfo]=useState<CaseInfo|null>(null);
 const [session,setSession]=useState('');
 const [found,setFound]=useState<string[]>([]);
 const [messages,setMessages]=useState<Record<string,Chat[]>>({});
 const [deductions,setDeductions]=useState<Deduction[]>([]);
 const [linkA,setLinkA]=useState('');
 const [linkB,setLinkB]=useState('');
 const [linkNotice,setLinkNotice]=useState('');
 const [activePerson,setActivePerson]=useState('martin');
 const [selected,setSelected]=useState<Evidence|null>(null);
 const [question,setQuestion]=useState('');
 const [present,setPresent]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [aiMode,setAiMode]=useState<'checking'|'ai-configured'|'ai-live'|'scripted-demo'>('checking');
 const [suspect,setSuspect]=useState('martin');
 const [motive,setMotive]=useState('');
 const [sequence,setSequence]=useState('');
 const [checked,setChecked]=useState<string[]>([]);
 const [verdict,setVerdict]=useState<{status:string;title:string;explanation:string}|null>(null);
 useEffect(()=>{
  call<CaseInfo>('/case').then(setInfo).catch(e=>setError(String(e)));
  call<{mode:'ai-configured'|'scripted-demo'}>('/health').then(data=>setAiMode(data.mode)).catch(()=>setAiMode('scripted-demo'));
  const old=localStorage.getItem(storageKey);
  if(old) call<{found:string[];links:string[];messages:Record<string,Chat[]>}>('/session','GET',undefined,old).then(s=>{setSession(old);setFound(s.found);setMessages(s.messages);void call<Deduction[]>('/deductions','GET',undefined,old).then(setDeductions).catch(()=>setDeductions([]))}).catch(()=>localStorage.removeItem(storageKey));
 },[]);
 const start=async()=>{setBusy(true);setError('');try{const data=await call<{sessionId:string;found:string[]}>('/session','POST');localStorage.setItem(storageKey,data.sessionId);setSession(data.sessionId);setFound([]);setMessages({});setDeductions([]);setLinkA('');setLinkB('');setLinkNotice('');setChecked([]);setVerdict(null);setView('scene')}catch(e){setError(String(e))}finally{setBusy(false)}};
 const discover=async(e:Evidence)=>{if(!session){setError('Първо започни разследване от досието.');return}if(found.includes(e.id)){setSelected(e);return}if(busy)return;setBusy(true);try{const data=await call<{found:string[]}>('/discover/'+e.id,'POST',{},session);setFound(data.found);setSelected(e)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const send=async()=>{if(!question.trim()||busy||!session)return;const text=question.trim();setBusy(true);setError('');try{const data=await call<{reply:string;found:string[];mode:'ai-live'|'scripted-demo'}>('/interview','POST',{personId:activePerson,message:text,...(present?{evidenceId:present}:{})},session);setMessages(m=>({...m,[activePerson]:[...(m[activePerson]||[]),{role:'player',text},{role:'npc',text:data.reply}]}));setFound(data.found);setAiMode(data.mode);setQuestion('');setPresent('')}catch(e){setError(String(e))}finally{setBusy(false)}};
 const connect=async()=>{if(!session||busy||!linkA||!linkB||linkA===linkB)return;setBusy(true);setLinkNotice('');try{const data=await call<{deduction:Deduction;links:string[]}>('/deductions','POST',{firstId:linkA,secondId:linkB},session);setDeductions(current=>current.some(x=>x.id===data.deduction.id)?current:[...current,data.deduction]);setLinkNotice('Открита връзка: '+data.deduction.title)}catch(e){setLinkNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const accuse=async()=>{setBusy(true);setError('');try{setVerdict(await call('/accusation','POST',{suspectId:suspect,motive,timeline:sequence,evidenceIds:checked},session))}catch(e){setError(String(e))}finally{setBusy(false)}};
 const person=info?.people.find(p=>p.id===activePerson);
 const list=(ids:string[])=> <div className="cardgrid">{ids.map(id=>{const e=allEvidence.find(x=>x.id===id)!;return <button key={e.id} className={'e-card '+(found.includes(id)?'collected':'')} onClick={()=>discover(e)}><span className="e-symbol">{e.icon}</span><span className="mono gold">{e.id} {found.includes(id)?'· ОТКРИТО':'· ЗА ОГЛЕД'}</span><strong>{e.title}</strong><span className="muted small">{e.type}</span></button>})}</div>;
 return <><header><div className="logo">CASE<span>FILES</span><small>THE TRUTH IS HIDDEN</small></div><div className="header-right"><span className="pill">CASE / 001</span><span className="sub">{session?'АКТИВНА СЕСИЯ':'ДЕМО ВЕРСИЯ'}</span></div></header><div className="layout"><aside><div className="case-label">АКТИВНО ДОСИЕ</div><h3>Последното<br/>обаждане</h3><p className="muted small">СОФИЯ · 14.10.2026</p><nav>{tabs.map(t=><button className={'nav '+(view===t.id?'active':'')} key={t.id} onClick={()=>{setView(t.id);setError('')}}><span>{t.icon}</span>{t.name}{t.id==='evidence'&&<em>{found.length}</em>}</button>)}</nav><div className="progress"><div className="case-label">СЪБРАНИ ДОКАЗАТЕЛСТВА</div><div className="meter"><span style={{width:found.length/12*100+'%'}}/></div><span className="mono muted">{found.length} / 12</span></div></aside><main><div className="section-top"><span className="mono gold">CASE #001 / {tabs.find(t=>t.id===view)?.name.toUpperCase()}</span><span className="mono muted">{aiMode==='ai-live'?'AI ОТГОВОР · ПОТВЪРДЕН':aiMode==='ai-configured'?'AI КЛЮЧ · НЕПОТВЪРДЕН':aiMode==='checking'?'ПРОВЕРКА НА СЪРВЪРА':'ДЕМОНСТРАЦИОНЕН РАЗПИТ'}</span></div>
 {error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')}>✕</button></div>}
 {view==='briefing'&&<><h1>Последното обаждане</h1><p className="lead">{info?.briefing||'Зареждане на досието...'}</p><div className="hero"><div className="hero-number">407</div><span className="hero-line">МЕСТОПРЕСТЪПЛЕНИЕ / ДОСТЪП ОГРАНИЧЕН</span></div><div className="brief-grid"><div><span className="mono gold">01 / ОБСТОЯТЕЛСТВА</span><p>Заключен апартамент. Няма следи от взлом. Последното телефонно обаждане може да се окаже ключово.</p></div><div><span className="mono gold">02 / ЦЕЛ</span><p>Събери доказателства, разговаряй със свидетелите и изгради обосновано обвинение.</p></div></div><button className="primary" onClick={()=>session?setView('scene'):start()} disabled={busy||!info}>{session?'Продължи разследването →':'Започни разследване →'}</button></>}
 {view==='scene'&&<><h1>Апартамент 407</h1><p className="muted">Потърси интерактивните маркери в стаята и разгледай намерените предмети. Част от следите са в криминалистичното бюро.</p><div className="scene"><span className="mono scene-label">02:37 / ПЪРВОНАЧАЛЕН ОГЛЕД</span><div className="scene-room"><div className="sofa"/><div className="tablepiece"/><div className="deskpiece"/><div className="rug"/></div>{sceneIds.map((id,i)=>{const e=allEvidence.find(x=>x.id===id)!;return <button key={id} className={'scene-hotspot hotspot-'+i+(found.includes(id)?' examined':'')} onClick={()=>discover(e)} title={e.title} aria-label={'Разгледай: '+e.title}>{found.includes(id)?'✓':'+'}</button>})}<span className="scene-bottom">ОБЕКТ / 407 · ЧЕТВЪРТИ ЕТАЖ</span></div><h2>Намерени улики</h2>{sceneIds.some(id=>found.includes(id))?list(sceneIds.filter(id=>found.includes(id))):<p className="empty">Използвай светещите маркери, за да огледаш апартамента.</p>}</>}
 {view==='lab'&&<><h1>Криминалистично бюро</h1><p className="muted">Вече изготвените анализи са достъпни за преглед в досието.</p>{list(labIds)}</>}
 {view==='evidence'&&<><h1>Доказателства</h1><p className="muted">Само откритите улики могат да бъдат представяни при разпит или приложени към обвинението.</p>{found.length?list(found):<p className="empty">Още няма събрани доказателства. Започни с огледа.</p>}</>}
 {view==='board'&&<><h1>Дъска на доказателствата</h1><p className="muted">Избери две събрани улики и провери дали между тях има логическа връзка. Не всяка комбинация води до заключение.</p><div className="formpanel"><label htmlFor="board-first">ПЪРВА УЛИКА</label><select id="board-first" value={linkA} onChange={e=>setLinkA(e.target.value)}><option value="">Избери доказателство</option>{allEvidence.filter(e=>found.includes(e.id)).map(e=><option key={e.id} value={e.id}>{e.id} · {e.title}</option>)}</select><label htmlFor="board-second">ВТОРА УЛИКА</label><select id="board-second" value={linkB} onChange={e=>setLinkB(e.target.value)}><option value="">Избери доказателство</option>{allEvidence.filter(e=>found.includes(e.id)).map(e=><option key={e.id} value={e.id}>{e.id} · {e.title}</option>)}</select><button className="primary" onClick={connect} disabled={!session||busy||!linkA||!linkB||linkA===linkB}>Свържи уликите →</button>{linkNotice&&<p role="status" className="muted">{linkNotice}</p>}</div><h2>Установени връзки — {deductions.length}</h2>{deductions.length===0?<p className="empty">Все още няма установени връзки. Изследвай уликите и намери противоречия.</p>:<div className="board-list">{deductions.map(d=><article key={d.id} className="board-card"><span className="mono gold">{d.id} · {d.evidenceIds.join(' + ')}</span><h3>{d.title}</h3><p>{d.explanation}</p></article>)}</div>}</>}
 {view==='timeline'&&<><h1>Хронология</h1><p className="muted">Показват се само времеви точки, подкрепени от вече открити улики.</p><div className="timeline">{timeline.filter(([, ,id])=>found.includes(id)).map(([time,txt,id])=><div className="time-item" key={id}><span className="mono gold">{time}</span><p>{txt}</p></div>)}</div>{!timeline.some(([, ,id])=>found.includes(id))&&<p className="empty">Все още няма потвърдени събития в хронологията.</p>}</>}
 {view==='interview'&&<><h1>Стая за разпити</h1><p className="muted">Задавай свободни въпроси и представяй откритите улики. {aiMode==='ai-live'?'Последният отговор беше генериран от AI.':aiMode==='ai-configured'?'AI ключ е зададен, но успешен отговор още не е потвърден. При грешка се използва демонстрационен диалог.':'Разпитите в момента използват демонстрационни реплики; AI може да не е достъпен.'}</p><div className="people">{info?.people.map(p=><button key={p.id} className={'person '+(activePerson===p.id?'selected':'')} onClick={()=>setActivePerson(p.id)}><span className="avatar">{p.initial}</span><strong>{p.name}</strong><small>{p.role}</small></button>)}</div><div className="interview"><div className="interview-head"><span className="avatar large">{person?.initial}</span><div><strong>{person?.name}</strong><p className="muted small">{person?.role} · РАЗПИТ</p></div></div><div className="chat" aria-live="polite"><div className="bubble"><span className="mono gold">{person?.name}</span><p>{person?.opening}</p></div>{(messages[activePerson]||[]).map((m,i)=><div key={i} className={'bubble '+(m.role==='player'?'player':'')}><span className="mono gold">{m.role==='player'?'ДЕТЕКТИВ':person?.name}</span><p>{m.text}</p></div>)}</div><label className="small muted" htmlFor="present">Предяви доказателство (по избор)</label><select id="present" value={present} onChange={e=>setPresent(e.target.value)}><option value="">Без доказателство</option>{allEvidence.filter(e=>found.includes(e.id)).map(e=><option key={e.id} value={e.id}>{e.id} · {e.title}</option>)}</select><form className="composer" onSubmit={e=>{e.preventDefault();send()}}><input maxLength={600} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Задай въпрос..." aria-label="Въпрос към заподозрения"/><button className="primary" disabled={!session||busy||!question.trim()}>Изпрати ↗</button></form></div></>}
 {view==='accusation'&&<><h1>Финално обвинение</h1><p className="muted">Използвай само потвърдени улики. Извършителят сам по себе си не е достатъчен за доказано обвинение.</p><div className="formpanel"><label htmlFor="suspect">ЗАПОДОЗРЯН</label><select id="suspect" value={suspect} onChange={e=>setSuspect(e.target.value)}>{info?.people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>ПРИЛОЖЕНИ ДОКАЗАТЕЛСТВА · МИНИМУМ 3</label><div className="checks">{allEvidence.filter(e=>found.includes(e.id)).map(e=><label key={e.id} className="check"><input type="checkbox" checked={checked.includes(e.id)} onChange={x=>setChecked(prev=>x.target.checked?[...prev,e.id]:prev.filter(id=>id!==e.id))}/>{e.id} · {e.title}</label>)}</div><label htmlFor="motive">МОТИВ</label><textarea id="motive" value={motive} onChange={e=>setMotive(e.target.value)} placeholder="Обоснови предполагаемия мотив..." maxLength={1200}/><label htmlFor="sequence">ХРОНОЛОГИЯ И ВЪЗМОЖНОСТ</label><textarea id="sequence" value={sequence} onChange={e=>setSequence(e.target.value)} placeholder="Свържи събитията по време..." maxLength={1200}/><button className="primary" disabled={!session||busy||checked.length<3||motive.trim().length<12||sequence.trim().length<12} onClick={accuse}>Предай заключението →</button>{verdict&&<div className={'verdict '+verdict.status} role="status"><strong>{verdict.title}</strong><p>{verdict.explanation}</p></div>}</div></>}
 </main><section className="inspector"><span className="mono gold">ПОЛЕВО ДОСИЕ</span><h3>Инспектор</h3><div className="inspector-art">{selected?.icon||'⌖'}</div><div className="mono gold">{selected?.id||'НЕИЗБРАН ОБЕКТ'}</div><h2>{selected?.title||'Избери улика'}</h2><p className="muted">{selected?.detail||'Прегледай обектите в апартамент 407 или в криминалистичното бюро.'}</p><div className="inspector-foot"><span>СТАТУС</span><strong>{selected?(found.includes(selected.id)?'ОТКРИТО':'НЕОТКРИТО'):'—'}</strong></div>{selected&&<button className="secondary" onClick={()=>{setView('interview');setPresent(selected.id)}} disabled={!found.includes(selected.id)}>Предяви при разпит ↗</button>}</section></div></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
