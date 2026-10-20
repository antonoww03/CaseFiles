import {ObjectArt,visualForClue,roomAsset} from './sceneArt';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CircleDot, Crosshair, DoorOpen, Eye, FileSearch, FolderOpen, Link2, Lock, MapPin, Plus, Radar, ScanSearch, Sparkles, type LucideIcon } from 'lucide-react';

type Clue = { id: string; title: string; type: string; detail: string; icon: string };
type Deduction = { id: string; title: string; explanation: string; evidenceIds: readonly [string,string] };

const zones: { id: string; name: string; sub: string; icon: LucideIcon; clueIds: string[]; hotspots: { id: string; x: number; y: number; name: string }[] }[] = [
  { id: 'living', name: 'Всекидневна', sub: 'Основна стая', icon: Eye, clueIds: ['E01','E03'],
    hotspots: [{ id:'E01',x:38,y:68,name:'Протокол от огледа' },{ id:'E03',x:68,y:43,name:'Телефонът'}] },
  { id: 'study', name: 'Работен кът', sub: 'Маса и документи', icon: FolderOpen, clueIds: ['E04'],
    hotspots: [{id:'E04',x:50,y:41,name:'Съобщение'}] },
  { id: 'entrance', name: 'Входно антре', sub: 'Врата и ключалка', icon: DoorOpen, clueIds: ['E08'],
    hotspots: [{ id:'E08',x:66,y:54,name:'Дневник на ключалката' }] }
];

export function ExpandedScene({ found, clues, loading, onDiscover, onView }: {
  found: string[]; clues: Clue[]; loading: boolean;
  onDiscover: (item: Clue) => Promise<void>;
  onView: (item: Clue) => void;
}) {
  const [zoneId, setZoneId] = useState('living');
  const [inspected, setInspected] = useState<Clue | null>(null);
  const zone = zones.find(z => z.id === zoneId)!;
  const sceneFound = zones.flatMap(z => z.clueIds).filter(id => found.includes(id));
  async function inspect(id: string) {
    const item = clues.find(c=>c.id===id);
    if (!item) return;
    if (!found.includes(id)) await onDiscover(item);
    setInspected(item);
    onView(item);
  }
  return <div className="v03-explore">
    <div className="v03-zone-tabs" role="group" aria-label="Стаи в апартамента">{zones.map(z => {
      const Icon=z.icon;
      const count=z.clueIds.filter(id=>found.includes(id)).length;
      return <button type="button" className={z.id===zoneId?'active':''} key={z.id} onClick={()=>{setZoneId(z.id);setInspected(null);}}><span className="v03-zone-icon"><Icon size={19}/></span><span><strong>{z.name}</strong><small>{z.sub}</small></span><span className="v03-zone-count">{count}/{z.clueIds.length}</span></button>;
    })}</div>
    <div className="v03-scene-title"><span><Radar size={17} /> {zone.name.toLocaleUpperCase('bg')} / ИНТЕРАКТИВЕН ОГЛЕД</span><span><CircleDot size={12}/> ЗОНА {zones.findIndex(z=>z.id===zoneId)+1} / 3</span></div>
    <div className={'v03-room v03-room-'+zone.id} style={{backgroundImage:'url('+roomAsset(zone.id==='study'?'desk':zone.id)+')'}}>
      <span className="v03-room-corner">CASE #001 / APARTMENT 407</span>
      <div className="v03-room-geometry">
        <div className="v03-room-floor"/><div className="v03-room-edge top"/><div className="v03-room-edge left"/>
        {zone.id==='living'&&<><div className="v03-furniture sofa"/><div className="v03-furniture rug"/><div className="v03-furniture coffee"/><div className="v03-furniture chair"/><div className="v03-furniture lamp"/></>}
        {zone.id==='study'&&<><div className="v03-furniture desk"/><div className="v03-furniture papers"/><div className="v03-furniture cabinet"/><div className="v03-furniture office-chair"/><div className="v03-furniture monitor"/></>}
        {zone.id==='entrance'&&<><div className="v03-furniture doorway"/><div className="v03-furniture hallway"/><div className="v03-furniture shelf"/><div className="v03-furniture mat"/><div className="v03-furniture switch"/></>}
      </div>
      {zone.hotspots.map(h=>{const done=found.includes(h.id),visual=visualForClue(h.id,zone.id==='study'?'desk':zone.id);return <button key={h.id} style={{left:(visual?.x??h.x)+'%',top:(visual?.y??h.y)+'%'}} className={'v03-point '+(done?'found':'')} type="button" disabled={loading} onClick={()=>void inspect(h.id)} aria-label={'Разгледай: '+h.name} title={h.name}><ObjectArt asset={visual?.asset||'evidence'} alt={h.name}/>{done?<Check size={18}/>:<Plus size={18}/>}<small>{h.name}</small></button>})}
      <div className="v03-room-bottom"><span><Crosshair size={13}/> ПОСОЧИ МАРКЕР ЗА ОГЛЕД</span><span>ЕКСПЕРТЕН РЕЖИМ / 02:37</span></div>
    </div>
    <div className="v03-scene-footer"><div><strong><ScanSearch size={15}/> ОБХОД НА АПАРТАМЕНТА</strong><span>{sceneFound.length}/4 открити улики · {zone.clueIds.filter(id=>found.includes(id)).length}/{zone.clueIds.length} в тази стая</span></div><div className="v03-zone-nav"><button type="button" aria-label="Предишна стая" onClick={()=>{setZoneId(zones[(zones.findIndex(z=>z.id===zoneId)+2)%3].id);setInspected(null);}}><ChevronLeft size={17}/></button><button type="button" aria-label="Следваща стая" onClick={()=>{setZoneId(zones[(zones.findIndex(z=>z.id===zoneId)+1)%3].id);setInspected(null);}}><ChevronRight size={17}/></button></div></div>
    {inspected && found.includes(inspected.id) && <div className="v03-inspection"><div className="v03-inspection-icon"><FileSearch size={23}/></div><div><span className="v03-mono">{inspected.id} / ОТКРИТА УЛИКА</span><h3>{inspected.title}</h3><p>{inspected.detail}</p></div><button type="button" onClick={()=>setInspected(null)} aria-label="Затвори подробностите">×</button></div>}
    <div className="v03-scene-collection"><strong>ДОКАЗАТЕЛСТВА ОТ ОГЛЕДА</strong><div>{zones.flatMap(z=>z.clueIds).map(id=>{const item=clues.find(c=>c.id===id)!;const done=found.includes(id);return <button type="button" key={id} disabled={!done} onClick={()=>{setInspected(item);onView(item)}}><span className={'v03-clue-symbol '+(done?'done':'')}>{done?<Check size={16}/>:<Lock size={15}/>}</span><span>{id}<small>{done?item.title:'Неоткрита улика'}</small></span><ChevronRight size={15}/></button>})}</div></div>
  </div>;
}

