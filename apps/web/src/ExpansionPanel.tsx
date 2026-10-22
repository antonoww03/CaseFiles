import { useEffect, useState } from 'react';
import {
  Activity, Archive, Award, BookOpen, Check, CheckCircle2,
  CircleHelp, ClipboardList, Compass, Download, Fingerprint, FlaskConical,
  Footprints, Lightbulb, Lock, Map, MapPin, Medal, Settings2,
  ShieldCheck, SlidersHorizontal, Upload, UserRound, Volume2, VolumeX,
  Eye, XCircle
} from 'lucide-react';
import './expansion.css';
import {useLanguage} from './i18n';

type Puzzle={id:string;name:string;type:string;requires:readonly string[];question:string;choices:readonly string[];result:string;solved:boolean;available:boolean};
type Location={id:string;name:string;detail:string;needs:readonly string[];unlocked:boolean};
type Witness={id:string;name:string;requires:readonly string[];available:boolean;interviewed:boolean;statement:string|null};
type Claim={id:string;label:string;completed:boolean;answer:string|null;available:boolean};
type TimeItem={id:string;time:string;event:string;requires:string;available:boolean;completed:boolean};
type Guide={id:string;title:string;info:string;done:boolean};
type Achievement={id:string;title:string;done:boolean};
type Attempt={at:string;result:string;selected:string};
type Entry={at:string;kind:string;text:string};
export type ExpansionData={
  difficulty:'rookie'|'detective'|'expert';puzzles:Puzzle[];locations:Location[];witnesses:Witness[];
  classifications:Claim[];timeline:TimeItem[];tutorial:Guide[];achievements:Achievement[];
  suspicions:Record<string,number>;actions:Entry[];attempts:Attempt[];
  rating:{title:string;level:string}|null;
  settings:{sound:boolean;reducedMotion:boolean};timelineSolved:boolean;
};
type Section='lab'|'map'|'logic'|'chronology'|'journal'|'progress'|'backup';
const navigation:{id:Section;label:string;icon:typeof Fingerprint}[]=[
 {id:'lab',label:'Миниигри',icon:Fingerprint},{id:'map',label:'Карта и свидетели',icon:Map},
 {id:'logic',label:'Достоверност',icon:Eye},{id:'chronology',label:'Реконструкция',icon:Activity},
 {id:'journal',label:'Решения',icon:ClipboardList},{id:'progress',label:'Постижения',icon:Award},
 {id:'backup',label:'Настройки и архив',icon:Archive}
];
async function api<T>(session:string,path:string,method='GET',body?:unknown):Promise<T> {
 const resp=await fetch((import.meta.env.VITE_API_URL||'')+'/api'+path,{method,headers:{'Content-Type':'application/json','x-case-session':session},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await resp.json();
 if(!resp.ok)throw new Error(data.error||'Сървърът не отговаря.');
 return data;
}
function dateOf(value:string,language:string){return new Date(value).toLocaleString(language,{dateStyle:'short',timeStyle:'short'});}
function importPortable(text:string):{kind:'session';id:string}|{kind:'backup';data:unknown}{
 const value:unknown=JSON.parse(text);
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Неподдържан архив.');
 const p=value as Record<string,unknown>;
 if(p.format==='casefiles-backup-v1'&&p.version===1)return {kind:'backup',data:value};
 if(p.format==='casefiles-local-v1'&&typeof p.sessionId==='string'&&/^[0-9a-f-]{36}$/i.test(p.sessionId))return {kind:'session',id:p.sessionId};
 throw new Error('Неподдържан формат на архива.');
}

export function InvestigationExpansion({session,foundCount,onRestoreSession,onRestoreBackup}:{session:string;foundCount:number;onRestoreSession:(id:string)=>Promise<void>;onRestoreBackup:(data:unknown)=>Promise<void>}) {
 const {t,language}=useLanguage();
 const [data,setData]=useState<ExpansionData|null>(null);
 const [section,setSection]=useState<Section>('lab');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [answer,setAnswer]=useState<Record<string,string>>({});
 const [restoreText,setRestoreText]=useState('');
 useEffect(()=>{setData(null);if(!session)return;let active=true;void api<ExpansionData>(session,'/expansion').then(value=>{if(active)setData(value);}).catch(e=>{if(active)setMessage(String(e));});return()=>{active=false;};},[session,foundCount]);
 async function act(payload:unknown){
  if(!session||busy)return;
  setBusy(true);setMessage('');
  try{
   const res=await api<{message:string;progress:ExpansionData}>(session,'/expansion/action','POST',payload);
   setData(res.progress);setMessage(res.message);
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 async function difficulty(value:string){
  setBusy(true);
  try{const result=await api<ExpansionData>(session,'/expansion/difficulty','POST',{difficulty:value});setData(result);setMessage('Нивото е записано.');}
  catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 async function exportSession(){
  if(!session||busy)return;
  setBusy(true);setMessage('');
  try{
   const saved=await api<unknown>(session,'/backup');
   const file=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'});
   const href=URL.createObjectURL(file);
   const link=document.createElement('a');
   link.href=href;link.download='casefiles-progress-backup.json';
   document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(href),1000);
   setMessage('Пълният наличен прогрес е експортиран. Архивът съдържа личните ти бележки и разговори.');
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 async function restore(){
  setBusy(true);setMessage('');
  try{
   const archive=importPortable(restoreText);
   if(archive.kind==='session')await onRestoreSession(archive.id);
   else await onRestoreBackup(archive.data);
   setMessage('Прогресът е възстановен успешно.');
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 if(!session)return <div className="exp-empty"><Lock size={26}/><h3>{t("Първо започни разследване")}</h3><p>{t("Разширените инструменти се отключват с игрова сесия.")}</p></div>;
 return <div className={'exp-root '+(data?.settings.reducedMotion?'exp-reduced':'')}>
   <div className="exp-menu">{navigation.map(n=><button type="button" key={n.id} className={section===n.id?'active':''} onClick={()=>{setSection(n.id);setMessage('');}}><n.icon size={17}/>{t(n.label)}</button>)}</div>
   {message&&<div role="status" className="exp-notice"><CircleHelp size={16}/>{message}<button type="button" onClick={()=>setMessage('')} aria-label="Затвори"><XCircle size={16}/></button></div>}
   {!data?<div className="exp-empty">{t("Зареждане на оперативните инструменти...")}</div>:<>
   {section==='lab'&&<div className="exp-stack">
    <div className="exp-head"><FlaskConical/><div><h2>{t("Криминалистични миниигри")}</h2><p>{t("Отпечатъци, аудио пикове, UV фенер, файлове, маршрути и фалшиви следи — седем отделни предизвикателства.")}</p></div></div>
    <div className="exp-cards">{data.puzzles.map(p=><article key={p.id} className={'exp-puzzle '+(p.solved?'complete':'')}>
      <div className="exp-kicker"><Fingerprint size={16}/> {p.type.toUpperCase()} <span>{p.solved?'ЗАВЪРШЕНО':p.available?'ГОТОВО':'ЗАКЛЮЧЕНО'}</span></div>
      <h3>{t(p.name)}</h3><p>{t(p.question)}</p>
      {p.id==='fingerprints'&&<div className="exp-fingerprints" aria-hidden="true"><span>◉</span><span>◎</span><span>◉</span></div>}
      {p.id==='audio'&&<div className="exp-wave" aria-label="Схематична игрова аудио вълна">{[3,6,4,8,5,9,4,16,32,65,34,7,5,10,4,8,3,6,2,4].map((h,i)=><span key={i} style={{height:h+'%'}}/>)}</div>}
      {p.id==='uv'&&<div className="exp-uv"><Lightbulb size={26}/> UV / 47A</div>}
      <div className="exp-choices">{p.choices.map((choice,i)=><label key={i} className={answer[p.id]===String(i)?'chosen':''}><input type="radio" name={'exp-'+p.id} checked={answer[p.id]===String(i)} onChange={()=>setAnswer(prev=>({...prev,[p.id]:String(i)}))} disabled={!p.available||p.solved}/>{choice}</label>)}</div>
      <button type="button" className="secondary" disabled={!p.available||p.solved||answer[p.id]===undefined||busy} onClick={()=>void act({kind:'puzzle',id:p.id,answer:answer[p.id]})}>{p.solved?<><Check size={15}/>{t("Решено")}</>:<><ShieldCheck size={15}/>{t("Провери решението")}</>}</button>
      {!p.available&&<small>Необходими улики: {p.requires.join(', ')}</small>}
      {p.solved&&<p className="exp-result">{t(p.result)}</p>}
    </article>)}</div>
   </div>}
   {section==='map'&&<div className="exp-stack"><div className="exp-head"><Map/><div><h2>{t("Карта и нови локации")}</h2><p>{t("Схематична карта на измислените локации в случая. Не представлява реална географска навигация.")}</p></div></div>
    <div className="exp-map"><div className="exp-street horizontal"/><div className="exp-street vertical"/>{data.locations.map((place,i)=><div className={'exp-location '+(place.unlocked?'unlocked':'')} key={place.id} style={{left:(16+i%2*56)+'%',top:(18+Math.floor(i/2)*51)+'%'}}><MapPin size={20}/><strong>{t(place.name)}</strong><small>{place.unlocked?'ДОСТЪПНО':'НУЖНО: '+place.needs.join(', ')}</small></div>)}</div>
    <div className="exp-cards">{data.locations.map(l=><article className="exp-info" key={l.id}><strong>{l.unlocked?<Compass size={15}/>:<Lock size={15}/>} {t(l.name)}</strong><p>{t(l.detail)}</p><small>{l.unlocked?'ОТКЛЮЧЕНА ЛОКАЦИЯ':'Изисква: '+l.needs.join(', ')}</small></article>)}</div>
    <div className="exp-head"><UserRound/><div><h2>{t("Допълнителни свидетели")}</h2><p>{t("Нови контекстни показания без автоматични обвинения.")}</p></div></div>
    <div className="exp-cards">{data.witnesses.map(w=><article className="exp-info" key={w.id}><strong>{t(w.name)}</strong><p>{w.statement||'Отключи лицето чрез свързания материал.'}</p><button className="secondary" type="button" disabled={!w.available||w.interviewed||busy} onClick={()=>void act({kind:'witness',id:w.id})}>{w.interviewed?'Показанията са взети':w.available?'Вземи показания':'Непознато лице'}</button></article>)}</div>
   </div>}
   {section==='logic'&&<div className="exp-stack"><div className="exp-head"><Eye/><div><h2>{t("Достоверност на информацията")}</h2><p>{t("Разграничавай пряко наблюдение, свидетелско показание и хипотеза. Не третирай предположения като доказателства.")}</p></div></div>
    {data.classifications.map(c=><article className="exp-info" key={c.id}><span className="exp-kicker">{c.id} / {c.completed?'ПРОВЕРЕНО':'ЗА КЛАСИФИЦИРАНЕ'}</span><h3>{t(c.label)}</h3><div className="exp-choices horizontal">{([['observation','Пряко наблюдение'],['testimony','Показание'],['hypothesis','Хипотеза']] as const).map(([key,label])=><button className={answer[c.id]===key?'chosen':''} type="button" key={key} disabled={!c.available||c.completed} onClick={()=>setAnswer(old=>({...old,[c.id]:key}))}>{label}</button>)}</div><button type="button" className="secondary" disabled={!c.available||c.completed||!answer[c.id]||busy} onClick={()=>void act({kind:'classify',id:c.id,answer:answer[c.id]})}>{c.completed?'Потвърдено':'Класифицирай'}</button></article>)}
   </div>}
   {section==='chronology'&&<div className="exp-stack"><div className="exp-head"><Activity/><div><h2>{t("Реконструкция на хронологията")}</h2><p>{t("Постави събитията в доказаните им времеви точки. Непотвърдените събития остават заключени.")}</p></div></div>
    {data.timeline.map(item=><article className="exp-timeline" key={item.id}><span className={item.completed?'exp-verified':''}>{item.completed?<CheckCircle2 size={20}/>:<Footprints size={20}/>}</span><div><h3>{item.event}</h3><small>{item.available?'ПОДКРЕПЕНО ОТ '+item.requires:'НЕОТКРИТО — '+item.requires}</small></div><select aria-label={'Час за '+item.event} value={answer[item.id]||''} onChange={e=>setAnswer(old=>({...old,[item.id]:e.target.value}))} disabled={!item.available||item.completed}><option value="">{t("Посочи час")}</option>{data.timeline.map(x=><option value={x.time} key={x.id}>{x.time}</option>)}</select><button className="secondary" type="button" disabled={!item.available||item.completed||!answer[item.id]||busy} onClick={()=>void act({kind:'timeline',id:item.id,position:answer[item.id]})}>{item.completed?'✓':'Потвърди'}</button></article>)}
    <div className="exp-head"><SlidersHorizontal/><div><h2>{t("Лична оценка на подозрението")}</h2><p>{t("Отбелязвай кого подозираш, без това автоматично да влияе върху сървърната присъда.")}</p></div></div>
    {Object.entries(data.suspicions).map(([id,score])=><div className="exp-suspect" key={id}><strong>{({martin:'Мартин',elena:'Елена',petar:'Петър'} as Record<string,string>)[id]}</strong><input type="range" min="0" max="100" value={answer['s'+id]===undefined?score:Number(answer['s'+id])} onChange={e=>setAnswer(a=>({...a,['s'+id]:e.target.value}))}/><span>{answer['s'+id]||score}%</span><button className="secondary" type="button" disabled={busy} onClick={()=>void act({kind:'suspect',id,score:Number(answer['s'+id]||score)})}>{t("Запази")}</button></div>)}
   </div>}
   {section==='journal'&&<div className="exp-stack"><div className="exp-head"><ClipboardList/><div><h2>{t("Дневник на решенията")}</h2><p>{t("История на действията и опитите за обвинение, свързани с тази сесия.")}</p></div></div>
    <div className="exp-cards">{data.attempts.map((a,i)=><div className="exp-info" key={i}><strong>Обвинение #{i+1} — {t(a.result)}</strong><small>{dateOf(a.at,language)}</small><p>Посочен заподозрян: {a.selected}</p></div>)}</div>
    <div className="exp-journal">{[...data.actions].reverse().map((a,i)=><div key={i}><span>{dateOf(a.at,language)}</span><strong>{a.kind}</strong><p>{t(a.text)}</p></div>)}{!data.actions.length&&<p>{t("Още няма записани решения.")}</p>}</div>
   </div>}
   {section==='progress'&&<div className="exp-stack"><div className="exp-head"><Award/><div><h2>{t("Постижения и игрови напредък")}</h2><p>{t("Открий всички доказателства, направи връзки и разреши случая. Скрита оценка се разкрива след успешния финал.")}</p></div></div>
    <div className="exp-cards">{data.achievements.map(a=><div className={'exp-achievement '+(a.done?'done':'')} key={a.id}><span>{a.done?<Medal size={24}/>:<Lock size={24}/>}</span><strong>{t(a.title)}</strong><small>{a.done?'ОТКЛЮЧЕНО':'НЕОТКЛЮЧЕНО'}</small></div>)}</div>
    <div className="exp-info"><h3>{t("Скрита оценка")}</h3><p>{data.rating?data.rating.title:'Оценката и типът финал ще станат видими след успешно разрешен случай.'}</p></div>
    <div className="exp-head"><BookOpen/><div><h2>{t("Интерактивно въведение")}</h2><p>{t("Отбелязвай завършените етапи на обучението.")}</p></div></div>
    {data.tutorial.map((step,i)=><div className="exp-guide" key={step.id}><span>{step.done?<Check size={18}/>:i+1}</span><div><strong>{t(step.title)}</strong><p>{t(step.info)}</p></div><button className="secondary" type="button" disabled={step.done||busy} onClick={()=>void act({kind:'tutorial',id:step.id})}>{step.done?'Готово':'Разбрах'}</button></div>)}
   </div>}
   {section==='backup'&&<div className="exp-stack"><div className="exp-head"><Settings2/><div><h2>{t("Игрови настройки")}</h2><p>{t("Предпочитанията са свързани със сесията. Звукът е изключен по подразбиране.")}</p></div></div>
    <div className="exp-info"><div className="exp-options"><button type="button" className="secondary" onClick={()=>void act({kind:'settings',sound:!data.settings.sound,reducedMotion:data.settings.reducedMotion})}>{data.settings.sound?<Volume2 size={16}/>:<VolumeX size={16}/>} Звукови сигнали: {data.settings.sound?'Включени':'Изключени'}</button><button type="button" className="secondary" onClick={()=>void act({kind:'settings',sound:data.settings.sound,reducedMotion:!data.settings.reducedMotion})}>Намалени анимации: {data.settings.reducedMotion?'Да':'Не'}</button></div><small>{t("В момента звуковият превключвател запазва предпочитанието. Не възпроизвеждаме аудио без съгласие.")}</small></div>
    <div className="exp-head"><Archive/><div><h2>{t("Локален архив на сесията")}</h2><p>{t("Експорт и импорт на открити доказателства, връзки, бележки, показания и настройки. Може да се възстанови в нова сесия след рестарт.")}</p></div></div>
    <div className="exp-info"><p>{t("Файлът съдържа бележки, история на разпитите и игрови данни. Не го споделяй публично. Импортът създава нова сесия; платените AI разговори остават изключени, а финалното обвинение се подава отново.")}</p><button className="primary" type="button" onClick={exportSession}><Download size={16}/>{t("Експортирай игровия прогрес")}</button></div>
    <div className="exp-info"><strong><Upload size={15}/>{t("Възстанови прогрес от файл")}</strong><input type="file" accept=".json,application/json" aria-label="Избери JSON архив" onChange={e=>{const file=e.target.files?.[0];if(file&&file.size<480000)void file.text().then(setRestoreText);else setMessage('Файлът е прекалено голям.');}}/><button type="button" className="secondary" disabled={!restoreText||busy} onClick={()=>void restore()}>{t("Възстанови сесия")}</button></div>
    <div className="exp-head"><SlidersHorizontal/><div><h2>{t("Ниво на трудност")}</h2><p>{t("Избери преди началото на разследването. След откриване на първа улика трудността остава фиксирана.")}</p></div></div>
    <div className="exp-choices horizontal">{([['rookie','Начинаещ'],['detective','Детектив'],['expert','Експерт']] as const).map(([value,label])=><button type="button" key={value} disabled={foundCount>0||data.actions.length>0||busy} className={data.difficulty===value?'chosen':''} onClick={()=>void difficulty(value)}>{label}</button>)}</div>
    <p className="exp-disclaimer">{t("Начинаещ: 3 подсказки и 2 наказателни точки за всяка. Детектив: 2 подсказки и 4 точки. Експерт: 1 подсказка и 6 точки. Фактите и отговорът на загадката остават същите.")}</p>
   </div>}
   </>}
 </div>;
}
