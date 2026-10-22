import {DirectorPortrait} from './Director12';
import {ObjectArt,roomAsset} from './sceneArt';
import { useEffect, useRef, useState } from 'react';
import { Award, BellRing, BookOpen, Camera, CheckCircle2, ChevronRight, FileImage, FolderOpen, Headphones, LockKeyhole, Mail, MapPin, MessageCircle, Mic2, Minus, Phone, Plus, Search, Smartphone, Sparkles, Star, UserRound, Volume2, VolumeX, X } from 'lucide-react';
import './cinematic.css';
import {useLanguage} from './i18n';
type RecordEntry={id:string;app:string;from:string;time:string;title:string;preview:string;available:boolean;opened:boolean;detail:string|null};
type Persona={id:string;name:string;role:string;initials:string;tint:string;mood:string};
type Choice={id:string;personId:string;label:string;available:boolean;done:boolean;needs:readonly string[]};
type Locality={id:string;title:string;chapter:number;detail:string;clues:readonly string[];available:boolean;visited:boolean};
type StoryChoice={id:string;title:string;description:string;available:boolean;done:boolean};
type Profile={total:number;level:number;next:number;evidence:number;solved:number;interviews:number;deductions:number;challenges:number;visits:number;choices:number;achievements:string[]};
type Cinematic={phone:RecordEntry[];recovered:boolean;recoverAvailable:boolean;personas:Persona[];choices:Choice[];lastLines:{id:string;personId:string;line:string;mood:string}[];case2:{chapter:number;found:string[];verdict:string|null;locations:Locality[];choices:StoryChoice[];consequences:string[]};profile:Profile};
type Section='world'|'people'|'phone'|'case2'|'profile';
const menu:[Section,string,typeof Camera][]=[['world','Кинематографичен оглед',Camera],['people','Живи персонажи',UserRound],['phone','Телефон на Никола',Smartphone],['case2','Изчезналият архив',FolderOpen],['profile','Моят детектив',Award]];
async function api<T>(session:string,path:string,method='GET',body?:unknown):Promise<T>{
 const res=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{method,headers:{'Content-Type':'application/json','x-case-session':session},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Заявката не е успешна.');return data as T;
}
function Portrait({person,mood,large=false}:{person:Persona;mood?:string;large?:boolean}){
 const state=mood||person.mood||'neutral';
 return <div className={'cin-portrait '+person.tint+(large?' large':'')+' '+state}><DirectorPortrait id={person.id} mood={state} compact={!large}/></div>;
}
function AmbientControls(){
 const {t}=useLanguage();
 const [running,setRunning]=useState(false),[level,setLevel]=useState(24);
 const audio=useRef<{ctx:AudioContext;noise:AudioBufferSourceNode;gain:GainNode;timer:number|null}|null>(null);
 const end=()=>{
  const current=audio.current;if(!current)return;
  try{current.noise.stop();current.ctx.close();}catch{}
  if(current.timer!==null)window.clearInterval(current.timer);
  audio.current=null;setRunning(false);
 };
 useEffect(()=>()=>{const current=audio.current;if(current){try{current.noise.stop();void current.ctx.close();}catch{}if(current.timer!==null)window.clearInterval(current.timer);audio.current=null;}},[]);
 useEffect(()=>{if(audio.current)audio.current.gain.gain.setTargetAtTime(level/450,audio.current.ctx.currentTime,.06);},[level]);
 const play=async()=>{
  if(audio.current){end();return;}
  try{
   const ctx=new AudioContext(),len=ctx.sampleRate*3,buffer=ctx.createBuffer(1,len,ctx.sampleRate);
   const source=buffer.getChannelData(0);for(let i=0;i<len;i++)source[i]=(Math.random()*2-1)*.34;
   const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=410;gain.gain.value=level/450;
   noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);noise.start();
   audio.current={ctx,noise,gain,timer:null};setRunning(true);
  }catch{setRunning(false);}
 };
 const cue=(kind:'step'|'door'|'phone'|'tension')=>{
  try{
   const ctx=new AudioContext(),start=ctx.currentTime;
   const tone=(frequency:number,when:number,duration:number,volume:number,shape:OscillatorType='sine')=>{
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type=shape;oscillator.frequency.setValueAtTime(frequency,start+when);
    gain.gain.setValueAtTime(.0001,start+when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*(level/100)),start+when+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,start+when+duration);
    oscillator.connect(gain).connect(ctx.destination);oscillator.start(start+when);oscillator.stop(start+when+duration+.02);
   };
   if(kind==='step'){tone(85,0,.16,.18,'triangle');tone(69,.34,.19,.22,'triangle');}
   if(kind==='door'){tone(117,0,.42,.15,'sawtooth');tone(75,.2,.31,.12,'triangle');}
   if(kind==='phone'){for(let i=0;i<3;i++){tone(630,i*.35,.19,.12);tone(790,i*.35+.18,.15,.1);}}
   if(kind==='tension'){tone(78,0,1.4,.09,'sawtooth');tone(83,.18,1.1,.07,'sine');}
   window.setTimeout(()=>void ctx.close(),2200);
  }catch{}
 };
  return <div className="cin-audio"><div><Headphones size={18}/><span><strong>{t("Атмосфера: дъжд")}</strong><small>{t("Генериран звуков фон, без външни файлове")}</small></span></div><div className="cin-audio-actions"><input type="range" aria-label={t("Сила на дъжда")} min="0" max="100" value={level} onChange={e=>setLevel(Number(e.target.value))}/><button type="button" onClick={()=>void play()} aria-label={running?'Спри звука':'Пусни дъжда'}>{running?<VolumeX size={18}/>:<Volume2 size={18}/>} {running?'Спри':'Пусни'}</button></div><div className="cin-cues"><span>{t("СЦЕНИЧНИ ЕФЕКТИ")}</span><button type="button" onClick={()=>cue('step')}>{t("Стъпки")}</button><button type="button" onClick={()=>cue('door')}>{t("Врата")}</button><button type="button" onClick={()=>cue('phone')}>{t("Телефон")}</button><button type="button" onClick={()=>cue('tension')}>{t("Напрежение")}</button></div></div>;
}
function Scene25D(){
 const {t}=useLanguage();
 const [room,setRoom]=useState(0),[zoom,setZoom]=useState(1),[tilt,setTilt]=useState({x:0,y:0}),[selected,setSelected]=useState('');
 const rooms=[
  {id:'living',title:'Всекидневна',sub:'Мястото на първия оглед',points:[{name:'Телефон на масата',asset:'phone',x:67,y:75},{name:'Прозорец към двора',asset:'',x:20,y:37},{name:'Оставена папка',asset:'papers',x:46,y:74}]},
  {id:'desk',title:'Кабинет',sub:'Служебни материали и бележки',points:[{name:'Заключено чекмедже',asset:'drawer',x:76,y:72},{name:'Разпилени листове',asset:'papers',x:50,y:70},{name:'Настолна лампа',asset:'lamp',x:66,y:44}]},
  {id:'entrance',title:'Антре',sub:'Вход и следи от придвижване',points:[{name:'Изтривалка',asset:'doormat',x:49,y:82},{name:'Входна врата',asset:'',x:50,y:35},{name:'Ключалка',asset:'terminal',x:64,y:49}]}
 ];
 const active=rooms[room];
 return <div className="cin-world">
  <div className="cin-scene-tabs">{rooms.map((r,i)=><button className={room===i?'active':''} key={i} onClick={()=>{setRoom(i);setSelected('');}} type="button"><MapPin size={15}/><strong>{t(r.title)}</strong><small>{t(r.sub)}</small></button>)}</div>
  <div className="cin-stage" style={{backgroundImage:'url('+roomAsset(active.id)+')'}} onPointerMove={e=>{if(e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();setTilt({x:((e.clientX-r.left)/r.width-.5)*17,y:((e.clientY-r.top)/r.height-.5)*11});}}} onPointerLeave={()=>setTilt({x:0,y:0})}>
    <div className="cin-stage-top"><span><Camera size={14}/> SCENE 407 / {active.title}</span><span>2.5D · {zoom.toFixed(1)}×</span></div>
    <div className={'cin-depth room-'+room} style={{transform:'perspective(900px) rotateX('+(14-tilt.y/2)+'deg) rotateY('+tilt.x+'deg) scale('+zoom+')'}}>
     <div className="cin-depth-wall"/><div className="cin-depth-floor"/><div className="cin-depth-window"/><div className="cin-depth-furn a"/><div className="cin-depth-furn b"/><div className="cin-depth-furn c"/><div className="cin-depth-furn d"/>
    </div>
    <div className="cin-stage-points">{active.points.map(p=><button type="button" className={selected===p.name?'active':''} style={{left:p.x+'%',top:p.y+'%'}} key={p.name} onClick={()=>setSelected(p.name)} aria-label={'Огледай '+p.name}>{p.asset?<ObjectArt asset={p.asset} alt={p.name}/>:<Search size={15}/>}<span>{p.name}</span></button>)}</div>
    <div className="cin-stage-bottom"><div>{selected?<><CheckCircle2 size={15}/>{selected} — използвай основния оглед за събиране на улики</>:<><Sparkles size={15}/>{t("Движи показалеца, приближавай и оглеждай средата")}</>}</div><div className="cin-zoom"><button type="button" onClick={()=>setZoom(v=>Math.max(.85,+(v-.1).toFixed(2)))} aria-label={t("Отдалечи")}><Minus size={16}/></button><button type="button" onClick={()=>setZoom(v=>Math.min(1.45,+(v+.1).toFixed(2)))} aria-label={t("Приближи")}><Plus size={16}/></button></div></div>
  </div>
  <AmbientControls/>
  <p className="cin-disclaimer">{t("Сцената е интерактивна 2.5D визуализация на вече съществуващите помещения; уликите се събират чрез основния модул „Интерактивно разследване“.")}</p>
 </div>;
}
export function CinematicCenter({session,found}:{session:string;found:string[]}){
 const {t}=useLanguage();
 const [view,setView]=useState<Section>('world'),[data,setData]=useState<Cinematic|null>(null);
 const [person,setPerson]=useState('martin'),[phoneApp,setPhoneApp]=useState('messages'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [activeRecord,setActiveRecord]=useState(''),[fragment,setFragment]=useState(''),[line,setLine]=useState(''),[typed,setTyped]=useState('');
 const [profile,setProfile]=useState<Profile|null>(null);
 const showPhone=['messages','mail','calls','photos','notes'];
 async function refresh(){if(!session)return;try{const v=await api<Cinematic>(session,'/cinematic');setData(v);setProfile(await api<Profile>(session,'/profile'));}catch(e){setNotice(e instanceof Error?e.message:String(e));}}
 useEffect(()=>{setData(null);void refresh();},[session,found.join(',')]);
 useEffect(()=>{setTyped('');if(!line)return;let t=0;const task=window.setInterval(()=>{t+=2;setTyped(line.slice(0,t));if(t>=line.length)window.clearInterval(task);},22);return()=>window.clearInterval(task);},[line]);
 async function act(kind:string,values:Record<string,unknown>){if(!session||busy)return;setBusy(true);setNotice('');try{const r=await api<{message:string;progress:Cinematic}>(session,'/cinematic/action','POST',{kind,...values});setData(r.progress);setNotice(r.message);if(kind==='dialogue')setLine(r.message);setProfile(await api<Profile>(session,'/profile'));}catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 const current=data?.personas.find(p=>p.id===person),cards=data?.phone.filter(p=>p.app===phoneApp)||[];
 const currentRecord=data?.phone.find(p=>p.id===activeRecord);
 const choices=data?.choices.filter(c=>c.personId===person)||[];
 return <div className="cin-root">
  <div className="cin-nav">{menu.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>{setView(id);setNotice('');}} className={view===id?'active':''}><Icon size={17}/>{label}</button>)}</div>
  {notice&&<div className="cin-notice" role="status"><BellRing size={16}/><span>{t(notice)}</span><button type="button" onClick={()=>setNotice('')} aria-label={t("Затвори")}><X size={16}/></button></div>}
  {!session?<div className="cin-placeholder">{t("Първо започни игрова сесия от основното досие.")}</div>:!data?<div className="cin-placeholder">{t("Зареждане на CASEFILES 0.8...")}</div>:<>
  {view==='world'&&<><div className="cin-intro"><span>CASEFILES 0.8 / REAL-TIME DEPTH</span><h2>{t("Местопрестъпление 407")}</h2><p>{t("Триизмерна перспектива, паралакс, увеличение и атмосфера за по-кинематографичен оглед.")}</p></div><Scene25D/></>}
  {view==='people'&&<><div className="cin-intro"><span>INTERACTIVE CHARACTER STAGE</span><h2>{t("Лица и реакции")}</h2><p>{t("Решенията се запазват; необосновано обвинение може да затвори цял разговор.")}</p></div><div className="cin-person-grid">{data.personas.map(p=><button type="button" key={p.id} className={'cin-person-choice '+(person===p.id?'active':'')} onClick={()=>{setPerson(p.id);setLine('');}}><Portrait person={p}/><strong>{p.name}</strong><small>{p.role}</small></button>)}</div><div className="cin-interrogation">{current&&<Portrait person={current} large/>}<div className="cin-dialogue"><div className="cin-dialogue-head"><Mic2 size={17}/><span>РАЗПИТ / {current?.name.toUpperCase()}</span><span>{current?.mood.toUpperCase()}</span></div><div className="cin-typewriter">{typed||data.lastLines.filter(l=>l.personId===person).slice(-1)[0]?.line||'Избери въпрос. Персонажът ще реагира на поведението ти.'}</div><div className="cin-choice-list">{choices.map(c=><button type="button" key={c.id} disabled={!c.available||c.done||busy} onClick={()=>void act('dialogue',{id:c.id})}><span>{c.done?'ПРОВЕДЕН':c.available?'ИЗБОР':'ЗАКЛЮЧЕН'}</span>{c.label}<ChevronRight size={15}/></button>)}</div></div></div></>}
  {view==='phone'&&<><div className="cin-intro"><span>DIGITAL EVIDENCE / PERSONAL DEVICE</span><h2>{t("Телефонът на Никола")}</h2><p>{t("Разследвай разговори, имейли, снимки, обаждания и бележки. Скритото съдържание изисква доказателства.")}</p></div><div className="cin-phone-layout"><div className="cin-phone"><div className="cin-phone-notch"/><div className="cin-phone-status"><span>01:17</span><span>▮▮▯ 78%</span></div><div className="cin-phone-title">{({messages:'Съобщения',mail:'Имейли',calls:'Обаждания',photos:'Снимки',notes:'Бележки'} as Record<string,string>)[phoneApp]}</div><div className="cin-phone-apps">{showPhone.map(app=><button key={app} onClick={()=>{setPhoneApp(app);setActiveRecord('');}} className={phoneApp===app?'active':''} title={app}>{app==='messages'?<MessageCircle size={17}/>:app==='mail'?<Mail size={17}/>:app==='calls'?<Phone size={17}/>:app==='photos'?<Camera size={17}/>:<BookOpen size={17}/>}</button>)}</div><div className="cin-phone-list">{cards.map(p=><button type="button" key={p.id} className={p.id===activeRecord?'active':''} disabled={!p.available} onClick={()=>{setActiveRecord(p.id);void act('phone',{id:p.id});}}><span className="cin-phone-icon">{p.available?<MessageCircle size={17}/>:<LockKeyhole size={17}/>}</span><span><strong>{p.title}</strong><small>{p.available?p.preview:'Заключен архив — необходими улики'}</small></span><em>{p.time}</em></button>)}</div></div><div className="cin-phone-details"><h3>{currentRecord?.title||'Избери материал'}</h3><span>{currentRecord?currentRecord.from+' · '+currentRecord.time:'CASEFILES / DEVICE 001'}</span><p>{currentRecord?.detail||'Материалите, които можеш да анализираш, зависят от откритите доказателства.'}</p><div className="cin-recover"><strong><FileImage size={16}/>{t("Възстанови изтрит фрагмент")}</strong><p>{t("Подреди трите цифри от разкъсания номер на апартамента.")}</p><input aria-label={t("Възстановен номер на апартамента")} maxLength={3} placeholder="___" value={fragment} onChange={e=>setFragment(e.target.value.replace(/\D/g,'').slice(0,3))}/><button type="button" className="primary" disabled={!data.recoverAvailable||data.recovered||fragment.length!==3||busy} onClick={()=>void act('recover',{answer:fragment})}>{data.recovered?'Фрагментът е възстановен':'Потвърди реконструкцията'}</button></div></div></div></>}
  {view==='case2'&&<><div className="cin-intro"><span>CASE #002 / STORY EXPANSION</span><h2>{t("Изчезналият архив")}</h2><p>{t("Собствени локации, три глави и сюжетни избори. Уликите се събират от „Живо разследване“ → „Библиотека със случаи“.")}</p></div><div className="cin-chapter-progress">{[0,1,2].map(i=><div key={i} className={data.case2.chapter>=i?'available':''}><span>ГЛАВА {i+1}</span><strong>{['Нощната смяна','Сервизният коридор','Липсващият договор'][i]}</strong></div>)}</div><div className="cin-localities">{data.case2.locations.map((l,i)=><button type="button" key={l.id} disabled={!l.available||busy} onClick={()=>void act('location',{id:l.id})} className={'cin-locality locality-'+i+(l.visited?' visited':'')}><MapPin size={23}/><span>CHAPTER {l.chapter+1}</span><strong>{l.title}</strong><small>{l.available?l.detail:'Локацията още не е отключена'}</small></button>)}</div><h3 className="cin-subhead">{t("Историята се разклонява")}</h3><div className="cin-paths">{data.case2.choices.map(c=><button type="button" key={c.id} disabled={!c.available||c.done||busy} onClick={()=>void act('branch',{id:c.id})}><span>{c.done?'ИЗБРАН ПЪТ':c.available?'ВЗЕМИ РЕШЕНИЕ':'НУЖНИ ДОКАЗАТЕЛСТВА'}</span><strong>{c.title}</strong><small>{c.description}</small></button>)}</div>{data.case2.consequences.length>0&&<p className="cin-disclaimer">Последствия: {data.case2.consequences.join(' · ')}</p>}</>}
  {view==='profile'&&<><div className="cin-intro"><span>CAREER / PERSONAL DOSSIER</span><h2>{t("Профил на детектива")}</h2><p>{t("Статистика и XP, изчислени от действителните действия по разследванията.")}</p></div><div className="cin-profile-hero"><div className="cin-profile-medal"><Award size={47}/></div><div><span>CASEFILES INVESTIGATOR</span><h2>Детектив · Ниво {profile?.level||1}</h2><strong>{profile?.total||0} XP</strong><div className="cin-xp"><span style={{width:(((profile?.total||0)%250)/250*100)+'%'}}/></div><small>Следващо ниво след още {250-(profile?.total||0)%250} XP</small></div></div><div className="cin-stat-grid">{[['Улики',profile?.evidence],['Разрешени случаи',profile?.solved],['Разпити',profile?.interviews],['Логически връзки',profile?.deductions],['Предизвикателства',profile?.challenges],['Посетени места',profile?.visits],['Сюжетни избори',profile?.choices]].map(([name,value])=><div key={String(name)}><strong>{value??0}</strong><span>{name}</span></div>)}</div><h3 className="cin-subhead">{t("Постижения")}</h3><div className="cin-achievements">{profile?.achievements.length?profile.achievements.map(a=><span key={a}><Star size={15}/>{a}</span>):<span>{t("Първото постижение ще се появи след откриване на улика.")}</span>}</div></>}
  </>}
 </div>;
}
