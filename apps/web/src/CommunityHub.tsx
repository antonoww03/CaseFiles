import { useEffect, useState } from 'react';
import { BookOpen, Check, ClipboardCopy, Compass, Crown, FilePlus2, Fingerprint, FolderOpen, RefreshCcw, Send, ShieldCheck, Users } from 'lucide-react';
import './community.css';

type StoryBrief={id:string;title:string;setting:string;briefing:string;author:string;clues:number};
type Clue={id:string;title:string;description:string|null;location:string;found:boolean;available:boolean};
type Room={id:string;kind:string;title:string;setting:string;briefing:string;clues:Clue[];suspects:{id:string;name:string;alibi:string}[];players:{name:string}[];found:string[];interviews:string[];attempts:number;verdict:string|null;solvedBy:string|null;ending:string|null};
type Profile={id:string;name:string;xp:number;level:number;completedCases:number;achievements:string[]};
type Editor={title:string;setting:string;briefing:string;suspects:{id:string;name:string;alibi:string}[];clues:{id:string;title:string;description:string;location:string}[];solution:{suspectId:string;clueIds:string[];explanation:string}};
type View='cases'|'room'|'editor'|'profile';
const base=(import.meta.env.VITE_API_URL||'')+'/api/community';
async function request<T>(path:string,method='GET',body?:unknown,headers?:Record<string,string>):Promise<T>{
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const payload=await response.json();
  if(!response.ok)throw Error(payload.error||'Заявката е неуспешна.');
  return payload as T;
}
const sampleEditor=():Editor=>({
  title:'Мистерията на нощния архив',setting:'Измислен музей в Русе',
  briefing:'В нощта на инвентаризацията от архива изчезва запечатан документ. Камерите са имали прекъсвания, а свидетелските показания се разминават. Разследвай кой има достъп и защо.',
  suspects:[
    {id:'ina',name:'Ина Петрова',alibi:'Останах на рецепцията до приключването на смяната.'},
    {id:'misho',name:'Михаил Колев',alibi:'Бях в склада и подготвях следващата доставка.'},
    {id:'nora',name:'Нора Георгиева',alibi:'Работех в административния офис през нощта.'}
  ],
  clues:[1,2,3,4,5].map(i=>({id:'C'+i,title:'Следа '+i,description:'Фиктивен архивен запис с номер '+i+' и значение за инцидента.',location:'Архив'})),
  solution:{suspectId:'misho',clueIds:['C1','C2','C3'],explanation:'Съпоставянето на трите записа разкрива несъответствие във времето, което свързва действията на заподозрения със случилото се в архива.'}
});

