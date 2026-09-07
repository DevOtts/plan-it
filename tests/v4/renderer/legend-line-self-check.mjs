#!/usr/bin/env node
// T-V4A4-08 — wherever 3+ distinct per-run ID prefixes co-occur, a Legend: line is present
// somewhere in the same file (CONTRACT §5, G-8 self-applied).
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';

const PREFIX_PATTERNS = [
  ['T-case', /\bT-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\b/],
  ['C-E', /\bC-E\d+-\d{2}\b/],
  ['epic', /\bV4[A-Z]\d+\b/],
  ['gate', /\bG[0-4]\b/],
  ['governance', /\bG-\d+\b/],
  ['wave', /\bW\d+\b/],
  ['ruling', /\bD-?\d+\b/],
  ['default', /\bR\d+\b/],
];

const FILES = [
  path.join(repoRoot, 'delivery', 'v4', 'epics', 'epics-a-renderer.md'),
  path.join(repoRoot, 'plugins', 'plan-it', 'skills', 'plan-it', 'references', 'report-family.md'),
];

for (const file of FILES) {
  const text = fs.readFileSync(file, 'utf-8');
  const familiesPresent = PREFIX_PATTERNS.filter(([, re]) => re.test(text));
  if (familiesPresent.length >= 3) {
    assert(/Legend:/.test(text), `${path.basename(file)}: ${familiesPresent.length} ID-prefix families co-occur, so a Legend: line is required and present`);
  } else {
    assert(true, `${path.basename(file)}: fewer than 3 ID-prefix families, no Legend: line required`);
  }
}

report('T-V4A4-08 legend-line-self-check');
