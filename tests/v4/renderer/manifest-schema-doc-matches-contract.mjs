#!/usr/bin/env node
// T-V4A4-09 — report-family.md §1's field list matches CONTRACT §4.2's planit-report/1
// top-level fields exactly — zero field-name drift.
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';

const contractText = fs.readFileSync(path.join(repoRoot, 'delivery', 'v4', 'CONTRACT.md'), 'utf-8');
const section42 = contractText.split('### 4.2 Manifest')[1]?.split('### 4.3')[0] || '';
// CONTRACT §4.2 prose: "Top level: `schema` (required, ...), `kind` (...), `title`, ..."
const topLevelLine = section42.split('\n').find((l) => l.startsWith('Top level:')) || '';
// Backtick spans may carry trailing shape info, e.g. `source{path}` or `allow_tokens[]` —
// only the leading field-name identifier is the field name itself. A couple of backtick
// spans in the same prose line are example VALUES, not field names (`planit-report/1` is
// schema's example value, `claude-*` is allow_tokens' example shape) — excluded explicitly.
const VALUE_NOT_FIELD = new Set(['planit', 'claude']);
const contractFields = new Set(
  [...topLevelLine.matchAll(/`([a-z_]+)[^`]*`/g)].map((m) => m[1]).filter((f) => !VALUE_NOT_FIELD.has(f))
);

const docText = fs.readFileSync(path.join(repoRoot, 'plugins', 'plan-it', 'skills', 'plan-it', 'references', 'report-family.md'), 'utf-8');
const section1 = docText.split('## 1 · Manifest schema')[1]?.split('## 2')[0] || '';
const docRows = section1.split('\n').filter((l) => /^\|\s*`/.test(l));
const docFields = new Set(docRows.map((l) => l.match(/`([a-z_]+)`/)?.[1]).filter(Boolean));

assert(contractFields.size > 0, `CONTRACT §4.2 fields parsed, found ${contractFields.size}: ${[...contractFields].join(', ')}`);
assert(docFields.size > 0, `report-family.md §1 fields parsed, found ${docFields.size}: ${[...docFields].join(', ')}`);

const missingFromDoc = [...contractFields].filter((f) => !docFields.has(f));
const extraInDoc = [...docFields].filter((f) => !contractFields.has(f));
assert(missingFromDoc.length === 0, `every CONTRACT field is documented, missing: ${missingFromDoc.join(', ')}`);
assert(extraInDoc.length === 0, `no undocumented extra fields drift in, extra: ${extraInDoc.join(', ')}`);

report('T-V4A4-09 manifest-schema-doc-matches-contract');
