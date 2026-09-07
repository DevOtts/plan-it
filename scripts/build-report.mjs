#!/usr/bin/env node
// build-report.mjs — plan-it v4 report renderer (SQ-A, CONTRACT §4.1/§4.2)
// Zero-dependency (G-2): node:fs, node:path, node:crypto, node:child_process, node:url only.
//
// Usage: node build-report.mjs <manifest.json> [--open] [--brand <path>|default]
//        [--out <file>] [--check] [--strict]
//
// Exit codes: 0 RENDERED · 2 RENDERED_PARTIAL (warnings; page still written) ·
//             1 RENDER_FAILED (nothing written). --check never writes: 0 identical,
//             2 stale-or-missing, 1 error.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const RENDERER_VERSION = '4.0.0';

// Byte-identical to plugins/plan-it/scripts/hooks/planit-guard.mjs line 89 (G-4).
// An amendment that changes one must change both (CONTRACT §6 G-4, case C-E2-09).
export const MODEL_ID_RE = /claude-[a-z0-9-]+/;
const MODEL_ID_RE_G = /claude-[a-z0-9-]+/g;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function sha256(bufOrStr) {
  return crypto.createHash('sha256').update(bufOrStr).digest('hex');
}

export function toRelForward(fromDir, absPath) {
  let rel = path.relative(fromDir, absPath);
  rel = rel.split(path.sep).join('/');
  if (rel.startsWith('./')) rel = rel.slice(2);
  return rel;
}

// Server-side HTML escaping: & < > " (four chars — extends the ancestor's three, D-A13).
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Case-insensitive </script escape + HTML-comment-open escape (D-A13, C-E2-12).
export function escapeScriptBreakout(text) {
  return String(text)
    .replace(/<\/(script)/gi, '<\\/$1')
    .replace(/<!--/g, '<\\!--');
}

const SAFE_URL_RE = /^(https?:|mailto:|#)/i;
function isRelativePath(u) {
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u); // no scheme at all => relative
}
export function isSafeUrl(u) {
  const url = String(u).trim();
  if (url.includes('"') || url.includes("'")) return false;
  if (SAFE_URL_RE.test(url)) return true;
  return isRelativePath(url);
}

// Neutralizes markdown-syntax links with a disallowed scheme or a quote-breakout
// attempt, BEFORE the text is embedded into the page (server-side half of D-A13's
// link scheme allow-list; the client `inline()` below is the runtime half).
export function sanitizeMarkdownLinks(text) {
  return String(text).replace(/\[([^\]]*)\]\(([^)]+)\)/g, (m, label, url) => {
    return isSafeUrl(url) ? m : label;
  });
}

// Defensive scrub of raw *_html fields (already-rendered HTML, per schema) for the
// same hazard class: a hand-authored href with a disallowed scheme.
export function sanitizeRawHrefs(htmlText) {
  return String(htmlText).replace(/href\s*=\s*"([^"]*)"/gi, (m, url) => {
    return isSafeUrl(url) ? m : 'href="#"';
  }).replace(/href\s*=\s*'([^']*)'/gi, (m, url) => {
    return isSafeUrl(url) ? m : "href='#'";
  });
}

export function die(msg) {
  process.stderr.write(`build-report: ERROR: ${msg}\n`);
  process.exit(1);
}

function warn(msg) {
  process.stderr.write(`WARNING: ${msg}\n`);
}

// ---------------------------------------------------------------------------
// Client-side markdown renderer, single source of truth.
// Serialized verbatim into the template's <script> (so the page can render
// embedded markdown files client-side); also `new Function`-evaluated here so
// the exact same logic is unit-testable from Node (no code duplication).
// ---------------------------------------------------------------------------

export const CLIENT_MD_JS = `
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function isSafeUrl(u){
  var url=String(u).trim();
  if(url.indexOf('"')!==-1||url.indexOf("'")!==-1) return false;
  if(/^(https?:|mailto:|#)/i.test(url)) return true;
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
}
function inline(s){
  return s
    .replace(/\`([^\`]+)\`/g,function(m,c){return "<code>"+c+"</code>"})
    .replace(/\\*\\*([^*]+)\\*\\*/g,"<strong>$1</strong>")
    .replace(/\\*([^*]+)\\*/g,"<em>$1</em>")
    .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,function(m,label,url){
      return isSafeUrl(url) ? '<a href="'+esc(url)+'">'+label+'</a>' : label;
    });
}
function md(src){
  var lines=esc(src).split("\\n"), out=[], inCode=false, inList=false, inOList=false, inQuote=false, i=0;
  function closeAll(){
    if(inList){out.push("</ul>");inList=false}
    if(inOList){out.push("</ol>");inOList=false}
    if(inQuote){out.push("</blockquote>");inQuote=false}
  }
  while(i<lines.length){
    var raw=lines[i];
    if(raw.indexOf("\`\`\`")===0){closeAll();out.push(inCode?"</pre>":"<pre>");inCode=!inCode;i++;continue}
    if(inCode){out.push(raw);i++;continue}
    if(/^\\s*\\|.*\\|\\s*$/.test(raw) && i+1<lines.length && /^\\s*\\|[\\s\\-:|]+\\|\\s*$/.test(lines[i+1])){
      closeAll();
      var cells=function(r){return r.trim().replace(/^\\||\\|$/g,"").split("|").map(function(c){return inline(c.trim())})};
      out.push('<div class="overflow"><table><tr>'+cells(raw).map(function(c){return "<th>"+c+"</th>"}).join("")+"</tr>");
      i+=2;
      while(i<lines.length && /^\\s*\\|.*\\|\\s*$/.test(lines[i])){
        out.push("<tr>"+cells(lines[i]).map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>"); i++;
      }
      out.push("</table></div>"); continue;
    }
    var l=raw, m;
    if(/^\\s*$/.test(l)){closeAll();i++;continue}
    if(/^---+\\s*$/.test(l)){closeAll();out.push("<hr>");i++;continue}
    if(m=l.match(/^(#{1,4})\\s+(.*)/)){closeAll();var h=m[1].length;out.push("<h"+h+">"+inline(m[2])+"</h"+h+">");i++;continue}
    if(m=l.match(/^\\s*&gt;\\s?(.*)/)){if(!inQuote){closeAll();out.push("<blockquote>");inQuote=true}out.push("<p>"+inline(m[1])+"</p>");i++;continue}
    if(m=l.match(/^\\s*[-*]\\s+(.*)/)){
      if(inQuote){out.push("</blockquote>");inQuote=false}
      if(inOList){out.push("</ol>");inOList=false}
      if(!inList){out.push("<ul>");inList=true}
      out.push("<li>"+inline(m[1])+"</li>");i++;continue;
    }
    if(m=l.match(/^\\s*(\\d+)\\.\\s+(.*)/)){
      if(inQuote){out.push("</blockquote>");inQuote=false}
      if(inList){out.push("</ul>");inList=false}
      if(!inOList){out.push("<ol>");inOList=true}
      out.push("<li>"+inline(m[2])+"</li>");i++;continue;
    }
    closeAll();out.push("<p>"+inline(l)+"</p>");i++;
  }
  closeAll(); if(inCode)out.push("</pre>");
  return out.join("\\n");
}
`;

