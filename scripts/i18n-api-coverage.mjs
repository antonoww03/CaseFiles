import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import ts from 'typescript';

// Conservative audit: enumerate Cyrillic literals in API source, check that a
// matching authored translation exists for all five non-Bulgarian languages.
// These are CANDIDATES, not guaranteed user-visible strings: developer-only
// messages, identifiers and diagnostics require manual classification.
const root=process.cwd();
const apiRoot=join(root,'apps/api/src');
const catalogFile=join(root,'apps/web/src/i18n.tsx');
const locales=['en','de','fr','pl','es'];
const parse=file=>ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
const name=p=>ts.isIdentifier(p)||ts.isStringLiteralLike(p)?p.text:'';
const catalog=parse(catalogFile);
const entries=new Map();
function traverse(node,visitor){visitor(node);ts.forEachChild(node,child=>traverse(child,visitor));}
traverse(catalog,node=>{
 if(!ts.isVariableDeclaration(node)||!ts.isIdentifier(node.name)||node.name.text!=='dictionary'||!node.initializer||!ts.isObjectLiteralExpression(node.initializer))return;
 for(const prop of node.initializer.properties){
  if(!ts.isPropertyAssignment(prop)||!ts.isObjectLiteralExpression(prop.initializer))continue;
  const values={};
  for(const item of prop.initializer.properties)
   if(ts.isPropertyAssignment(item)&&ts.isStringLiteralLike(item.initializer))values[name(item.name)]=item.initializer.text;
  entries.set(name(prop.name),values);
 }
});
const files=[];
function walk(dir){for(const entry of readdirSync(dir)){
 const full=join(dir,entry);
 if(statSync(full).isDirectory())walk(full);
 else if(/\.(ts|tsx|js|jsx)$/.test(entry)&&!entry.endsWith('.d.ts'))files.push(full);
}}
walk(apiRoot);
const results=[];
for(const file of files){
 const tree=parse(file),seen=new Map();
 traverse(tree,node=>{
  if(!ts.isStringLiteralLike(node)||!/[\u0400-\u04ff]/.test(node.text))return;
  if(ts.isPropertyAssignment(node.parent)&&node.parent.name===node)return;
  const value=node.text.trim();
  if(value.length<4)return;
  const pos=tree.getLineAndCharacterOfPosition(node.getStart(tree));
  if(!seen.has(value))seen.set(value,[]);
  seen.get(value).push(pos.line+1);
 });
 if(!seen.size)continue;
 const missing=[];
 for(const [value,lines] of seen){
  const translated=entries.get(value);
  const absent=locales.filter(lang=>!translated?.[lang]);
  if(absent.length)missing.push({line:lines[0],value,missing:absent});
 }
 results.push({file:relative(root,file),totalCandidates:seen.size,missing:missing.length,entries:missing});
}
const summary={apiFiles:files.length,filesWithCyrillic:results.length,apiCandidates:results.reduce((s,r)=>s+r.totalCandidates,0),notInAllLocales:results.reduce((s,r)=>s+r.missing,0),byFile:results.map(({file,totalCandidates,missing})=>({file,totalCandidates,missing}))};
console.log('CASEFILES API locale coverage: '+JSON.stringify(summary));
for(const x of results.filter(v=>v.missing))console.log(JSON.stringify({file:x.file,missing:x.entries.slice(0,12)}));
if(process.argv.includes('--strict')&&summary.notInAllLocales){
 console.error('Locale release gate failed: authored API strings without all five translations.');
 process.exitCode=1;
}
