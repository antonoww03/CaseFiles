#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [inventoryArg = '../audit-output/CASEFILES_UI_INVENTORY.csv', runtimeArg = '../audit-output/CASEFILES_UI_RUNTIME_TEST_LOG.csv', reportArg = '../audit-output/CASEFILES_UI_COVERAGE_REPORT.md', matrixArg = '../audit-output/CASEFILES_UI_COVERAGE_MATRIX.csv'] = process.argv.slice(2);

function readCsv(file) {
  const input = fs.readFileSync(file, 'utf8');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); }
  const headers = rows.shift();
  if (!headers?.length) throw new Error(`Empty CSV: ${file}`);
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
}

function writeCsv(file, rows) {
  const headers = Object.keys(rows[0] ?? {});
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, [headers.map(quote).join(','), ...rows.map(row => headers.map(h => quote(row[h])).join(','))].join('\n') + '\n');
}

const inventory = readCsv(inventoryArg);
const runtime = readCsv(runtimeArg);
const occurrence = new Map();
const matrix = inventory.map(item => {
  const group = `${item.source_file}:${item.line}:${item.tag}`;
  const index = (occurrence.get(group) ?? 0) + 1;
  occurrence.set(group, index);
  const evidence = item.evidence_status ?? '';
  const automatedEvidence = evidence.match(/^Automated(?: partial)?:\s*(.*)$/);
  let classification = 'untested';
  if (evidence.startsWith('Event boundary')) classification = 'excluded boundary';
  else if (evidence.startsWith('Fully verified:')) classification = 'covered';
  else if (evidence.startsWith('Blocked:')) classification = 'blocked';
  else if (evidence.startsWith('Manual production:') || evidence.startsWith('Partially verified:') || evidence.startsWith('Automated partial:')) classification = 'partially tested';
  else if (evidence !== 'Not individually verified') classification = 'unclassified';
  return {
    source_declaration_id: `${group}#${index}`,
    ...item,
    coverage_class: classification,
    evidence_text: evidence,
    exact_automated_test: automatedEvidence?.[1] ?? '',
    applicable_states_from_source: item.disabled_condition ? `default; conditional enablement (${item.disabled_condition}); tested states require explicit evidence` : 'default; interaction outcome states require explicit evidence',
    runtime_evidence: evidence.startsWith('Manual production:') || evidence.startsWith('Fully verified:') || automatedEvidence ? evidence : ''
  };
});

const count = classification => matrix.filter(item => item.coverage_class === classification).length;
const auditable = matrix.filter(item => item.coverage_class !== 'excluded boundary');
const total = auditable.length;
const covered = count('covered');
const partial = count('partially tested');
const untested = count('untested');
const blocked = count('blocked');
const verifiedRuntime = runtime.filter(item => item.result.startsWith('Verified')).length;
const blockedRuntime = runtime.filter(item => item.result.startsWith('Blocked')).length;
const failingRuntime = runtime.filter(item => /^(Failed|Failure|Defect confirmed:)/i.test(item.result)).length;
const knownDefectRecords = runtime.filter(item => /^Confirmed defect/i.test(item.result)).length;
const interactionCount = runtime.reduce((sum, item) => sum + (Number(item.interaction_count) || 0), 0);
const checkedStates = [...new Set(runtime.flatMap(item => String(item.states_tested ?? '').split('|').map(state => state.trim()).filter(Boolean)))].sort();
const testNames = [...new Set(inventory.map(item => item.related_spec).filter(Boolean))];
const lines = [
  '# CASEFILES UI coverage report',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Inventory rows: ${inventory.length}; static event-boundary exclusions: ${count('excluded boundary')}.`,
  '',
  '## Source declaration coverage',
  '',
  '| Metric | Count |', '|---|---:|',
  `| Auditable JSX declarations | ${total} |`,
  `| Fully covered with explicit complete state evidence | ${covered} |`,
  `| Partially tested with direct evidence | ${partial} |`,
  `| Untested / no direct evidence | ${untested} |`,
  `| Blocked | ${blocked} |`,
  `| Unclassified evidence labels | ${count('unclassified')} |`,
  '',
  'A selector or related-spec hint is not treated as evidence. “Covered” requires an explicit `Fully verified:` status in the source inventory; source text, labels, or selector similarity never promote an item. A manual click is partial until its applicable state matrix is verified. The per-declaration matrix contains exact file, line, tag, handler, gate, classification and evidence.',
  '',
  '## Runtime interactions',
  '',
  `| Runtime log rows | Verified outcomes | Blocked rows | Failed runtime assertions | Confirmed defect records |`,
  `|---:|---:|---:|---:|---:|`,
  `| ${runtime.length} | ${verifiedRuntime} | ${blockedRuntime} | ${failingRuntime} | ${knownDefectRecords} |`,
  '',
  `| Counted runtime interactions | Distinct checked states |`,
  `|---:|---|`,
  `| ${interactionCount} | ${checkedStates.length ? checkedStates.join(', ') : 'Not recorded for older groups'} |`,
  '',
  'Exact controls, preconditions, observed outcomes, state transitions, and incomplete attempts are recorded in the runtime test log. The matrix retains the exact test and proof text for each mapped declaration.',
  '',
  '## Evidence limitations',
  '',
  '- `related_spec` values are inventory hints, not exact assertion mappings unless an explicit evidence status identifies a test.',
  '- Runtime denominator and repeated JSX-map instances are not inferred from source row count.',
  '- Source-derived default/gating states are not counted as tested states.',
  '- Current state coverage remains incomplete; this report cannot issue PASS while any audited declaration is partial, untested, blocked, or unclassified.',
  '',
  '## Files',
  '',
  `- Matrix: ${path.basename(matrixArg)} (${matrix.length} source rows)`,
  `- Runtime log: ${path.basename(runtimeArg)} (${runtime.length} rows)`,
  `- Inventory relation hints observed: ${testNames.join('; ')}`
];
fs.mkdirSync(path.dirname(path.resolve(reportArg)), { recursive: true });
fs.writeFileSync(reportArg, lines.join('\n') + '\n');
writeCsv(matrixArg, matrix);
console.log(JSON.stringify({ inventoryRows: inventory.length, auditable: total, covered, partiallyTested: partial, untested, blocked, unclassified: count('unclassified'), runtimeRows: runtime.length, verifiedRuntime, blockedRuntime, failingRuntime, knownDefectRecords, report: reportArg, matrix: matrixArg }));