let _clientFns = null;
export function getClientMdFunctions() {
  if (_clientFns) return _clientFns;
  // eslint-disable-next-line no-new-func
  _clientFns = new Function(`${CLIENT_MD_JS}\nreturn { esc: esc, inline: inline, md: md };`)();
  return _clientFns;
}

// ---------------------------------------------------------------------------
// argv parsing
// ---------------------------------------------------------------------------

export function parseArgv(argv) {
  const positional = [];
  const flags = { open: false, brand: null, out: null, check: false, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--open') { flags.open = true; continue; }
    if (a === '--check') { flags.check = true; continue; }
    if (a === '--strict') { flags.strict = true; continue; }
    if (a === '--brand') { flags.brand = argv[++i]; continue; }
    if (a === '--out') { flags.out = argv[++i]; continue; }
    if (!a.startsWith('--')) { positional.push(a); continue; }
  }
  return { positional, flags };
}

// ---------------------------------------------------------------------------
// Manifest load, validate, legacy rewrite (D-A1/D-A2)
// ---------------------------------------------------------------------------

const FAMILY_KINDS = ['SCOPE-BRIEF', 'TRIAGE', 'RESEARCH-REPORT', 'DECISIONS', 'CONTRACT', 'KICKOFF', 'PLAN-REVIEW', 'GLOSSARY'];

