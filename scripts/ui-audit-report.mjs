#!/usr/bin/env node
/**
 * CASEFILES source-to-test UI audit ledger.
 *
 * There are three distinct concepts:
 *  - static JSX declarations (not runtime controls);
 *  - source declarations with at least one VERIFIED interaction;
 *  - state/dependency coverage (NOT yet exhaustive).
 *
 * Do not infer UI coverage from Playwright test counts or action call totals.
 * Evidence is only imported from PASSED source-annotated tests.
 */
import ts from 'typescript';
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

const repo = resolve(import.meta.dirname, '..');
const src = resolve(repo, 'apps/web/src');
const evidenceDir = resolve(repo, '.ui-evidence');
const auditedSha = '46780e627ce1d776d3762aba3112e172b4d3f316';
const baselineTotal = 345;
const baselineFiles = {
  'CasePanels.tsx':12, 'CinematicCenter.tsx':20, 'CommunityHub.tsx':29,
  'Detective13.tsx':13, 'Director12.tsx':11, 'ExpansionPanel.tsx':18,
  'Experience09.tsx':42, 'Experience11.tsx':24, 'ForensicPanels.tsx':12,
  'ImmersiveInvestigation.tsx':22, 'InvestigationDesk14.tsx':7,
  'InvestigationTools.tsx':8, 'InvestigationUniverse.tsx':15,
  'LivingInvestigation.tsx':18, 'Release10.tsx':51,
  'VisualCaseEditor.tsx':18, 'main.tsx':25
};

const manual = [
  ['apps/web/src/CommunityHub.tsx:108:button:1', 'Production: the community tab declaration was observed'],
  ['apps/web/src/Release10.tsx:86:button:1', 'Production: start Case 001'],
  ['apps/web/src/Release10.tsx:87:button:1', 'Production: Continue after reload'],
  ['apps/web/src/Release10.tsx:188:button:1', 'Production: enter investigation'],
  ['apps/web/src/Release10.tsx:196:button:1', 'Production: inspect E01'],
  ['apps/web/src/Release10.tsx:199:button:2', 'Production: collect E01']
];

// This is an independently derived AST inventory, not a claim that every
// original CSV extraction rule is identical. Differences are reported explicitly.
const staticTags = new Set(['button','input','select','textarea','summary']);
const inventory = [];
for (const basename of readdirSync(src).filter(name=>name.endsWith('.tsx')).sort()) {
  const filename = join(src, basename);
  const code = readFileSync(filename,'utf8');
  const sf = ts.createSourceFile(filename,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const seen = new Map();
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const hasHandler = node.attributes.properties.some(attr=>
        ts.isJsxAttribute(attr) && /^on[A-Z]/.test(attr.name.getText(sf)));
      if (staticTags.has(tag) || hasHandler) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        const key = `${line}:${tag}`;
        const ordinal = (seen.get(key) || 0) + 1;
        seen.set(key,ordinal);
        const source = relative(repo,filename).replaceAll('\\','/');
        const id = `${source}:${line}:${tag}:${ordinal}`;
        inventory.push({id,source,line,tag,ordinal,hasHandler});
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(sf);
}

const entries = new Map(inventory.map(item=>[item.id,{
  ...item,evidence:[],states: new Set()
}]));
const unmatched = [];

function credit(id,kind,assertion,state) {
  const item=entries.get(id);
  if (!item) { unmatched.push({id,kind,assertion,state}); return; }
  item.evidence.push({kind,assertion,state});
  item.states.add(state);
}
manual.forEach(([id,assertion])=>credit(id,'manual-production',assertion,'observed'));

const testRuns = [];
if (existsSync(evidenceDir)) {
  for (const name of readdirSync(evidenceDir).filter(name=>name.endsWith('.json') && name!=='summary.json')) {
    let run;
    try {run=JSON.parse(readFileSync(join(evidenceDir,name),'utf8'));} catch {continue;}
    if (run.baselineSha!==auditedSha || run.status!=='passed' || !Array.isArray(run.records)) continue;
    testRuns.push({test:run.test,verifiedAt:run.verifiedAt,records:run.records.length});
    for (const item of run.records) {
      if (typeof item.id!=='string' || typeof item.action!=='string')continue;
      credit(item.id, 'local-playwright-pass', item.assertion||'', item.action);
    }
  }
}

const verified = [...entries.values()].filter(item=>item.evidence.length);
const byFile = Object.fromEntries(
  Object.entries(baselineFiles).map(([basename, expected])=>{
    const detected=inventory.filter(item=>item.source.endsWith('/'+basename)).length;
    const covered=verified.filter(item=>item.source.endsWith('/'+basename)).length;
    return [basename,{expectedCsvDeclarations:expected, astDeclarations:detected, matchedSourceDeclarations:covered}];
  })
);
const parity = Object.values(byFile).every(x=>x.expectedCsvDeclarations===x.astDeclarations);
const uniqueVerifiedBaseline = Math.min(baselineTotal,verified.length);
const summary = {
  status: 'NOT_PASS',
  baselineSha: auditedSha,
  originalCsv: {declarations: baselineTotal,files:17,manualDirectlyMapped:6},
  newAstScan: {declarations:inventory.length,files:readdirSync(src).filter(x=>x.endsWith('.tsx')).length,parityWithOriginalCsv:parity},
  evidence: {
    passingAdditionalTestRuns:testRuns.length,
    sourceDeclarationsWithAtLeastOneVerifiedAction: verified.length,
    percentageOfOriginalCsv: Number((uniqueVerifiedBaseline/baselineTotal*100).toFixed(2)),
    caveat: parity?'Declaration-level minimum only; state and dependency coverage unknown.':'Parser and original CSV differ: denominator is NOT a validated 1:1 join; do not treat the percentage as exact coverage.',
    unverifiedOriginalDeclarations: parity?baselineTotal-verified.length:null,
    uniqueActionStateEvidence:verified.reduce((n,x)=>n+x.states.size,0)
  },
  byFile,
  unmatchedSourceAnchors:unmatched,
  verifiedDeclarations:verified.map(x=>({id:x.id,actions:[...x.states],evidence:x.evidence})),
  remainingAstDeclarations:inventory.filter(x=>!entries.get(x.id).evidence.length),
  missing: [
    'Enumerate all reachable UI states/dependencies for all JSX declarations',
    'Run every relevant action and prove resulting state, not just render',
    'Persistent game progress after Render process restart',
    '14-day session/auth policy and secure restoration without data loss',
    'Representative production security/performance sampling'
  ]
};
mkdirSync(evidenceDir,{recursive:true});
writeFileSync(join(evidenceDir,'summary.json'),JSON.stringify(summary,null,2));
console.log(`CASEFILES UI AUDIT: ${summary.status} | audited CSV ${baselineTotal} | AST ${inventory.length} | direct evidence ${verified.length} | baseline parity ${parity}`);
console.log(`Source rows without individually verified action: ${parity?baselineTotal-verified.length:'UNKNOWN until reconciliation'}; full runtime state coverage: UNKNOWN`);
if (unmatched.length)console.log('Unmatched source evidence anchors: '+JSON.stringify(unmatched));
