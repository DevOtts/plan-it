#!/usr/bin/env node
// T-V4A3-13 (AMD-12) — embed-block prose participates in first-use expansion (G-8), sharing
// one page-global first-use set with the rest of the body; inline code/fences/link targets
// stay untouched; the client markdown renderer's HTML-passthrough mechanism is present.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'embed-first-use', 'manifest.json');
const dir = tmpDir('embed-first-use');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2 (exactly one warning, for Q-99), got ${r.status}: ${r.stderr}`);

const html = fs.readFileSync(out, 'utf-8');
const scriptMatch = html.match(/<script type="text\/markdown">\n([\s\S]*?)\n<\/script>/);
assert(!!scriptMatch, 'the embed\'s <script type="text/markdown"> block is present');
const embedSrc = scriptMatch ? scriptMatch[1] : '';

// Within the embed's own markdown source: exactly one full (class="gl", with title)
// expansion for T-V4B4-17 and for DoD; none for G-7 (already expanded earlier on the page).
const t17Full = (embedSrc.match(/<abbr class="gl" title="[^"]*">T-V4B4-17<\/abbr>/g) || []).length;
const dodFull = (embedSrc.match(/<abbr class="gl" title="[^"]*">DoD<\/abbr>/g) || []).length;
assert(t17Full === 1, `exactly one full expansion for T-V4B4-17 in the embed, got ${t17Full}`);
assert(dodFull === 1, `exactly one full expansion for DoD in the embed, got ${dodFull}`);
const g7Full = (embedSrc.match(/<abbr class="gl" title="[^"]*">G-7<\/abbr>/g) || []).length;
assert(g7Full === 0, `zero full (class="gl") expansions for G-7 in the embed — already expanded earlier on the page, got ${g7Full}`);
// It still appears once, as a bare <abbr> (already-seen marker), inside the embed.
const g7Bare = (embedSrc.match(/<abbr>G-7<\/abbr>/g) || []).length;
assert(g7Bare === 1, `G-7 appears once as a bare <abbr> in the embed (already-seen), got ${g7Bare}`);
// And its true first occurrence — in the preceding copy block — DOES carry the full expansion.
assert(/Already covered <abbr class="gl" title="[^"]*">G-7<\/abbr>/.test(html), 'the copy block itself carries G-7\'s one true first-use expansion');

// None inside inline code spans or fenced blocks — the raw markdown backtick/fence syntax
// survives untouched (client-side markdown conversion happens in-browser, not at build time).
assert(embedSrc.includes('Also `T-V4B4-17` inline'), 'inline-code T-V4B4-17 is untouched (raw backticks survive)');
assert(embedSrc.includes('Also `G-7` inline'), 'inline-code G-7 is untouched');
assert(embedSrc.includes('Also `DoD` inline'), 'inline-code DoD is untouched');
assert(/```\nT-V4B4-17\n```/.test(embedSrc), 'fenced T-V4B4-17 is untouched');
assert(/```\nG-7\n```/.test(embedSrc), 'fenced G-7 is untouched');
assert(/```\nDoD\n```/.test(embedSrc), 'fenced DoD is untouched');

// Q-99 (unknown) warns exactly once, and is left as plain text (never wrapped).
const warningLines = r.stderr.split('\n').filter((l) => /glossary:.*not in GLOSSARY\.md/.test(l));
assert(warningLines.length === 1, `exactly one glossary warning, got ${warningLines.length}: ${JSON.stringify(warningLines)}`);
assert(warningLines[0].includes('Q-99'), `the one warning names Q-99: ${warningLines[0]}`);
assert(html.includes('Unknown: Q-99.') && !html.includes('<abbr>Q-99</abbr>') && !html.includes('class="gl">Q-99'), 'Q-99 is left as plain text, never wrapped');

// The client-side markdown renderer's HTML-passthrough mechanism (abbr tags survive the
// esc()+markdown pipeline intact) is present in the static twin — mechanism-ready, not just
// asserted by eye: the protect/restore regex is a fixed, greppable string in the shipped JS.
assert(html.includes('<abbr\\b[^>]*>[\\s\\S]*?<\\/abbr>'), 'the client markdown renderer\'s abbr HTML-passthrough (protect/restore) code is present in the rendered twin');

report('T-V4A3-13 embed-first-use');