export function loadManifestRaw(manifestPath) {
  let text;
  try {
    text = fs.readFileSync(manifestPath, 'utf-8');
  } catch (e) {
    die(`cannot read manifest: ${manifestPath}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    die(`manifest is not valid JSON: ${manifestPath}`);
  }
}

// Rewrites a legacy conclude-it-shaped section {heading?, table?, cards?, html?}
// into {heading, blocks:[...]}. One rendering path, two manifest dialects (D-A2).
export function legacyToBlocks(manifest) {
  const sections = (manifest.sections || []).map((s) => {
    if (Array.isArray(s.blocks)) return s; // already v4-shaped
    const blocks = [];
    if (s.table) blocks.push({ type: 'table', ...s.table });
    if (Array.isArray(s.cards)) blocks.push({ type: 'cards', items: s.cards });
    if (s.html) blocks.push({ type: 'html', content: s.html });
    return { heading: s.heading, blocks };
  });
  return { ...manifest, sections };
}

// Validates and normalizes a manifest. Returns { manifest, kind, fatal, reason }.
export function prepareManifest(raw, strict) {
  if (!raw.title || !raw.output) {
    const missing = [];
    if (!raw.title) missing.push('title');
    if (!raw.output) missing.push('output');
    return { fatal: true, reason: `manifest missing required field(s): ${missing.join(', ')}` };
  }
  let kind = raw.kind;
  let warnings = [];
  if (!raw.schema || !raw.kind) {
    if (strict) {
      return { fatal: true, reason: 'manifest missing schema/kind (--strict)' };
    }
    kind = 'LEGACY';
    warnings.push('manifest missing schema/kind — rendering as kind:LEGACY');
  }
  const manifest = legacyToBlocks({ ...raw, kind });
  return { fatal: false, manifest, kind, warnings };
}

// ---------------------------------------------------------------------------
// Brand resolution (D-A4) — detection order, first-hit-wins.
// ---------------------------------------------------------------------------

const BUNDLED_BRAND_PATH = path.join(__dirname, '..', 'assets', 'brand', 'default.brand.json');
const REPO_BRAND_CANDIDATES = ['brand.json', 'assets/brand/brand.json', 'docs/brand/brand.json', 'brand/brand.json'];
const GUIDELINE_GLOBS = [
  { dir: 'assets/brand', re: /\.md$/i },
  { dir: 'docs/brand', re: /\.md$/i },
  { dir: '.', re: /^docs\/brand.*\.md$/i },
  { dir: 'brand', re: /\.md$/i },
  { dir: '.', re: /^BRAND\.md$/ },
];

function findGuidelineFile(repoRoot) {
  for (const g of GUIDELINE_GLOBS) {
    const dirAbs = path.join(repoRoot, g.dir);
    if (!fs.existsSync(dirAbs) || !fs.statSync(dirAbs).isDirectory()) continue;
    const entries = fs.readdirSync(dirAbs).filter((f) => g.re.test(g.dir === '.' ? f : f));
    if (entries.length) return path.join(dirAbs, entries[0]);
  }
  return null;
}

export function resolveBrand({ brandFlag, manifestDir, cwd }) {
  const bases = [manifestDir, cwd].filter(Boolean);
  if (brandFlag && brandFlag !== 'default') {
    const p = path.isAbsolute(brandFlag) ? brandFlag : path.join(cwd, brandFlag);
    if (fs.existsSync(p)) {
      return loadBrandFile(p, cwd);
    }
  }
  if (brandFlag !== 'default') {
    for (const base of bases) {
      const p = path.join(base, '.plan-it', 'brand.json');
      if (fs.existsSync(p)) return loadBrandFile(p, cwd);
    }
    for (const base of bases) {
      for (const cand of REPO_BRAND_CANDIDATES) {
        const p = path.join(base, cand);
        if (fs.existsSync(p)) return loadBrandFile(p, cwd);
      }
    }
    for (const base of bases) {
      const g = findGuidelineFile(base);
      if (g) {
        const bundled = loadBrandFile(BUNDLED_BRAND_PATH, cwd);
        return { ...bundled, warning: 'brand: default (guideline present, not tokenised)' };
      }
    }
  }
  return loadBrandFile(BUNDLED_BRAND_PATH, cwd);
}

function loadBrandFile(p, cwd) {
  const text = fs.readFileSync(p, 'utf-8');
  const brand = JSON.parse(text);
  const isBundled = p === BUNDLED_BRAND_PATH;
  const source = isBundled ? 'default' : `repo:${toRelForward(cwd, p)}`;
  return { brand, source, hash: sha256(text), path: p };
}

// ---------------------------------------------------------------------------
// Brand → CSS emitter (D-A4/D-A14)
// ---------------------------------------------------------------------------

const ROLE_KEYS = ['bg', 'card', 'line', 'ink', 'muted', 'accent', 'accentBg', 'ok', 'warn', 'bad', 'info', 'chip', 'hold'];

function roleBlock(roles) {
  return ROLE_KEYS.map((k) => `--${k}:${roles[k]};`).join('');
}

export function emitBrandCss(brand) {
  const light = roleBlock(brand.roles.light);
  const dark = roleBlock(brand.roles.dark);
  const fonts = brand.fonts || {};
  const fontVars = `--font-display:${fonts.display || 'system-ui'},sans-serif;--font-body:${fonts.body || 'system-ui'},sans-serif;--font-mono:${fonts.mono || 'monospace'};`;
  return [
    `:root{${light}${fontVars}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`,
    `:root[data-theme="dark"]{${dark}}`,
  ].join('\n');
}

export function emitFontLink(brand) {
  if (brand.fonts && brand.fonts.googleFontsHref) {
    return `<link rel="stylesheet" href="${esc(brand.fonts.googleFontsHref)}">`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Glossary (G-8, D-A11)
// ---------------------------------------------------------------------------

// Family-pattern grammar (CONTRACT §5, AMD-10/AMD-11) — ONE grammar shared in *semantics*
// (not code — lanes do not import each other's files, CONTRACT §2) with gate-check.mjs's
// `familyItemToRegex` (SQ-B, .claude/worktrees/v4b-lints at the time of writing): `*` ->
// `[A-Za-z0-9.]+`, word-bounded `NN` -> `[A-Z0-9]{2,3}`, `<n>` or a trailing bare `n` ->
// `\d+`. AMD-11: NO range expansion — v1.3 already said range cells are not rows, and a
// numeric-range reading of a literal ID shaped `<letters><digit>-<digits>` (e.g. `P2-11`)
// silently swallowed it into a bogus range instead of registering it as a literal; lookups
// are literal-first, then family patterns, full stop.
function familyItemToRegex(item) {
  if (!/(\*|<n>|\bNN\b|n$)/.test(item)) return null;
  const hasTrailingBareN = /n$/.test(item) && !/NN$/.test(item) && !item.endsWith('<n>');
  let s = item.split('<n>').join('@@NUM@@');
  s = s.replace(/\bNN\b/g, '@@NN@@');
  s = s.split('*').join('@@STAR@@');
  if (hasTrailingBareN) s = s.replace(/n$/, '@@NUM@@');
  if (!/@@/.test(s)) return null; // no placeholder actually substituted -> not a family pattern
  s = s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  s = s.split('@@NUM@@').join('\\d+');
  s = s.split('@@NN@@').join('[A-Z0-9]{2,3}');
  s = s.split('@@STAR@@').join('[A-Za-z0-9.]+');
  return new RegExp(`^${s}$`);
}

// Parses a GLOSSARY.md table into a display row list plus a literal/family lookup index —
// the same shape gate-check.mjs's `parseGlossaryEntries` builds (id cells may carry several
// `·`/`,`-separated items, each a literal, a numeric range, or a family pattern).
export function buildGlossaryIndex(text) {
  const literals = new Map();
  const families = [];
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (!m) continue;
    const [, idCell, expansion, where] = m;
    if (/^-+$/.test(idCell.replace(/[:\s]/g, '')) || /^id$/i.test(idCell)) continue;
    rows.push({ id: idCell, expansion, where });
    for (let item of idCell.split(/[·,]/).map((s) => s.trim()).filter(Boolean)) {
      item = item.replace(/^`|`$/g, '');
      const re = familyItemToRegex(item);
      if (re) { families.push({ re, expansion }); continue; }
      literals.set(item, expansion);
    }
  }
  return { literals, families, rows };
}

export function isKnownGlossaryId(id, index) {
  if (index.literals.has(id)) return true;
  return index.families.some((f) => f.re.test(id));
}

export function glossaryExpansionFor(id, index) {
  if (index.literals.has(id)) return index.literals.get(id);
  const fam = index.families.find((f) => f.re.test(id));
  return fam ? fam.expansion : '';
}

// ID-shaped token discovery (design §4.8, widened under AMD-10 to the same shape
// gate-check.mjs's own glossary lint scans prose with — an uppercase-led run of
// dash-joined alphanumeric segments, filtered to those carrying a digit somewhere, so
// arbitrary family shapes like `D-B<n>` are found in prose without a bespoke alternative
// per shape; a stoplist excludes acronyms that happen to contain a digit-like run).
const ID_TOKEN_RE = /\b[A-Z][A-Z0-9]*(?:-[A-Za-z0-9]+)*\b/g;
const ID_STOPLIST = new Set(['UTF8', 'SHA256', 'ISO8601', 'HTTP2', 'X11', 'MD5', 'I18N', 'E2E']);

export function buildGlossaryPanel(glossaryPath) {
  if (!glossaryPath || !fs.existsSync(glossaryPath)) {
    return {
      html: '<details class="glossary"><summary>Glossary</summary><p>GLOSSARY.md not generated yet — IDs on this page are unexpanded.</p></details>',
      index: { literals: new Map(), families: [], rows: [] },
      warning: 'GLOSSARY.md not generated yet',
    };
  }
  const text = fs.readFileSync(glossaryPath, 'utf-8');
  const index = buildGlossaryIndex(text);
  const tableRows = index.rows
    .map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.expansion)}</td><td>${esc(r.where)}</td></tr>`)
    .join('\n');
  const html = `<details class="glossary"><summary>Glossary</summary><div class="overflow"><table><tr><th>ID</th><th>Means</th><th>Where defined</th></tr>${tableRows}</table></div></details>`;
  return { html, index, warning: null };
}

// First-use expansion pass over assembled body HTML, skipping <code>/<pre>/<script> content
// and a rendered `glossary` block's own table (AMD-11 — its escaped family-pattern cells,
// e.g. "V4A&lt;n&gt;", are not prose to scan). The collapsed {{GLOSSARY}} panel is never in
// bodyHtml at all (a separate template slot), so it is excluded structurally, not by pattern.
export function expandFirstUse(bodyHtml, glossaryIndex) {
  const seen = new Set();
  const warnings = [];
  const PROTECTED_RE = /(<(?:code|pre|script)\b[^>]*>[\s\S]*?<\/(?:code|pre|script)>|<div class="glossary-table-block">[\s\S]*?<\/div>\s*<\/div>)/i;
  const segments = bodyHtml.split(PROTECTED_RE);
  for (let s = 0; s < segments.length; s++) {
    if (s % 2 === 1) continue; // inside a protected tag — untouched
    segments[s] = segments[s].replace(ID_TOKEN_RE, (id) => {
      if (!/\d/.test(id) || ID_STOPLIST.has(id)) return id; // not ID-shaped — leave untouched, no warning
      const known = isKnownGlossaryId(id, glossaryIndex);
      if (!known) {
        if (!warnings.includes(id)) warnings.push(id);
        return id;
      }
      if (!seen.has(id)) {
        seen.add(id);
        const expansion = glossaryExpansionFor(id, glossaryIndex);
        return `<abbr class="gl" title="${esc(expansion)}">${id}</abbr><span class="gl-x">(${esc(expansion)})</span>`;
      }
      return `<abbr>${id}</abbr>`;
    });
  }
  return { html: segments.join(''), warnings };
}

// ---------------------------------------------------------------------------
// Model-ID leak lint (G-4, D-A12)
// ---------------------------------------------------------------------------

export function findModelIdLeaks(text, allowTokens) {
  const allow = new Set(allowTokens || []);
  const found = [];
  let m;
  MODEL_ID_RE_G.lastIndex = 0;
  while ((m = MODEL_ID_RE_G.exec(text))) {
    if (!allow.has(m[0]) && !found.includes(m[0])) found.push(m[0]);
  }
  return found;
}

// ---------------------------------------------------------------------------
// CSS token audit (D-A14, C-E2-13)
// ---------------------------------------------------------------------------

export function auditCssTokens(styleBlock) {
  const rootMatch = styleBlock.match(/(?<![\w\]])\:root\s*\{([^}]*)\}/);
  const declared = new Set();
  if (rootMatch) {
    let m;
    const declRe = /--([\w-]+)\s*:/g;
    while ((m = declRe.exec(rootMatch[1]))) declared.add(m[1]);
  }
  const referenced = new Set();
  let m2;
  const refRe = /var\(--([\w-]+)\)/g;
  while ((m2 = refRe.exec(styleBlock))) referenced.add(m2[1]);
  const missing = [...referenced].filter((t) => !declared.has(t));
  return { missing, declared, referenced };
}

