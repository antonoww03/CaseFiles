import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CircleDot, Combine, Eye, Fingerprint,
  FolderSearch, KeyRound, LampDesk, LockKeyhole, MapPin, MessageSquareText,
  Minus, Plus, ScanSearch, Search, ShieldCheck, Terminal, X
} from 'lucide-react';
import './immersive.css';

type InventoryItem={id:string;title:string;detail:string;icon:string};
type ObjectInfo={id:string;room:string;title:string;summary:string;x:number;y:number;inspected:boolean;locked:boolean;requiresItem:string|null};
type Dialogue={id:string;personId:string;label:string;available:boolean;done:boolean;needs:readonly string[]};
type ImmersiveData={
  rooms:{id:string;title:string;subtitle:string}[];
  objects:ObjectInfo[];
  inventory:InventoryItem[];
  combinations:{id:string;title:string;result:string}[];
  dial:{id:string;name:string;kind:string;hint:string;unlocked:boolean;solved:boolean};
  trust:Record<string,number>;
  dialogues:Dialogue[];
  history:{personId:string;choiceId:string;reply:string;at:string}[];
  terminalSearches:number;
};
type SearchResult={id:string;category:string;title:string;body:string;requires:readonly string[]};
const people:{id:string;name:string;initials:string}[]=[
  {id:'martin',name:'Мартин Русев',initials:'МР'},
  {id:'elena',name:'Елена Вълчева',initials:'ЕВ'},
  {id:'petar',name:'Петър Добрев',initials:'ПД'}
];
const sections=[
  {id:'scene',name:'Интерактивен оглед',icon:ScanSearch},
  {id:'puzzle',name:'Обектови пъзели',icon:Fingerprint},
  {id:'dialogue',name:'Разклонени разпити',icon:MessageSquareText},
  {id:'computer',name:'Полицейски компютър',icon:Terminal}
] as const;
async function request<T>(session:string,path:string,method='GET',body?:unknown):Promise<T>{
  const r=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{
    method,headers:{'Content-Type':'application/json','x-case-session':session},
    ...(body===undefined?{}:{body:JSON.stringify(body)})
  });
  const data=await r.json();
  if(!r.ok)throw new Error(data.error||'Операцията не успя.');
  return data;
}
function ItemIcon({icon}:{icon:string}){
  return icon==='key'?<KeyRound size={20}/>:
  icon==='light'?<LampDesk size={20}/>:
  icon==='image'?<Eye size={20}/>:
  icon==='file'?<BookOpen size={20}/>:<Search size={20}/>;
}
export function ImmersiveInvestigation({session,found}:{session:string;found:string[]}){
  const [data,setData]=useState<ImmersiveData|null>(null);
  const [section,setSection]=useState<(typeof sections)[number]['id']>('scene');
  const [room,setRoom]=useState('hall');
  const [selected,setSelected]=useState<string[]>([]);
  const [digits,setDigits]=useState([0,0,0]);
  const [person,setPerson]=useState('martin');
  const [search,setSearch]=useState('');
  const [results,setResults]=useState<SearchResult[]|null>(null);
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [focusObject,setFocusObject]=useState<ObjectInfo|null>(null);
  const [rotation,setRotation]=useState(0);
  async function load(){
    if(!session){setData(null);return;}
    try{const snapshot=await request<ImmersiveData>(session,'/immersive');setData(snapshot);}
    catch(e){setNotice(e instanceof Error?e.message:String(e));}
  }
  useEffect(()=>{void load();},[session,found.join(',')]);
  async function act(kind:'inspect'|'combine'|'puzzle',values:Record<string,unknown>){
    if(!session||busy)return;
    setBusy(true);setNotice('');
    try{
      const result=await request<{message:string;progress:ImmersiveData}>(session,'/immersive/action','POST',{kind,...values});
      setData(result.progress);setNotice(result.message);
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function dialogue(choiceId:string){
    if(!session||busy)return;
    setBusy(true);setNotice('');
    try{
      const result=await request<{reply:string;progress:ImmersiveData}>(session,'/immersive/dialogue','POST',{choiceId});
      setData(result.progress);setNotice(result.reply);
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function computer(e:React.FormEvent){
    e.preventDefault();if(search.trim().length<2||!session||busy)return;
    setBusy(true);setNotice('');
    try{
      const result=await request<{results:SearchResult[];total:number;searches:number}>(session,'/immersive/computer/search','POST',{query:search});
      setResults(result.results);
      setData(d=>d?{...d,terminalSearches:result.searches}:d);
      if(!result.total)setNotice('Няма намерени достъпни записи. Някои данни се отключват с нови улики.');
    }catch(e){setNotice(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  const visible=data?.objects.filter(o=>o.room===room)||[];
  const currentRoom=data?.rooms.find(r=>r.id===room);
  const currentPerson=people.find(p=>p.id===person)!;
  const currentChoices=data?.dialogues.filter(d=>d.personId===person)||[];
  function choose(id:string){setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev.slice(-1),id]);}
  return <div className="im-root">
    <div className="im-tabs" role="group" aria-label="Избор на следствен инструмент">
      {sections.map(t=><button key={t.id} type="button" className={section===t.id?'active':''} onClick={()=>{setSection(t.id);setNotice('');}}>
        <t.icon size={18}/><span>{t.name}</span>
      </button>)}
    </div>
    {notice&&<div className="im-notice" role="status"><CircleDot size={17}/><span>{notice}</span><button aria-label="Затвори известието" type="button" onClick={()=>setNotice('')}><X size={16}/></button></div>}
    {!session?<div className="im-empty"><LockKeyhole size={30}/><strong>Необходимо е активно разследване</strong><p>Отвори досието и започни нов случай, за да използваш следствените инструменти.</p></div>:!data?<div className="im-empty">Зареждане на разследването...</div>:<>
    {section==='scene'&&<>
      <div className="im-intro"><div><span className="im-kicker">АПАРТАМЕНТ 407 / ИНТЕРАКТИВНА СРЕДА</span><h2>Изследвай всеки предмет</h2><p>Избери стая, натисни върху осветен обект и събери инструменти за следващите задачи.</p></div><span className="im-counter">{data.objects.filter(o=>o.inspected).length} / {data.objects.length} ОБЕКТА</span></div>
      <div className="im-rooms" role="group" aria-label="Стая за оглед">{data.rooms.map(r=><button key={r.id} type="button" onClick={()=>{setRoom(r.id);setFocusObject(null);}} className={room===r.id?'active':''}><MapPin size={17}/><strong>{r.title}</strong><small>{r.subtitle}</small></button>)}</div>
      <div className={'im-stage room-'+room}>
        <div className="im-stage-grid"/><div className="im-stage-wall"/>
        <div className="im-furniture one"/><div className="im-furniture two"/><div className="im-furniture three"/><div className="im-furniture four"/>
        <div className="im-stage-heading"><span><ScanSearch size={15}/> {currentRoom?.title.toUpperCase()}</span><span>CASE 001 / SCENE {data.rooms.findIndex(r=>r.id===room)+1}</span></div>
        {visible.map(o=><button key={o.id} type="button" style={{left:o.x+'%',top:o.y+'%'}} className={'im-hotspot '+(o.inspected?'done':'')} onClick={()=>{setFocusObject(o);setRotation(0);}} aria-label={'Разгледай '+o.title}><span>{o.inspected?<Check size={18}/>:<Plus size={18}/>}</span><small>{o.title}</small></button>)}
        <div className="im-stage-footer"><Eye size={15}/> Избери маркер, за да отвориш подробния оглед</div>
      </div>
      <div className="im-inventory-section"><div className="im-section-head"><BriefcaseBusiness size={19}/><div><h3>Инвентар на детектива</h3><p>Избери два предмета, за да провериш дали могат да се комбинират.</p></div></div>
        <div className="im-inventory">{data.inventory.length?data.inventory.map(item=><button type="button" key={item.id} className={selected.includes(item.id)?'selected':''} onClick={()=>choose(item.id)} title={item.detail}><span><ItemIcon icon={item.icon}/></span><strong>{item.title}</strong><small>{item.detail}</small></button>):<div className="im-placeholder">Разгледай помещенията, за да събереш предмети.</div>}</div>
        <div className="im-combine"><div><Combine size={17}/><strong>{selected.length?selected.join(' + '):'Избери два предмета'}</strong></div><button type="button" className="primary" disabled={selected.length!==2||busy} onClick={()=>void act('combine',{first:selected[0],second:selected[1]})}>Комбинирай <ArrowRight size={16}/></button></div>
      </div>
      {focusObject&&<div className="im-modal-backdrop" role="presentation" onClick={()=>setFocusObject(null)}>
        <div className="im-object-modal" role="dialog" aria-modal="true" aria-label={focusObject.title} onClick={e=>e.stopPropagation()}>
          <div className="im-object-header"><span className="im-kicker">ДЕТАЙЛЕН ОГЛЕД / ОБЕКТ</span><button type="button" aria-label="Затвори огледа" onClick={()=>setFocusObject(null)}><X size={20}/></button></div>
          <div className="im-object-render"><div style={{transform:'rotate('+rotation+'deg)'}} className={'im-inspect-icon '+(focusObject.id==='drawer'?'drawer':'')}><FolderSearch size={73} strokeWidth={1.2}/></div><div className="im-reticle"/></div>
          <h3>{focusObject.title}</h3><p>{focusObject.summary}</p>
          <div className="im-object-actions"><button className="secondary" type="button" onClick={()=>setRotation(v=>v-45)}><ChevronLeft size={17}/> Завърти</button><button className="secondary" type="button" onClick={()=>setRotation(v=>v+45)}>Завърти <ChevronRight size={17}/></button><button type="button" className="primary" disabled={busy||focusObject.locked} onClick={()=>{void act('inspect',{objectId:focusObject.id}).then(()=>setFocusObject(null));}}><Search size={16}/> Изследвай</button></div>
          {focusObject.locked&&<p className="im-warn"><LockKeyhole size={14}/> Необходимо е първо да откриеш съответната улика.</p>}
          {focusObject.requiresItem&&<p className="im-hint">Изисква: {focusObject.requiresItem}</p>}
        </div>
      </div>}
    </>}
    {section==='puzzle'&&<div className="im-column">
      <div className="im-intro"><div><span className="im-kicker">МЕХАНИЧНИ УСТРОЙСТВА / ДОКАЗАТЕЛСТВА</span><h2>Сейфът на бюрото</h2><p>Открий скрития код чрез комбиниране на предмети, после настрой трите циферблата.</p></div>{data.dial.solved&&<span className="im-state"><CheckCircle2 size={16}/> ОТВОРЕН</span>}</div>
      <div className="im-puzzle-layout">
        <div className="im-dial-frame"><div className="im-dial-top"><LockKeyhole size={26}/><span>SECURE / MODEL 407</span></div><div className="im-dials">{digits.map((digit,i)=><div key={i} className="im-dial"><button aria-label={'Увеличи цифра '+(i+1)} type="button" disabled={data.dial.solved} onClick={()=>setDigits(a=>a.map((v,j)=>i===j?(v+1)%10:v))}><Plus size={19}/></button><strong>{digit}</strong><button aria-label={'Намали цифра '+(i+1)} type="button" disabled={data.dial.solved} onClick={()=>setDigits(a=>a.map((v,j)=>i===j?(v+9)%10:v))}><Minus size={19}/></button></div>)}</div><button className="primary" type="button" disabled={!data.dial.unlocked||data.dial.solved||busy} onClick={()=>void act('puzzle',{puzzleId:'safe_dial',digits})}>{data.dial.solved?'Кутията е отворена':'Опитай комбинацията'} <KeyRound size={16}/></button></div>
        <div className="im-puzzle-help"><span className="im-kicker">ОТКРИТИ РЕЗУЛТАТИ</span><h3>Записки по задачата</h3><p>{data.dial.hint}</p>{data.combinations.map(c=><article key={c.id}><Check size={15}/><div><strong>{c.title}</strong><p>{c.result}</p></div></article>)}{!data.combinations.length&&<div className="im-placeholder">Нямаш още съвместени предмети. Върни се при инвентара.</div>}</div>
      </div>
    </div>}
    {section==='dialogue'&&<div className="im-column">
      <div className="im-intro"><div><span className="im-kicker">РАЗКЛОНЕНИ РАЗГОВОРИ / БЕЗ AI</span><h2>Изборите имат последствия</h2><p>Правилните въпроси повишават доверието. Необоснованите обвинения могат да блокират важни теми.</p></div></div>
      <div className="im-people">{people.map(p=><button type="button" key={p.id} className={person===p.id?'active':''} onClick={()=>setPerson(p.id)}><span>{p.initials}</span><strong>{p.name}</strong></button>)}</div>
      <div className="im-trust"><span><ShieldCheck size={17}/> Доверие на {currentPerson.name}</span><strong>{data.trust[person]??40}%</strong><div><span style={{width:(data.trust[person]??40)+'%'}}/></div></div>
      <div className="im-choices">{currentChoices.map(ch=><button type="button" key={ch.id} disabled={!ch.available||ch.done||busy} onClick={()=>void dialogue(ch.id)}><span>{ch.done?<CheckCircle2 size={17}/>:ch.available?<MessageSquareText size={17}/>:<LockKeyhole size={17}/>}</span><strong>{ch.label}</strong><small>{ch.done?'ПРОВЕДЕН':ch.available?'ПОПИТАЙ':'НЕДОСТЪПЕН'}</small></button>)}</div>
      <div className="im-transcript"><div className="im-section-head"><BookOpen size={18}/><div><h3>Развитие на разговора</h3><p>Последиците се запазват в игровата сесия.</p></div></div>{data.history.filter(h=>h.personId===person).map((h,i)=><article key={i}><span>ИЗБОР {i+1}</span><p>{h.reply}</p></article>)}{!data.history.some(h=>h.personId===person)&&<div className="im-placeholder">Няма проведен разговор с това лице.</div>}</div>
    </div>}
    {section==='computer'&&<div className="im-column">
      <div className="im-terminal">
        <div className="im-terminal-head"><span><Terminal size={19}/> МВР / ЛОКАЛНА СИМУЛАЦИЯ</span><span>ACCESS · CASE 001</span></div>
        <div className="im-terminal-body"><div className="im-console-lines"><p><span>casefiles@detective</span>:~$ search_records</p><p>Шифрован криминален архив · достъпните записи зависят от намерените улики.</p><p>Индекси: достъп, видео, телефон, финанси, медицина.</p></div>
        <form className="im-terminal-search" onSubmit={e=>void computer(e)}><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} minLength={2} maxLength={80} placeholder="Потърси: фактури, вход, камера..." aria-label="Търсене в полицейския архив"/><button className="primary" type="submit" disabled={!session||busy||search.trim().length<2}>Търси <ArrowRight size={15}/></button></form>
        <div className="im-terminal-results">{results?.map(record=><article key={record.id}><span>{record.category} / {record.id}</span><h3>{record.title}</h3><p>{record.body}</p><small>Потвърдено с {record.requires.join(', ')}</small></article>)}{results&&results.length===0&&<div className="im-placeholder">Няма съвпадение сред отключените записи.</div>}{!results&&<div className="im-placeholder">Започни търсене. Неоткритите записи няма да бъдат показани.</div>}</div></div>
      </div>
    </div>}
    </>}
  </div>;
}