function coords(index:number) {
  return { x:14+(index%4)*24, y:17+Math.floor(index/4)*33 };
}

export function VisualEvidenceBoard({ clues, deductions, first, second, notice, loading, onChoose, onPair, onVerify }: {
  clues: Clue[]; deductions: Deduction[]; first: string; second:string; notice:string; loading:boolean;
  onChoose: (id:string)=>void;
  onPair: (a:string,b:string)=>void;
  onVerify:()=>Promise<void>;
}) {
  const [dragging, setDragging] = useState('');
  const positions=new Map(clues.map((c,i)=>[c.id,coords(i)]));
  const linked=deductions.map(d=>({ deduction:d, a:positions.get(d.evidenceIds[0]), b:positions.get(d.evidenceIds[1]) })).filter(x=>x.a&&x.b);
  return <div className="v03-board">
    <div className="v03-board-toolbar"><span><MapPin size={16}/> ДОСКА С УЛИКИ</span><span>{clues.length} КАРТИ / {deductions.length} ВРЪЗКИ</span></div>
    <div className="v03-board-scroll"><div className="v03-cork">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="v03-board-lines" aria-hidden="true">{linked.map(x=><line key={x.deduction.id} x1={x.a!.x} y1={x.a!.y} x2={x.b!.x} y2={x.b!.y}/>)}
      {first&&second&&positions.get(first)&&positions.get(second)&&<line x1={positions.get(first)!.x} y1={positions.get(first)!.y} x2={positions.get(second)!.x} y2={positions.get(second)!.y} className="preview"/>}</svg>
      {clues.map((item,i)=>{const pos=coords(i);const selected=first===item.id||second===item.id;return <button type="button" key={item.id}
        draggable
        onDragStart={e=>{setDragging(item.id);e.dataTransfer.setData('text/plain',item.id);e.dataTransfer.effectAllowed='link'}}
        onDragEnd={()=>setDragging('')}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();const source=e.dataTransfer.getData('text/plain')||dragging;if(source&&source!==item.id)onPair(source,item.id);setDragging('')}}
        onClick={()=>onChoose(item.id)}
        className={'v03-board-pin '+(selected?'selected':'')+' '+(dragging===item.id?'dragged':'')}
        style={{left:pos.x+'%',top:pos.y+'%'}}>
        <span className="v03-pin-dot"/><span className="v03-mono">{item.id} · {item.type}</span><strong>{item.title}</strong><span className="v03-pin-footer">{selected?'ИЗБРАНО':'ИЗБЕРИ / ПЛЪЗНИ'}</span>
      </button>})}
      {!clues.length&&<div className="v03-board-empty"><FolderOpen size={31}/><strong>Дъската е празна</strong><span>Открий първите улики, за да ги подредиш тук.</span></div>}
    </div></div>
    <div className="v03-board-dock"><div><span className="v03-mono">ПРОВЕРКА НА ВРЪЗКА</span><div className="v03-board-pair"><span>{first||'УЛИКА A'}</span><Link2 size={16}/><span>{second||'УЛИКА B'}</span></div><small>Избери две карти или плъзни една върху друга.</small></div><button type="button" className="primary" disabled={!first||!second||first===second||loading} onClick={()=>void onVerify()}><Sparkles size={15}/> Провери логиката</button></div>
    {notice&&<div className="v03-board-notice" role="status"><CircleDot size={16}/>{notice}</div>}
    <div className="v03-deduction-list"><h3>Установени връзки <span>{deductions.length}</span></h3>{deductions.length?deductions.map(d=><article key={d.id}><span className="v03-mono">{d.id} / {d.evidenceIds.join(' + ')}</span><strong><Check size={17}/>{d.title}</strong><p>{d.explanation}</p></article>):<p>Все още няма потвърдени логически връзки.</p>}</div>
  </div>;
}