export { ROLE_KEYS };

// ---------------------------------------------------------------------------
// Embed reading (D-A6 ctx.bases: manifest dir, then CWD — build-report.py:106)
// ---------------------------------------------------------------------------

export function readEmbed(relPath, bases) {
  for (const base of bases) {
    const p = path.join(base, relPath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { content: fs.readFileSync(p, 'utf-8'), absPath: p };
    }
  }
  return null;
}

const TONES = { ok: 'b-ok', hold: 'b-hold', open: 'b-open', act: 'b-act' };

function renderCardItem(c, ctx) {
  const out = ['<div class="card"><h3>'];
  if (c.id) out.push(`<span class="id">${esc(String(c.id))}</span>`);
  out.push(` ${c.title || ''}`);
  if (c.badge) {
    const cls = TONES[c.badge.tone] || 'b-act';
    out.push(` <span class="badge ${cls}">${esc(c.badge.label || '')}</span>`);
  }
  if (c.rename_html) out.push(`<span class="rename">${sanitizeRawHrefs(c.rename_html)}</span>`);
  out.push('</h3>');
  out.push(sanitizeRawHrefs(c.body_html || ''));
  if (c.test_html) out.push(`<div class="test"><b>How to test</b>${sanitizeRawHrefs(c.test_html)}</div>`);
  for (const e of c.embeds || []) {
    const found = readEmbed(e.path, ctx.bases);
    let content;
    if (!found) {
      ctx.warnings.push(`embed not found: ${e.path}`);
      content = `*(report file not found at build time: \`${e.path}\`)*`;
    } else {
      content = escapeScriptBreakout(sanitizeMarkdownLinks(found.content));
    }
    const label = esc(e.label || 'Full report');
    out.push(
      `<details class="more"><summary>${label}</summary>\n` +
      `<p class="srcnote">Rendered from <code>${esc(e.path)}</code>:</p>\n` +
      `<div class="mdout"><script type="text/markdown">\n${content}\n</script></div>\n</details>`
    );
  }
  out.push('</div>');
  return out.join('\n');
}

