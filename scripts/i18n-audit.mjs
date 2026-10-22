import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=process.cwd();
const roots=['apps/web/src','apps/api/src'];
const skip=new Set(['i18n.tsx']);
const matches=[];
function walk(dir){
 for(const name of readdirSync(dir)){
  const path=join(dir,name);
  const st=statSync(path);
  if(st.isDirectory()){walk(path);continue;}
  if(!/\.(tsx?|jsx?)$/.test(name)||skip.has(name))continue;
  const content=readFileSync(path,'utf8');
  content.split(/\r?\n/).forEach((line,index)=>{
   if(/[А-Яа-яЁё]/u.test(line)&&!line.trim().startsWith('//')){
    matches.push({file:relative(root,path),line:index+1,excerpt:line.trim().slice(0,180)});
   }
  });
 }
}
for(const part of roots)walk(join(root,part));
const counts=Object.entries(Object.groupBy(matches,r=>r.file)).map(([file,rows])=>({file,cyrillicLines:rows.length})).sort((a,b)=>b.cyrillicLines-a.cyrillicLines);
process.stdout.write(JSON.stringify({totalCyrillicLines:matches.length,filesWithCyrillic:counts.length,byFile:counts,untranslatedCandidates:matches},null,2)+'\n');
// Inventory only: some Cyrillic strings are character names, user-written text,
// evidence IDs, Bulgarian localizations or comments. Human review is required.
