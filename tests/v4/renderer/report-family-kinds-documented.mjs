#!/usr/bin/env node
// T-V4A4-01 — report-family.md documents all 8 kinds with a required-sections cell.
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';

const docPath = path.join(repoRoot, 'plugins', 'plan-it', 'skills', 'plan-it', 'references', 'report-family.md');
const text = fs.readFileSync(docPath, 'utf-8');

const KINDS = ['SCOPE-BRIEF', 'TRIAGE', 'RESEARCH-REPORT', 'DECISIONS', 'CONTRACT', 'KICKOFF', 'PLAN-REVIEW', 'GLOSSARY'];
const section2 = text.split('## 2 · Report-family kinds')[1]?.split('## 3')[0] || '';
const rows = section2.split('\n').filter((l) => /^\|/.test(l) && !/^\|---/.test(l) && !l.includes('Kind |'));

for (const kind of KINDS) {
  const row = rows.find((r) => r.startsWith(`| ${kind} `));
  assert(!!row, `kind ${kind} has a table row`);
  if (row) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    assert(cells.length >= 4, `kind ${kind} row has a required-sections cell: ${row}`);
  }
}
assert(rows.length === 8, `exactly 8 kind rows present, found ${rows.length}`);

report('T-V4A4-01 report-family-kinds-documented');
