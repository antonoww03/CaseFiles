import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';

const root=process.cwd();
const api=join(root,'apps/api/src');
const catalog=join(root,'apps/web/src/i18n.tsx');
const out=process.argv[2]||'/tmp/casefiles-i18n-missing.json';
const parse=(path)=>ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const dictionary=parse(catalog);
const keys=new Set();
function visit(node,fn){fn(node);ts.forEachChild(node,n=>visit(n,fn));}
visit(dictionary,node=>{
 if(!ts.isVariableDeclaration(node)||node.name.getText(dictionary)!=='dictionary'||!node.initializer||!ts.isObjectLiteralExpression(node.initializer))return;
 for(const prop of node.initializer.properties){
  if(!ts.isPropertyAssignment(prop))continue;
  if(ts.isStringLiteralLike(prop.name)||ts.isIdentifier(prop.name))keys.add(prop.name.text);
 }
});
const files=[];
function walk(dir){for(const name of readdirSync(dir)){
 const file=join(dir,name);
 if(statSync(file).isDirectory())walk(file);
 else if(/\.(ts|tsx)$/.test(name)&&!name.endsWith('.test.ts')&&!name.endsWith('.test.tsx')&&!name.endsWith('.d.ts'))files.push(file);
}}
walk(api);
const missing=new Map();
for(const file of files){
 const tree=parse(file);
 visit(tree,node=>{
  if(!ts.isStringLiteralLike(node))return;
  const value=node.text;
  if(!/[\u0400-\u04ff]/.test(value)||value.trim().length<4||value.length>700||keys.has(value))return;
  if(!missing.has(value))missing.set(value,[]);
  const line=tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1;
  missing.get(value).push(file.slice(root.length+1)+':'+line);
 });
}
const entries=[...missing].map(([source,locations])=>({source,locations})).sort((a,b)=>a.source.localeCompare(b.source,'bg'));
writeFileSync(out,JSON.stringify({count:entries.length,entries},null,2));
console.log('Untranslated authored API literals: '+entries.length+' -> '+out);