export function CommunityHub(){
  const [view,setView]=useState<View>('cases');
  const [nickname,setNickname]=useState('Детектив');
  const [stories,setStories]=useState<StoryBrief[]>([]);
  const [room,setRoom]=useState<Room|null>(null);
  const [roomCode,setRoomCode]=useState('');
  const [memberToken,setMemberToken]=useState('');
  const [profile,setProfile]=useState<Profile|null>(null);
  const [profileId,setProfileId]=useState(()=>localStorage.getItem('cf-community-profile')||'');
  const [joinCode,setJoinCode]=useState('');
  const [selectedSuspect,setSelectedSuspect]=useState('');
  const [selectedClues,setSelectedClues]=useState<string[]>([]);
  const [editor,setEditor]=useState<Editor>(sampleEditor);
  const [status,setStatus]=useState<'memory'|'postgres'|''>('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);

  async function loadStories(){try{setStories(await request<StoryBrief[]>('/stories'));}catch(e){setNotice(String(e));}}
  async function loadRoom(id:string){try{const found=await request<Room>('/rooms/'+encodeURIComponent(id));setRoom(found);setSelectedSuspect(prev=>prev||found.suspects[0]?.id||'');}catch(e){setNotice(e instanceof Error?e.message:String(e));}}
  async function loadProfile(id:string){try{setProfile(await request<Profile>('/profile/'+encodeURIComponent(id)));}catch{setProfile(null);}}
  useEffect(()=>{
    void loadStories();
    void request<{storage:'memory'|'postgres'}>('/status').then(s=>setStatus(s.storage)).catch(()=>{});
    const code=localStorage.getItem('cf-community-room'),member=localStorage.getItem('cf-community-member');
    if(code&&member){setRoomCode(code);setMemberToken(member);void loadRoom(code);}
    const id=localStorage.getItem('cf-community-profile');if(id)void loadProfile(id);
  },[]);
  useEffect(()=>{
    if(!roomCode||!memberToken)return;
    const timer=setInterval(()=>{void loadRoom(roomCode);},4000);
    return()=>clearInterval(timer);
  },[roomCode,memberToken]);
  async function perform<T>(fn:()=>Promise<T>,onDone:(v:T)=>void){
    setBusy(true);setNotice('');
    try{onDone(await fn());}catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  function enterRoom(data:{memberToken:string;room:Room}){
    setRoom(data.room);setRoomCode(data.room.id);setMemberToken(data.memberToken);setSelectedClues([]);
    setSelectedSuspect(data.room.suspects[0]?.id||'');
    localStorage.setItem('cf-community-room',data.room.id);
    localStorage.setItem('cf-community-member',data.memberToken);
    setView('room');setNotice('Свързан си със стая '+data.room.id+'.');
  }
  async function newRoom(kind:'case-002'|'random'|'community',storyId?:string){
    await perform(()=>request<{memberToken:string;room:Room}>('/rooms','POST',{kind,storyId,name:nickname,profileId}),enterRoom);
  }
  async function joinRoom(){
    await perform(()=>request<{memberToken:string;room:Room}>('/rooms/'+joinCode.trim().toUpperCase()+'/join','POST',{name:nickname}),enterRoom);
  }
  async function roomAction(action:'discover'|'interview'|'accuse',id:string){
    if(!room)return;
    await perform(()=>request<{room:Room;message:string;awarded:boolean}>('/rooms/'+room.id+'/action','POST',{action,id,...(action==='accuse'?{evidenceIds:selectedClues}:{})},{'x-room-member':memberToken,...(profileId?{'x-case-profile':profileId}:{})}),r=>{
      setRoom(r.room);setNotice(r.message+(r.awarded?' +100 XP към профила!':''));
      if(profileId)void loadProfile(profileId);
    });
  }
  async function createProfile(){
    await perform(()=>request<{id:string}>('/profile','POST',{name:nickname}),r=>{
      setProfileId(r.id);localStorage.setItem('cf-community-profile',r.id);void loadProfile(r.id);setNotice('Профилът е създаден.');
    });
  }
  function replaceClue(index:number,field:keyof Editor['clues'][number],value:string){
    setEditor(p=>({...p,clues:p.clues.map((c,i)=>i===index?{...c,[field]:value}:c)}));
  }
  function replaceSuspect(index:number,field:keyof Editor['suspects'][number],value:string){
    setEditor(p=>({...p,suspects:p.suspects.map((s,i)=>i===index?{...s,[field]:value}:s)}));
  }
  async function publish(){
    const story={id:'custom-community-'+Math.random().toString(36).slice(2,10),...editor};
    await perform(()=>request<{id:string;title:string}>('/stories','POST',{author:nickname,story}),r=>{
      setNotice('Публикуван случай „'+r.title+'“. Достъпен е за всички в библиотеката.');
      setView('cases');void loadStories();
    });
  }
  const roomReady=!!room&&!!memberToken;
  return <div className="cf-community">
    <div className="community-head"><div><span className="community-kicker">CASEFILES / SHARED INVESTIGATIONS</span><h2>Общност на детективите</h2><p>Разследвай с приятели, генерирай нов случай, публикувай собствена мистерия и трупай XP.</p></div><div className="community-storage"><span className={'community-led '+(status==='postgres'?'live':'')}/>{status==='postgres'?'PostgreSQL · постоянно':status==='memory'?'Памет на сървъра · временно':'Проверка на съхранението'}</div></div>
    <nav className="community-tabs" aria-label="Общност">
      {([['cases','Случаи',FolderOpen],['room','Екипно разследване',Users],['editor','Редактор',FilePlus2],['profile','Профил',Crown]] as const).map(([id,label,Icon])=><button type="button" key={id} className={view===id?'selected':''} onClick={()=>setView(id)}><Icon size={17}/>{label}</button>)}
    </nav>
    {notice&&<div className="community-notice" role="status">{notice}<button aria-label="Затвори" onClick={()=>setNotice('')}>×</button></div>}
    {view==='cases'&&<div className="community-layout">
      <section className="community-card"><h3><Fingerprint size={20}/> Започни разследване</h3>
        <label>Име на детектива <input maxLength={32} value={nickname} onChange={e=>setNickname(e.target.value)} /></label>
        <div className="community-actions">
          <button disabled={busy} onClick={()=>void newRoom('case-002')}><FolderOpen size={18}/> Case #002 — Изчезналият архив</button>
          <button disabled={busy} onClick={()=>void newRoom('random')}><Compass size={18}/> Генерирай нов случай</button>
        </div>
        <p className="community-muted">Стаята има код за покана и поддържа до шестима детективи. Прогресът по уликите е общ.</p>
      </section>
      <section className="community-card"><h3><Users size={20}/> Присъедини се към приятели</h3>
        <label>Код на стая <input value={joinCode} maxLength={10} placeholder="НАПР. A1B2C3D4E5" onChange={e=>setJoinCode(e.target.value.toUpperCase())}/></label>
        <button disabled={busy||joinCode.trim().length!==10} onClick={()=>void joinRoom()}>Влез в разследването <Send size={16}/></button>
      </section>
      <section className="community-card community-wide"><h3><BookOpen size={20}/> Истории от общността</h3>
        {stories.length===0?<p className="community-muted">Още няма публикувани истории. Създай първата от раздел „Редактор“.</p>:<div className="community-stories">{stories.map(s=><article key={s.id}><strong>{s.title}</strong><small>{s.setting} · Автор: {s.author} · {s.clues} улики</small><p>{s.briefing}</p><button disabled={busy} onClick={()=>void newRoom('community',s.id)}>Разследвай историята</button></article>)}</div>}
      </section>
    </div>}
    {view==='room'&&(!roomReady?<div className="community-card"><h3>Нямаш активна стая</h3><p>Създай стая или въведи код за покана.</p><button onClick={()=>setView('cases')}>Избери случай</button></div>:
      <div className="community-layout">
        <section className="community-card community-wide"><div className="community-room-title"><div><small>КОД НА СТАЯТА: {room.id}</small><h3>{room.title}</h3><p>{room.setting} · {room.briefing}</p></div><button onClick={()=>void navigator.clipboard?.writeText(room.id)}><ClipboardCopy size={17}/> Копирай код</button></div>
          <div className="community-team"><Users size={18}/> {room.players.map((p,i)=><span key={i}>{p.name}</span>)} <button aria-label="Обнови" onClick={()=>void loadRoom(room.id)}><RefreshCcw size={15}/></button></div>
        </section>
        <section className="community-card community-wide"><h3><Compass size={20}/> Общи доказателства — {room.found.length}/{room.clues.length}</h3>
          <div className="community-clues">{room.clues.map(c=><article key={c.id} className={c.found?'discovered':''}><small>{c.id} · {c.location}</small><strong>{c.title}</strong><p>{c.description||'Все още няма достъп до съдържанието.'}</p><button disabled={busy||c.found||!c.available||!!room.verdict&&room.verdict==='solved'} onClick={()=>void roomAction('discover',c.id)}>{c.found?<><Check size={15}/> В досието</>:c.available?'Разгледай':'Изисква 2 начални улики'}</button></article>)}</div>
        </section>
        <section className="community-card"><h3>Разпити</h3>{room.suspects.map(s=><div className="community-suspect" key={s.id}><strong>{s.name}</strong><p>{room.interviews.includes(s.id)?s.alibi:'Разпитай след две открити улики.'}</p><button disabled={busy||room.found.length<2||room.verdict==='solved'} onClick={()=>void roomAction('interview',s.id)}>Разпитай</button></div>)}</section>
        <section className="community-card"><h3><ShieldCheck size={20}/> Финално обвинение</h3>
          <label>Заподозрян <select value={selectedSuspect} onChange={e=>setSelectedSuspect(e.target.value)}>{room.suspects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <p className="community-muted">Избери най-малко три ключови улики, за да защитиш обвинението.</p>
          <div className="community-evidence-checks">{room.clues.filter(c=>c.found).map(c=><label key={c.id}><input type="checkbox" checked={selectedClues.includes(c.id)} onChange={e=>setSelectedClues(xs=>e.target.checked?[...xs,c.id]:xs.filter(x=>x!==c.id))}/>{c.id} — {c.title}</label>)}</div>
          <button disabled={busy||selectedClues.length<3||room.verdict==='solved'} onClick={()=>void roomAction('accuse',selectedSuspect)}>Предай обвинението</button>
          {room.verdict&&<div className="community-outcome"><strong>{room.verdict==='solved'?'СЛУЧАЯТ Е РАЗКРИТ':room.verdict==='incorrect'?'ОБВИНЕНИЕТО Е ОТХВЪРЛЕНО':'НЕДОСТАТЪЧНИ ДОКАЗАТЕЛСТВА'}</strong><p>{room.ending||'Разгледай още улики и провери версията си.'}</p>{room.solvedBy&&<small>Разкрит от: {room.solvedBy}</small>}</div>}
        </section>
      </div>)}
    {view==='profile'&&<section className="community-card"><h3><Crown size={20}/> Постоянен детективски профил</h3>{profile?<><strong className="community-xp">{profile.name} · Ниво {profile.level}</strong><p>{profile.xp} XP · {profile.completedCases} разрешени разследвания</p><div className="community-team">{profile.achievements.length?profile.achievements.map(a=><span key={a}>{a}</span>):'Първото ти постижение предстои.'}</div><p className="community-muted">Профилът се пази чрез таен идентификатор в този браузър. Създадените точки се съхраняват на сървъра, когато PostgreSQL е активиран.</p></>:<><p>Създай профил, за да получаваш XP за разрешените екипни случаи.</p><label>Псевдоним <input maxLength={32} value={nickname} onChange={e=>setNickname(e.target.value)}/></label><button disabled={busy} onClick={()=>void createProfile()}>Създай профил</button></>}</section>}
    {view==='editor'&&<section className="community-card community-editor"><h3><FilePlus2 size={20}/> Създай и публикувай своя история</h3><p className="community-muted">Само измислени случаи. Публикуваните сценарии са достъпни за други играчи — не въвеждай истински лични данни.</p>
      {([['title','Заглавие'],['setting','Място'],['briefing','Начална история']] as const).map(([field,label])=><label key={field}>{label}{field==='briefing'?<textarea value={editor[field]} maxLength={1200} onChange={e=>setEditor(p=>({...p,[field]:e.target.value}))}/>:<input value={editor[field]} maxLength={field==='title'?80:140} onChange={e=>setEditor(p=>({...p,[field]:e.target.value}))}/>}</label>)}
      <h4>Трима заподозрени</h4><div className="community-editor-grid">{editor.suspects.map((s,i)=><fieldset key={s.id}><legend>Лице {i+1}</legend><label>Име<input value={s.name} onChange={e=>replaceSuspect(i,'name',e.target.value)}/></label><label>Алиби<textarea value={s.alibi} onChange={e=>replaceSuspect(i,'alibi',e.target.value)}/></label></fieldset>)}</div>
      <h4>Пет доказателства</h4><div className="community-editor-grid">{editor.clues.map((c,i)=><fieldset key={c.id}><legend>{c.id}</legend><label>Заглавие<input value={c.title} onChange={e=>replaceClue(i,'title',e.target.value)}/></label><label>Място<input value={c.location} onChange={e=>replaceClue(i,'location',e.target.value)}/></label><label>Какво разкрива<textarea value={c.description} onChange={e=>replaceClue(i,'description',e.target.value)}/></label></fieldset>)}</div>
      <h4>Авторско решение (скрито до развръзката)</h4><label>Извършител<select value={editor.solution.suspectId} onChange={e=>setEditor(p=>({...p,solution:{...p.solution,suspectId:e.target.value}}))}>{editor.suspects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <p className="community-muted">Ключови улики за доказване на решението (избери поне 3):</p><div className="community-evidence-checks">{editor.clues.map(c=><label key={c.id}><input type="checkbox" checked={editor.solution.clueIds.includes(c.id)} onChange={e=>setEditor(p=>({...p,solution:{...p.solution,clueIds:e.target.checked?[...p.solution.clueIds,c.id]:p.solution.clueIds.filter(id=>id!==c.id)}}))}/>{c.id}</label>)}</div>
      <label>Развръзка<textarea maxLength={900} value={editor.solution.explanation} onChange={e=>setEditor(p=>({...p,solution:{...p.solution,explanation:e.target.value}}))}/></label>
      <button disabled={busy||editor.solution.clueIds.length<3} onClick={()=>void publish()}><Send size={16}/> Публикувай в общността</button>
    </section>}
  </div>;
}