function renderTableBlock(b) {
  const out = ['<div class="overflow"><table>'];
  if (b.headers) out.push('<tr>' + b.headers.map((h) => `<th>${esc(h)}</th>`).join('') + '</tr>');
  const rows = b.rows || [];
  for (const row of rows) out.push('<tr>' + row.map((c) => `<td>${c}</td>`).join('') + '</tr>');
  if (b.computed_footer) {
    const footer = (rows[0] || []).map((_, colIdx) => {
      let sum = 0, any = false;
      for (const row of rows) {
        const n = Number(String(row[colIdx]).replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(n) && String(row[colIdx]).trim() !== '') { sum += n; any = true; }
      }
      return any ? String(sum) : '';
    });
    out.push('<tr class="footer">' + footer.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>');
  }
  out.push('</table></div>');
  return out.join('\n');
}

function renderDecisionCard(b, ctx) {
  if (b.status === 'open' && (!b.why_yours_html || !b.recommendation)) {
    return { fatal: false, html: '', warnings: [`decision-card ${b.id}: status:open requires why_yours_html and recommendation`] };
  }
  if (b.status === 'ruled' && !b.ruling) {
    return { fatal: false, html: '', warnings: [`decision-card ${b.id}: status:ruled requires ruling`] };
  }
  const out = ['<div class="card decision-card"><h3>'];
  if (b.id) out.push(`<span class="id">${esc(String(b.id))}</span>`);
  const statusCls = b.status === 'ruled' ? 'b-ok' : 'b-open';
  out.push(` <span class="badge ${statusCls}">${esc(b.status || '')}</span>`);
  if (b.deadline) out.push(`<span class="rename">deadline: ${esc(b.deadline)}</span>`);
  out.push('</h3>');
  if (b.question_html) out.push(`<div class="q">${sanitizeRawHrefs(b.question_html)}</div>`);
  if (Array.isArray(b.options) && b.options.length) {
    out.push('<ul class="options">' + b.options.map((o) => `<li>${esc(String(o))}</li>`).join('') + '</ul>');
  }
  if (b.recommendation) out.push(`<p class="recommendation"><b>Recommendation:</b> ${esc(b.recommendation)}</p>`);
  if (b.why_yours_html) out.push(`<div class="test"><b>Why yours</b>${sanitizeRawHrefs(b.why_yours_html)}</div>`);
  if (b.unblocks_html) out.push(`<div class="unblocks">${sanitizeRawHrefs(b.unblocks_html)}</div>`);
  if (b.ruling) out.push(`<p class="ruling"><b>Ruling:</b> ${esc(b.ruling)}</p>`);
  if (b.embed) {
    const found = readEmbed(b.embed.path, ctx.bases);
    let content;
    if (!found) { ctx.warnings.push(`embed not found: ${b.embed.path}`); content = `*(report file not found at build time: \`${b.embed.path}\`)*`; }
    else content = escapeScriptBreakout(sanitizeMarkdownLinks(found.content));
    out.push(`<details class="more"><summary>${esc(b.embed.label || 'Full report')}</summary><div class="mdout"><script type="text/markdown">\n${content}\n</script></div></details>`);
  }
  out.push('</div>');
  if (b.id) ctx.rulingLog.push({ id: b.id, value: b.ruling || b.recommendation || '' });
  return { fatal: false, html: out.join('\n'), warnings: [] };
}

function renderEmbedBlock(b, ctx) {
  const found = readEmbed(b.path, ctx.bases);
  if (!found) {
    ctx.warnings.push(`embed not found: ${b.path}`);
    return { fatal: false, html: `<p class="warn">report file not found at build time</p>`, warnings: [] };
  }
  const content = escapeScriptBreakout(sanitizeMarkdownLinks(found.content));
  const label = esc(b.label || 'Full report');
  const html = `<details class="more" open><summary>${label}</summary><div class="mdout"><script type="text/markdown">\n${content}\n</script></div></details>`;
  return { fatal: false, html, warnings: [] };
}

function renderMockup(b) {
  if (!b.provenance || b.provenance.read_only !== true) {
    const html = `<div class="mock-win"><div class="mock-bar"><span class="mock-dots">●●●</span><span class="mock-label">${esc(b.label || '')}</span><span class="mock-chip mock-bad">provenance missing — not drawn from measured rows</span></div><div class="mock-body">${b.html || b.content || ''}</div></div>`;
    return { fatal: false, html, warnings: [`mockup ${b.id || b.label || ''}: provenance missing`] };
  }
  const scopedCss = b.css ? String(b.css).replace(/(^|\})\s*([^{}]+)\{/g, (m, brace, sel) => `${brace} #${b.id || 'mock'} ${sel.trim()}{`) : '';
  const html = `<style>${scopedCss}</style><div class="mock-win" id="${esc(b.id || 'mock')}"><div class="mock-bar"><span class="mock-dots">●●●</span><span class="mock-label">${esc(b.label || '')}</span><span class="mock-chip mock-ok">provenance: ${esc(b.provenance.source || '')}</span></div><div class="mock-body">${b.html || b.content || ''}</div></div>`;
  return { fatal: false, html, warnings: [] };
}

function renderMeasurement(b) {
  if (b.read_only !== true) {
    return { fatal: true, reason: 'measurement read_only:false — a measurement that wrote is not a measurement' };
  }
  const html = `<div class="measure"><span class="mvalue">${esc(String(b.value))}</span><span class="munit">${esc(b.unit || '')}</span><p class="msrc">read from <code>${esc(b.where || '')}</code> at ${esc(b.read_at || '')} · read-only</p></div>`;
  return { fatal: false, html, warnings: [] };
}

function renderStates(b) {
  const cols = ['good', 'empty', 'misconfigured'];
  const colorFor = { good: 'var(--ok)', empty: 'var(--muted)', misconfigured: 'var(--bad)' };
  const warnings = [];
  const parts = cols.map((k) => {
    if (!b[k]) {
      warnings.push(`states: missing "${k}"`);
      return `<div class="state-col" style="color:var(--muted)"><h4>${k}</h4><p>not enumerated — this state has not been designed</p></div>`;
    }
    return `<div class="state-col" style="color:${colorFor[k]}"><h4>${k}</h4><p>${esc(b[k].text || b[k].html || '')}</p></div>`;
  });
  return { fatal: false, html: `<div class="three">${parts.join('')}</div>`, warnings };
}

function renderFlow(b, ctx) {
  ctx.needsMermaid.v = true;
  const escaped = escapeScriptBreakout(esc(b.source || ''));
  const caption = 'diagram unavailable — mermaid script did not load';
  return {
    fatal: false,
    html: `<pre class="mermaid" data-src="flow">${escaped}</pre><noscript><p class="warn">${caption}</p></noscript>`,
    warnings: [],
  };
}

function renderRulings(b) {
  const rows = (b.rows || []).map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.ruling)}</td><td>${esc(r.effect)}</td></tr>`).join('');
  return { fatal: false, html: `<div class="overflow"><table><tr><th>ID</th><th>Ruling</th><th>Effect</th></tr>${rows}</table></div>`, warnings: [] };
}

function extractPriorIds(fromText) {
  const ids = [];
  const lines = fromText.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*\|\s*([A-Za-z][A-Za-z0-9_-]*)\s*\|/);
    if (!m) continue;
    const id = m[1];
    if (id === 'ID' || /^-+$/.test(id)) continue;
    ids.push(id);
  }
  return ids;
}

function renderRulingsForward(b, ctx) {
  const warnings = [];
  let priorIds = [];
  if (b.from) {
    const found = readEmbed(b.from, ctx.bases) || (fs.existsSync(b.from) ? { content: fs.readFileSync(b.from, 'utf-8') } : null);
    if (found) priorIds = extractPriorIds(found.content);
    else warnings.push('no earlier rulings to carry');
  } else {
    warnings.push('no earlier rulings to carry');
  }
  const currentIds = new Set((b.rows || []).map((r) => r.id));
  const dropped = priorIds.filter((id) => !currentIds.has(id));
  if (dropped.length) {
    return { fatal: false, html: '', warnings: [`rulings-forward: dropped prior item(s): ${dropped.join(', ')}`], forwardFatalWarn: true };
  }
  const rows = (b.rows || []).map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.your_call || '')}</td><td>${esc(r.state || '')}</td></tr>`).join('');
  return { fatal: false, html: `<h3>Your rulings</h3><div class="overflow"><table><tr><th>Item</th><th>Your call</th><th>State</th></tr>${rows}</table></div>`, warnings };
}

