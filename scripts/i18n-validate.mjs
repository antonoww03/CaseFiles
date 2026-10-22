import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import ts from 'typescript';

const root=process.cwd();
const sourceRoot=join(root,'apps/web/src');
const catalogPath=join(sourceRoot,'i18n.tsx');
const locales=['en','bg','de','fr','pl','es'];
const strict=process.argv.includes('--strict');

function parse(path){
  return ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
}
function propName(node){
  if(ts.isIdentifier(node)||ts.isStringLiteral(node)||ts.isNumericLiteral(node))return node.text;
  return '';
}
const catalog=parse(catalogPath);
let dictionary=null;
for(const stmt of catalog.statements){
  if(!ts.isVariableStatement(stmt))continue;
  for(const decl of stmt.declarationList.declarations){
    if(ts.isIdentifier(decl.name)&&decl.name.text==='dictionary'&&decl.initializer&&ts.isObjectLiteralExpression(decl.initializer))dictionary=decl.initializer;
  }
}
if(!dictionary)throw Error('Cannot find i18n dictionary in apps/web/src/i18n.tsx');

const entries=new Map();
const incompleteCatalog=[];
for(const prop of dictionary.properties){
  if(!ts.isPropertyAssignment(prop)||!ts.isObjectLiteralExpression(prop.initializer))continue;
  const key=propName(prop.name);
  const translations={};
  for(const item of prop.initializer.properties){
    if(ts.isPropertyAssignment(item))translations[propName(item.name)]=item.initializer;
  }
  entries.set(key,translations);
  const missing=locales.filter(l=>l!=='bg'&&(!translations[l]||!ts.isStringLiteralLike(translations[l])||!translations[l].text.trim()));
  if(missing.length)incompleteCatalog.push({key,missing});
}
const files=[];
function walk(dir){
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    if(statSync(path).isDirectory()){walk(path);continue;}
    if(/\.(ts|tsx)$/.test(name)&&!name.endsWith('.d.ts'))files.push(path);
  }
}
walk(sourceRoot);

const referenced=new Map();
const dynamic=[];
function literals(expr){
  if(ts.isParenthesizedExpression(expr))return literals(expr.expression);
  if(ts.isStringLiteralLike(expr))return [expr.text];
  if(ts.isConditionalExpression(expr)){
    const a=literals(expr.whenTrue),b=literals(expr.whenFalse);
    return a&&b?[...a,...b]:null;
  }
  return null;
}
for(const path of files){
  const tree=parse(path);
  function visit(node){
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='t'&&node.arguments.length===1){
      const loc=tree.getLineAndCharacterOfPosition(node.getStart(tree));
      const where={file:relative(root,path),line:loc.line+1};
      const values=literals(node.arguments[0]);
      if(values){for(const value of values){
        if(!referenced.has(value))referenced.set(value,[]);
        referenced.get(value).push(where);
      }}
      else dynamic.push({...where,expression:node.arguments[0].getText(tree).slice(0,140)});
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);
}
const missingKeys=[...referenced].filter(([key])=>!entries.has(key)).map(([key,uses])=>({key,uses:uses.slice(0,3)}));
const total={catalogEntries:entries.size,filesScanned:files.length,staticKeysReferenced:referenced.size,staticMissing:missingKeys.length,incompleteCatalog:incompleteCatalog.length,dynamicTranslationCalls:dynamic.length};
console.log('CASEFILES i18n source audit: '+JSON.stringify(total));
if(missingKeys.length)console.log('Missing static translation keys:\n'+JSON.stringify(missingKeys.slice(0,150),null,2));
if(incompleteCatalog.length)console.log('Catalog entries with missing languages:\n'+JSON.stringify(incompleteCatalog.slice(0,80),null,2));
if(dynamic.length)console.log('Dynamic lookups requiring runtime or source review:\n'+JSON.stringify(dynamic.slice(0,80),null,2));
if(strict&&(missingKeys.length||incompleteCatalog.length)){
  console.error('Localization is NOT COMPLETE: fix missing static translations before release.');
  process.exitCode=1;
}
