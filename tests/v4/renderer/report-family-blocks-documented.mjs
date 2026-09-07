#!/usr/bin/env node
// T-V4A4-02 — all 17 block types each have a required-fields cell and a failure-state cell.
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';
import { BLOCK_TYPES } from '../../../scripts/build-report.mjs';

const docPath = path.join(repoRoot, 'plugins', 'plan-it', 'skills', 'plan-it', 'references', 'report-family.md');
const text = fs.readFileSync(docPath, 'utf-8');
const section3 = text.split('## 3 · Block catalogue')[1]?.split('## 4')[0] || '';
const rows = section3.split('\n').filter((l) => /^\|/.test(l) && !/^\|---/.test(l) && !l.includes('Type |'));

assert(BLOCK_TYPES.length === 17, `renderer implements 17 block types, found ${BLOCK_TYPES.length}`);
for (const type of BLOCK_TYPES) {
  const row = rows.find((r) => r.startsWith(`| \`${type}\` `));
  assert(!!row, `block type "${type}" has a table row`);
  if (row) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    assert(cells.length >= 4, `"${type}" row has both a required-fields and a failure-state cell: ${row}`);
  }
}
assert(rows.length === 17, `exactly 17 block-type rows present, found ${rows.length}`);

report('T-V4A4-02 report-family-blocks-documented');