function renderCopyRulings(b, ctx) {
  const lines = ctx.rulingLog.map((r) => `${r.id}: ${r.value}`);
  return { fatal: false, html: `<pre class="copy">${esc(lines.join('\n'))}</pre><button class="copy-btn" type="button" data-copy-target="prev">copy</button>`, warnings: [] };
}

function renderGlossaryBlock(b, ctx) {
  const p = b.path ? path.join(ctx.bases[0], b.path) : ctx.glossaryPath;
  if (!p || !fs.existsSync(p)) return { fatal: false, html: '<p>GLOSSARY.md not generated yet</p>', warnings: ['glossary block: file not found'] };
  const { rows } = buildGlossaryIndex(fs.readFileSync(p, 'utf-8'));
  const trs = rows.map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.expansion)}</td><td>${esc(r.where)}</td></tr>`).join('');
  // AMD-11: this table's own escaped family-pattern cells (e.g. "V4A&lt;n&gt;") must never
  // be re-scanned as prose by the first-use pass — wrapped so expandFirstUse can skip it,
  // exactly like <code>/<pre> (its own visible rendering — a plain, non-collapsed table per
  // D-A11 — is unchanged; this is a scan boundary marker, not a display change).
  return { fatal: false, html: `<div class="glossary-table-block"><div class="overflow"><table><tr><th>ID</th><th>Means</th><th>Where defined</th></tr>${trs}</table></div></div>`, warnings: [] };
}

function renderLockbox(b) {
  const items = (b.items || []).map((it) => `<li>${esc(String(it))}</li>`).join('');
  return { fatal: false, html: `<div class="lockbox"><p class="lb-head">${esc(b.owner || '')} · ${esc(b.date || '')}</p><ul>${items}</ul></div>`, warnings: [] };
}

function renderTally(b, ctx) {
  const groups = b.groups || [];
  const tiles = groups.map((g) => {
    const section = ctx.sectionsById.get(g.rows_from);
    if (!section) return { html: `<div class="tally-tile"><span class="tval">—</span><span class="tlabel">${esc(g.label || '')}</span></div>`, warn: `tally: section "${g.rows_from}" not found` };
    const count = (section.blocks || []).filter((bl) => !g.type || bl.type === g.type).length;
    return { html: `<div class="tally-tile"><span class="tval">${count}</span><span class="tlabel">${esc(g.label || '')}</span></div>` };
  });
  const warnings = tiles.filter((t) => t.warn).map((t) => t.warn);
  return { fatal: false, html: `<div class="tally-row">${tiles.map((t) => t.html).join('')}</div>`, warnings };
}

const TRIAGE_VERDICTS = ['plan', 'build', 'decide', 'skip'];
function renderTriageCard(b) {
  if (!TRIAGE_VERDICTS.includes(b.verdict)) {
    return { fatal: true, reason: `triage-card: verdict "${b.verdict}" outside plan|build|decide|skip` };
  }
  const rows = ['what', 'why', 'need', 'decide', 'depends']
    .filter((k) => b[k])
    .map((k) => `<tr><th>${k}</th><td>${esc(b[k])}</td></tr>`).join('');
  return {
    fatal: false,
    html: `<div class="triage-card"><table>${rows}</table><div class="verdict-box">verdict: <b>${esc(b.verdict)}</b></div></div>`,
    warnings: [],
  };
}

function renderCopy(b) {
  return { fatal: false, html: `<pre class="copy">${esc(b.content || '')}</pre><button class="copy-btn" type="button" data-copy-target="prev">copy</button>`, warnings: [] };
}

function renderHtmlBlock(b, ctx) {
  ctx.htmlBlockCount.n++;
  const content = escapeScriptBreakout(sanitizeRawHrefs(b.content || ''));
  return { fatal: false, html: content, warnings: [] };
}

const BLOCKS = {
  table: (b) => ({ fatal: false, html: renderTableBlock(b), warnings: [] }),
  cards: (b, ctx) => ({ fatal: false, html: (b.items || []).map((c) => renderCardItem(c, ctx)).join('\n'), warnings: [] }),
  'decision-card': renderDecisionCard,
  embed: renderEmbedBlock,
  mockup: (b) => renderMockup(b),
  measurement: (b) => renderMeasurement(b),
  states: (b) => renderStates(b),
  flow: (b, ctx) => renderFlow(b, ctx),
  rulings: (b) => renderRulings(b),
  'rulings-forward': (b, ctx) => renderRulingsForward(b, ctx),
  'copy-rulings': (b, ctx) => renderCopyRulings(b, ctx),
  glossary: (b, ctx) => renderGlossaryBlock(b, ctx),
  lockbox: (b) => renderLockbox(b),
  tally: (b, ctx) => renderTally(b, ctx),
  'triage-card': (b) => renderTriageCard(b),
  copy: (b) => renderCopy(b),
  html: (b, ctx) => renderHtmlBlock(b, ctx),
};

export const BLOCK_TYPES = Object.keys(BLOCKS);

// ---------------------------------------------------------------------------
// Full render pipeline
// ---------------------------------------------------------------------------

// Renders a normalized (post legacyToBlocks) manifest into a body HTML string.
// Returns { fatal, reason, html, warnings, htmlBlocks, modelIdLeaks }.
export function renderBody(manifest, { bases, glossaryPath }) {
  const sectionsById = new Map();
  for (const s of manifest.sections || []) if (s.id) sectionsById.set(s.id, s);

  const { html: glossaryPanelHtml, index: glossaryIndex, warning: glossaryWarn } = buildGlossaryPanel(glossaryPath);

  const ctx = {
    bases,
    warnings: [],
    htmlBlockCount: { n: 0 },
    needsMermaid: { v: false },
    rulingLog: [],
    sectionsById,
    glossaryPath,
  };
  if (glossaryWarn) ctx.warnings.push(glossaryWarn);

  const parts = [];
  for (const section of manifest.sections || []) {
    if (section.heading) parts.push(`<h2>${esc(section.heading)}</h2>`);
    for (const block of section.blocks || []) {
      const fn = BLOCKS[block.type];
      if (!fn) { ctx.warnings.push(`unknown block type: ${block.type}`); continue; }
      const result = fn(block, ctx);
      if (result.fatal) return { fatal: true, reason: result.reason };
      if (result.html) parts.push(result.html);
      if (result.warnings && result.warnings.length) ctx.warnings.push(...result.warnings);
    }
  }
  let bodyHtml = parts.join('\n');

  const { html: expandedHtml, warnings: idWarnings } = expandFirstUse(bodyHtml, glossaryIndex);
  bodyHtml = expandedHtml;
  for (const id of idWarnings) ctx.warnings.push(`glossary: ID "${id}" used but not in GLOSSARY.md`);

  const allowTokens = manifest.allow_tokens || [];
  const leaks = findModelIdLeaks(bodyHtml, allowTokens);
  for (const leak of leaks) ctx.warnings.push(`model ID "${leak}" in rendered HTML`);

  return {
    fatal: false,
    html: bodyHtml,
    glossaryPanelHtml,
    warnings: ctx.warnings,
    htmlBlocks: ctx.htmlBlockCount.n,
    needsMermaid: ctx.needsMermaid.v,
    modelIdLeaks: leaks,
  };
}

// ---------------------------------------------------------------------------
// Template assembly
// ---------------------------------------------------------------------------

const TEMPLATE_PATH = path.join(__dirname, 'report-template.html');

export function loadTemplate() {
  return fs.readFileSync(TEMPLATE_PATH, 'utf-8');
}

const MERMAID_SCRIPT_TAG =
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js"></script>\n' +
  '<script>mermaid.initialize({securityLevel:\'strict\',startOnLoad:true,theme:document.documentElement.getAttribute(\'data-theme\')===\'dark\'?\'dark\':\'default\'});</script>';

export function assembleHtml({ manifest, kind, template, brandInfo, glossaryPanelHtml, bodyHtml, needsMermaid, sourceHash, sourceRel, embedHashes, templateHash, htmlBlocks }) {
  const brandCss = emitBrandCss(brandInfo.brand);
  const fontLink = emitFontLink(brandInfo.brand);
  const badge = `<p class="brand-badge">brand: ${brandInfo.source === 'default' ? 'Her0 default' : brandInfo.source}</p>`;
  const embedsStr = Object.entries(embedHashes || {}).map(([p, h]) => `${p} sha256=${h}`).join(';');
  const metaStamps = [
    `<meta name="planit-source" content="${esc(sourceRel !== undefined ? sourceRel : (manifest.source ? manifest.source.path : ''))} sha256=${sourceHash}">`,
    `<meta name="planit-embeds" content="${esc(embedsStr)}">`,
    `<meta name="planit-brand" content="${brandInfo.source === 'default' ? `default sha256=${brandInfo.hash}` : `${brandInfo.source} sha256=${brandInfo.hash}`}">`,
    `<meta name="planit-renderer" content="build-report.mjs/${RENDERER_VERSION} template sha256=${templateHash}">`,
    `<meta name="planit-kind" content="${esc(kind || '')}">`,
  ].join('\n');

  let page = template
    .replaceAll('{{TITLE}}', esc(manifest.title))
    .replaceAll('{{EYEBROW}}', esc(manifest.eyebrow || kind || ''))
    .replaceAll('{{SUBTITLE}}', manifest.subtitle_html || '')
    .replaceAll('{{BRAND_BADGE}}', badge)
    .replaceAll('{{META_STAMPS}}', metaStamps)
    .replaceAll('{{BRAND_CSS}}', brandCss)
    .replaceAll('{{FONT_LINK}}', fontLink)
    .replaceAll('{{GLOSSARY}}', glossaryPanelHtml)
    .replaceAll('{{BODY}}', bodyHtml)
    .replaceAll('{{MERMAID_SCRIPT}}', needsMermaid ? MERMAID_SCRIPT_TAG : '')
    .replaceAll('{{FOOTER}}', `<p class="footer">html-blocks=${htmlBlocks}</p>`)
    .replaceAll('{{CLIENT_MD_JS}}', CLIENT_MD_JS);
  return page;
}

// ---------------------------------------------------------------------------
// --open platform routing (D-A5)
// ---------------------------------------------------------------------------

export function openInBrowser(filePath, env) {
  const platform = env.PLANIT_TEST_PLATFORM || process.platform;
  // PLANIT_FORCE_TTY lets tests deterministically exercise both branches of the
  // TTY check on hosts (and CI) where a spawned child's stdout is never a real TTY.
  const isTTY = env.PLANIT_FORCE_TTY === '1' ? true : env.PLANIT_FORCE_TTY === '0' ? false : process.stdout.isTTY;
  if (env.PLANIT_NO_OPEN === '1' || !isTTY) {
    process.stdout.write('note: --open suppressed (headless)\n');
    return;
  }
  if (platform === 'darwin') {
    const r = spawnSync('open', ['-a', 'Google Chrome', filePath]);
    if (r.status !== 0) spawnSync('open', [filePath]);
  } else if (platform === 'linux') {
    spawnSync('xdg-open', [filePath]);
  } else if (platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', filePath]);
  }
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

function resolveOutPath(manifest, manifestDir, outFlag) {
  if (outFlag) return path.isAbsolute(outFlag) ? outFlag : path.join(process.cwd(), outFlag);
  let outPath = manifest.output;
  if (!path.isAbsolute(outPath)) {
    const candidate = path.join(manifestDir, outPath);
    outPath = fs.existsSync(path.dirname(candidate)) ? candidate : path.join(process.cwd(), outPath);
  }
  return outPath;
}

export function renderToBuffer(manifestPath, cliFlags) {
  const manifestDir = path.dirname(path.resolve(manifestPath));
  const raw = loadManifestRaw(manifestPath);
  const prep = prepareManifest(raw, cliFlags.strict);
  if (prep.fatal) return { fatal: true, reason: prep.reason };
  const manifest = prep.manifest;
  const bases = [manifestDir, process.cwd()];

  const glossaryPath = manifest.glossary && manifest.glossary.path ? path.join(manifestDir, manifest.glossary.path) : null;
  const bodyResult = renderBody(manifest, { bases, glossaryPath });
  if (bodyResult.fatal) return { fatal: true, reason: bodyResult.reason };

  const brandInfo = resolveBrand({ brandFlag: cliFlags.brand, manifestDir, cwd: process.cwd() });
  const template = loadTemplate();
  const templateHash = sha256(template);

  const outDir = path.dirname(resolveOutPath(manifest, manifestDir, cliFlags.out));

  // AMD-9 / T-V4A1-13: every stamped relpath is relative to the TWIN's own directory
  // (CONTRACT §4.3), never the manifest's — same rule embeds already followed below.
  const sourcePath = manifest.source && manifest.source.path ? path.join(manifestDir, manifest.source.path) : null;
  const sourceHash = sourcePath && fs.existsSync(sourcePath) ? sha256(fs.readFileSync(sourcePath)) : sha256('');
  const sourceRel = sourcePath && fs.existsSync(sourcePath) ? toRelForward(outDir, sourcePath) : (manifest.source ? manifest.source.path : '');

  const embedHashes = {};
  for (const s of manifest.sections || []) {
    for (const b of s.blocks || []) {
      const p = b.path || (b.embed && b.embed.path);
      if (!p) continue;
      const found = readEmbed(p, bases);
      if (found) embedHashes[toRelForward(outDir, found.absPath)] = sha256(fs.readFileSync(found.absPath));
    }
  }

  const allWarnings = [...(prep.warnings || []), ...bodyResult.warnings];
  if (brandInfo.warning) allWarnings.push(brandInfo.warning);
  const html = assembleHtml({
    manifest,
    kind: prep.kind,
    template,
    brandInfo,
    glossaryPanelHtml: bodyResult.glossaryPanelHtml,
    bodyHtml: bodyResult.html,
    needsMermaid: bodyResult.needsMermaid,
    sourceHash,
    sourceRel,
    embedHashes,
    templateHash,
    htmlBlocks: bodyResult.htmlBlocks,
  });

  // AMD-9 / T-V4A1-14: scan only the rendered <style> blocks — embedded content (e.g. a
  // CONTRACT.md excerpt whose prose literally contains "var(--token)") must never trigger
  // this build-time authoring lint.
  const styleBlocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const cssAudit = auditCssTokens(styleBlocks);
  if (cssAudit.missing.length) {
    process.stderr.write(`WARNING: CSS tokens referenced but not declared in :root: ${cssAudit.missing.join(', ')}\n`);
  }

  return {
    fatal: false,
    html,
    warnings: allWarnings,
    manifest,
    brandInfo,
    outPath: resolveOutPath(manifest, manifestDir, cliFlags.out),
  };
}

function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2));
  if (positional.length !== 1) die('usage: build-report.mjs <manifest.json> [--open] [--brand <path>|default] [--out <file>] [--check] [--strict]');
  const manifestPath = positional[0];

  let result;
  try {
    result = renderToBuffer(manifestPath, flags);
  } catch (e) {
    die(e && e.message ? e.message : String(e));
    return;
  }
  if (result.fatal) die(result.reason);

  const buf = Buffer.from(result.html, 'utf-8');

  if (flags.check) {
    if (!fs.existsSync(result.outPath)) {
      process.stderr.write(`stale-or-missing: ${result.outPath} does not exist\n`);
      process.exit(2);
    }
    const existing = fs.readFileSync(result.outPath);
    if (Buffer.compare(existing, buf) === 0) {
      process.stdout.write(`identical: ${result.outPath}\n`);
      process.exit(0);
    }
    process.stderr.write(`stale-or-missing: ${result.outPath} differs from current render\n`);
    process.exit(2);
  }

  fs.mkdirSync(path.dirname(result.outPath), { recursive: true });
  fs.writeFileSync(result.outPath, buf);

  const stampHash = sha256(buf).slice(0, 12);
  const brandTag = result.brandInfo.source === 'default' ? 'default' : result.brandInfo.source;
  const htmlBlocksMatch = result.html.match(/html-blocks=(\d+)/);
  const htmlBlocksN = htmlBlocksMatch ? htmlBlocksMatch[1] : '0';
  process.stdout.write(`built: ${result.outPath} (${buf.length} bytes) brand=${brandTag} stamp=sha256:${stampHash} html-blocks=${htmlBlocksN}\n`);

  for (const w of result.warnings) process.stderr.write(`WARNING: ${w}\n`);

  if (flags.open) openInBrowser(result.outPath, process.env);

  process.exit(result.warnings.length ? 2 : 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) main();
