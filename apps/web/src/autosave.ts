export const autosaveKey='casefiles-autosave-v1';
export type AutoSaveEnvelope={originalSession:string;savedAt:number;archive:{format:string;version:number;[key:string]:unknown}};
const base=(import.meta.env.VITE_API_URL||'')+'/api';
async function jsonResponse<T>(url:string,init?:RequestInit):Promise<T>{
 const r=await fetch(base+url,init);
 const parsed=await r.json();if(!r.ok)throw new Error(parsed.error||'Неуспешна връзка със сървъра.');
 return parsed as T;
}
export async function saveLocalSnapshot(token:string){
 if(!token)return;
 const archive=await jsonResponse<AutoSaveEnvelope['archive']>('/backup',{headers:{'x-case-session':token,'Cache-Control':'no-store'},cache:'no-store'});
 if(archive.format!=='casefiles-backup-v1')throw Error('Invalid backup format');
 const envelope:AutoSaveEnvelope={originalSession:token,savedAt:Date.now(),archive};
 const serialized=JSON.stringify(envelope);
 if(serialized.length>450000)throw Error('Save too large for local cache');
 localStorage.setItem(autosaveKey,serialized);
}
export function readLocalSnapshot(token?:string):AutoSaveEnvelope|null{
 try{
  const v=localStorage.getItem(autosaveKey);
  if(!v)return null;
  const item=JSON.parse(v) as AutoSaveEnvelope;
  if(!item||typeof item.originalSession!=='string'||!item.archive||item.archive.format!=='casefiles-backup-v1'||(token&&item.originalSession!==token))return null;
  return item;
 }catch{return null;}
}
export async function recoverLocalSnapshot(saved:AutoSaveEnvelope):Promise<string>{
 const ok=await jsonResponse<{mode:string}>('/health');
 if(!ok?.mode)throw Error('API unavailable');
 const session=await jsonResponse<{sessionId:string}>('/session',{method:'POST',headers:{'Content-Type':'application/json'}});
 await jsonResponse('/backup/restore',{method:'POST',headers:{'Content-Type':'application/json','x-case-session':session.sessionId},body:JSON.stringify(saved.archive)});
 return session.sessionId;
}
