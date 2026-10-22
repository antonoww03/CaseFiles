import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
const root=process.cwd();
const srcRoot=join(root,'apps/web/src');
const catalog=readFileSync(join(srcRoot,'i18n.tsx'),'utf8');
const literal=/^\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*:\s*\{/gm;
const keys=new Set([...catalog.matchAll(literal)].map(m=>m[1]??m[2]));
const result={totalDictionaryEntries:keys.size,files:[],missing:new Set(),uses:0};
function walk(dir){
 for(const e of readdirSync(dir)){
  const f=join(dir,e);if(statSync(f).isDirectory()){walk(f);continue;}
  if(!/\.tsx$/.test(e)||e==='i18n.tsx')continue;
  const content=readFileSync(f,'utf8');
  const entries=[...content.matchAll(/\bt\(\s*(['"])((?:[^'"\\]|\\.)*)\1\s*\)/g)].map(m=>m[2]);
  result.uses+=entries.length;
  const missing=[...new Set(entries.filter(x=>!keys.has(x)))];
  if(missing.length){result.files.push({path:relative(root,f),untranslated:missing});for(const key of missing)result.missing.add(key)}
 }
}
walk(srcRoot);
const report={totalDictionaryEntries:keys.size,explicitCalls:result.uses,missingCount:result.missing.size,files:result.files};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&report.missingCount)process.exitCode=1;
