#!/usr/bin/env node
// T-V4A3-09 — a numbered list in an embedded markdown file renders as a real <ol><li>,
// not a bold-prefixed <ul>, once the client markdown parser runs.
import path from 'node:path';
import { fixturesRoot, assert, report } from './lib/helpers.mjs';
import { getClientMdFunctions } from '../../../scripts/build-report.mjs';
import fs from 'node:fs';

const { md } = getClientMdFunctions();
const src = fs.readFileSync(path.join(fixturesRoot, 'ordered-list-source', 'list.md'), 'utf-8');
const html = md(src);
const flat = html.replace(/\n/g, '');
assert(flat.includes('<ol><li>foo</li><li>bar</li></ol>'), `real <ol><li> emitted: ${html}`);
assert(!/<ul>.*foo.*<\/ul>/.test(flat), 'no bold-prefixed <ul> for this list');

report('T-V4A3-09 ordered-list');
