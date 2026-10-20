import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Clapperboard,FileSearch,Film,Play,ScanSearch,SkipForward,Volume2,VolumeX,X} from 'lucide-react';
import './director12.css';
type CaseId='case-001'|'case-002';
type Beat={id:string;title:string;kicker:string;line:string;room:string;cue:string;watched:boolean};
type Choice={id:string;label:string;effect:string;available:boolean;chosen:boolean;positive:boolean};
type Director={chapter:number;total:number;beats:Beat[];next:Beat|null;decisions:Choice[];lastDecision:string|null;mood:'quiet'|'rising'|'tense';endState:string;evidenceCount:number};
async function api<T>(session:string,caseId:CaseId,action?:unknown):Promise<T>{
 const r=await fetch((import.meta.env.VITE_API_URL||'')+'/api/director12/'+caseId+(action?'/action':''),{method:action?'POST':'GET',headers:{'Content-Type':'application/json','x-case-session':session},...(action?{body:JSON.stringify(action)}:{})});
 const out=await r.json();if(!r.ok)throw new Error(out.error||'Неуспешен сюжетен избор.');return out as T;
}
const profile={
 martin:{name:'Мартин Русев',subtitle:'Колега на Никола',skin:'#a98262',jacket:'#4d5651',hair:'#332e2b',eye:'#282c29',facial:'severe'},
 elena:{name:'Елена Вълчева',subtitle:'Последният разговор',skin:'#c49b80',jacket:'#514453',hair:'#372a31',eye:'#3f3437',facial:'soft'},
 petar:{name:'Петър Добрев',subtitle:'Съседът',skin:'#ac8a6d',jacket:'#62604d',hair:'#514339',eye:'#34312d',facial:'tired'},
 raya:{name:'Рая Милева',subtitle:'Нощна смяна',skin:'#c9a28b',jacket:'#465451',hair:'#392e30',eye:'#352c2c',facial:'soft'},
 boris:{name:'Борис Генов',subtitle:'Достъп до фонда',skin:'#b28a6c',jacket:'#424e61',hair:'#282725',eye:'#282a2b',facial:'severe'},
 teodor:{name:'Теодор Колев',subtitle:'Технически протокол',skin:'#be9475',jacket:'#555849',hair:'#3d332c',eye:'#30302f',facial:'tired'}
} as const;
export type CharacterId=keyof typeof profile;
export function DirectorPortrait({id,mood='neutral',compact=false}:{id:string;mood?:string;compact?:boolean}){
 const p=profile[id as CharacterId]||profile.martin;
 const urgent=mood==='angry'||mood==='nervous';
 return <div className={'d12-portrait '+(compact?'small ':'')+mood} aria-label={'Илюстриран портрет на '+p.name+', изражение '+mood} role="img">
  <svg viewBox="0 0 340 390" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id={'d12glow-'+id}><stop stopColor="#aa916e" stopOpacity=".6"/><stop offset="1" stopColor="#101b24" stopOpacity="0"/></radialGradient><linearGradient id={'d12face-'+id} x1="0" x2="1"><stop stopColor={p.skin}/><stop offset=".65" stopColor="#e2b796"/><stop offset="1" stopColor="#7d614f"/></linearGradient></defs>
  <rect width="340" height="390" fill="#14232b"/><circle cx="170" cy="139" r="159" fill={'url(#d12glow-'+id+')'}/><path d="M33 388Q56 264 139 267L201 267Q286 257 308 388Z" fill={p.jacket}/><path d="M128 269L170 324 218 268" fill="#e3d6c1" opacity=".55"/><path d="M149 238H189V308Q170 324 151 304Z" fill={p.skin}/><path d="M107 108Q109 55 170 53Q238 49 239 116L234 210Q223 251 175 261Q125 250 109 205Z" fill={'url(#d12face-'+id+')'} stroke="#4f403a" strokeWidth="3"/>
  <path d={p.facial==='soft'?'M91 134Q78 49 171 42Q258 42 247 148Q225 95 210 82Q150 117 99 105Z':'M103 124Q91 59 143 45Q236 27 244 121L216 84Q156 93 103 124Z'} fill={p.hair}/><path d="M107 145L92 130V176" fill={p.hair}/><path d="M236 130L247 139V171" fill={p.hair}/>
  <path d={urgent?'M131 149L156 156M185 156L210 148':'M130 150L157 147M184 148L210 151'} stroke={p.hair} strokeWidth="6" strokeLinecap="round" fill="none"/>
  <ellipse cx="144" cy="169" rx="8" ry="5" fill={p.eye}/><ellipse cx="197" cy="169" rx="8" ry="5" fill={p.eye}/><path d="M171 174L166 211L180 212" fill="none" stroke="#805d4f" strokeWidth="4"/>
  <path d={mood==='angry'?'M151 230L189 227':mood==='sad'?'M152 233Q170 221 190 235':mood==='nervous'?'M152 233Q166 238 190 231':'M152 230Q172 234 191 229'} fill="none" stroke="#774e4c" strokeWidth="4" strokeLinecap="round"/>
  {id==='petar'&&<path d="M131 193Q143 205 156 195M184 196Q198 205 211 195" fill="none" stroke="#6f5549" strokeWidth="3" opacity=".65"/>}
  {id==='elena'||id==='raya'?<path d="M105 110Q82 191 99 284L129 250L122 119M238 110Q267 200 252 291L217 248L225 124" fill={p.hair} opacity=".94"/>:null}
  <path d="M40 340Q172 297 299 345" stroke="#d5b17c" strokeOpacity=".32" strokeWidth="1" fill="none"/></svg>
  <div className="d12-portrait-label"><strong>{p.name}</strong><small>{p.subtitle} · {mood.toUpperCase()}</small></div>
 </div>;
}
export function DirectorStage12({session,caseId,found,room,onRoom}:{session:string;caseId:CaseId;found:string[];room:string;onRoom:(room:string)=>void}){
 const [data,setData]=useState<Director|null>(null),[playing,setPlaying]=useState<Beat|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [voiceOn,setVoiceOn]=useState(false);
 const ctx=useRef<AudioContext|null>(null);
 const ambience=useRef<{ctx:AudioContext;tones:OscillatorNode[]}|null>(null);
 useEffect(()=>{
  if(!voiceOn)return;
  let soundtrack:{ctx:AudioContext;tones:OscillatorNode[]}|null=null;
  try{
   const audio=new AudioContext(),tones:OscillatorNode[]=[];
   const mood=data?.mood||'quiet',base=mood==='tense'?48:mood==='rising'?62:55;
   for(const [index,multiplier] of [1,1.5,2].entries()){
    const osc=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();
    osc.type=index===0?'sine':'triangle';osc.frequency.value=base*multiplier;
    filter.type='lowpass';filter.frequency.value=mood==='tense'?180:330;
    gain.gain.value=index===0?.008:.0025;
    osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start();tones.push(osc);
   }
   soundtrack={ctx:audio,tones};ambience.current=soundtrack;
  }catch{}
  return()=>{if(soundtrack){soundtrack.tones.forEach(o=>{try{o.stop();}catch{}});void soundtrack.ctx.close();if(ambience.current===soundtrack)ambience.current=null;}};
 },[voiceOn,data?.mood]);
 const tick=useCallback((cue:string)=>{
  if(!voiceOn)return;
  try{const audio=ctx.current&&ctx.current.state!=='closed'?ctx.current:new AudioContext();ctx.current=audio;
   const osc=audio.createOscillator(),gain=audio.createGain();
   osc.type=cue==='signal'?'sine':'triangle';osc.frequency.value=cue==='resolution'?520:cue==='confrontation'?120:260;
   gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.06,audio.currentTime+.035);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.54);
   osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.55);
  }catch{}
 },[voiceOn]);
 useEffect(()=>()=>{if(ctx.current)void ctx.current.close();},[]);
 const refresh=async()=>{if(!session)return;try{setData(await api<Director>(session,caseId));}catch{}};
 useEffect(()=>{setData(null);setPlaying(null);void refresh();},[session,caseId,found.join(',')]);
 const act=async(action:unknown)=>{setBusy(true);setNotice('');try{
  const result=await api<{message:string;story:Director}>(session,caseId,action);
  setData(result.story);setNotice(result.message);
 }catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const chooseScene=(b:Beat)=>{setPlaying(b);tick(b.cue);};
 const closeScene=()=>{if(playing&&!playing.watched)void act({kind:'scene',id:playing.id});setPlaying(null);};
 return <section className="d12-director" aria-label="Режисьорски сюжетни сцени"><div className="d12-stage-heading"><div><span>CASEFILES 1.2 / DIRECTOR'S CUT</span><h3>Сюжетен режисьор</h3><p>Следващите сцени се отключват от реалния напредък, не от часовник или платен AI.</p></div><button type="button" onClick={()=>setVoiceOn(v=>!v)} aria-label={voiceOn?'Изключи сценичния звук':'Включи сценичния звук'}>{voiceOn?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></div>
  <div className={'d12-chapter-track '+(data?.mood||'quiet')}>{data?.beats.map((beat,i)=><button type="button" key={beat.id} className={beat.watched?'seen':''} onClick={()=>chooseScene(beat)}><span>{String(i+1).padStart(2,'0')} · {beat.kicker}</span><strong>{beat.title}</strong><small>{beat.watched?'ПРЕГЛЕДАНА':beat.room===room?'ТУК':'ПРЕГЛЕДАЙ СЦЕНАТА'}</small></button>)}</div>
  {data?.next&&<div className="d12-next"><Film size={20}/><span><strong>Нова сцена: {data.next.title}</strong><small>{data.next.line}</small></span><button type="button" onClick={()=>chooseScene(data.next!)}>Гледай <Play size={15}/></button></div>}
  {data?.decisions.some(c=>c.available||c.chosen)&&<div className="d12-decisions"><h4>Решения с последствия</h4><div>{data.decisions.filter(c=>c.available||c.chosen).map(choice=><button type="button" key={choice.id} disabled={busy||choice.chosen||!choice.available} onClick={()=>{tick(choice.positive?'discovery':'confrontation');void act({kind:'choose',id:choice.id});}}><span>{choice.chosen?'ИЗБРАН ПЪТ':'ТВОЙ ИЗБОР'}</span><strong>{choice.label}</strong><small>{choice.chosen?choice.effect:'Едно решение може да затвори другия маршрут.'}</small></button>)}</div></div>}
  {notice&&<p className="d12-notice" role="status">{notice}</p>}
  {playing&&<div className="d12-cinema" role="dialog" aria-label="Кинематографична сцена"><div className="d12-cinema-room" style={{backgroundImage:'url(/art/rooms/'+playing.room+'.svg)'}}/><div className="d12-cinema-shadow"/><div className="d12-cinema-copy"><span><Clapperboard size={18}/> {playing.kicker} / {caseId.toUpperCase()}</span><h2>{playing.title}</h2><p>{playing.line}</p><div><button type="button" onClick={()=>{onRoom(playing.room);closeScene();}}><ArrowRight size={17}/> Продължи историята</button><button type="button" onClick={closeScene}><SkipForward size={17}/> Затвори сцената</button></div></div></div>}
 </section>;
}
const props=[
 {key:'phone',label:'Телефон',line:'Дисплеят пази последния изходящ разговор. Огледай и задния капак.',art:'phone'},
 {key:'documents',label:'Финансова папка',line:'Документите са подготвени за проверка на оригинални фактури.',art:'documents'},
 {key:'negative',label:'Фото негатив',line:'При по-силна светлина можеш да различиш контурите на папка.',art:'negative'},
 {key:'key',label:'Месингов ключ',line:'Малък предмет с три протрити зъба. На металната повърхност има драскотини.',art:'key'},
 {key:'archive',label:'Архивен протокол',line:'Подпис, дата и поле за резервен ключ. Часовете трябва да бъдат сравнявани внимателно.',art:'archive'},
 {key:'film',label:'Кадър от охранителна камера',line:'Силует с калъф. Сами по себе си пикселите не установяват самоличност.',art:'film'}
] as const;
export function Closeup12({item,close,onAction}:{item:string;close:()=>void;onAction?:()=>void}){
 const p=props.find(x=>x.key===item)||props[0];const [angle,setAngle]=useState(0),[zoom,setZoom]=useState(1);
 return <div role="dialog" aria-label="Детайлен оглед на предмет" className="d12-closeup"><div className="d12-closeup-header"><span><ScanSearch size={18}/> EXAMINE · {p.label}</span><button onClick={close} type="button" aria-label="Затвори близкия план"><X size={19}/></button></div><div className={'d12-prop '+p.art} style={{transform:'perspective(700px) rotateY('+angle+'deg) scale('+zoom+')'}}><div className="d12-prop-visual"><div className="d12-prop-outline"/><span>{p.label.toUpperCase()}</span><small>PROPERTY / FORENSICS 01</small></div></div><p>{p.line}</p><div className="d12-prop-controls"><label>Завъртане {angle}°<input type="range" min="-180" max="180" step="15" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label><label>Zoom ×{zoom.toFixed(1)}<input type="range" min="1" max="1.5" step=".1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label></div><div className="d12-closeup-actions"><button type="button" onClick={close}><ArrowLeft size={16}/> Назад</button>{onAction&&<button type="button" onClick={()=>{onAction();close();}}><FileSearch size={16}/> Към анализа</button>}</div></div>;
}
