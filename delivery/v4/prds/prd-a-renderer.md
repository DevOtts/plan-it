# PRD — plan-it v4, Squad SQ-A: Renderer (HTML report layer)

| Status | Owner | Date | Shape/Size | Execution |
|---|---|---|---|---|
| NOT-STARTED | SQ-A (planning, mid tier — RUN-POLICY, `delivery/v4/CONTRACT.md` §RUN-POLICY) | 2026-09-07 | Shape 1 lane / M | `epic/v4a-<slug>` branches, worktrees-only (G-10), per `delivery/v4/CONTRACT.md` §2 |

Law: `delivery/v4/CONTRACT.md` **v1.0-draft — FROZEN FOR SQUADS** — this PRD does
not amend it. Any build-order dependency or apparent contradiction found while
authoring is filed in §9 "Corrections flagged for the orchestrator" below, never
edited into the CONTRACT directly (only the orchestrator amends, dated `AMD-`,
`delivery/decisions.md`).

Glossary (first use, full definitions in `delivery/v4/GLOSSARY.md`): **HTML**
HyperText Markup Language · **CLI** command-line interface · **CDN** content
delivery network · **XSS** cross-site scripting · **WCAG** Web Content
Accessibility Guidelines · **GFM** GitHub-Flavored Markdown · **twin** the
`<NAME>.html` rendered beside a canonical `<NAME>.md` · **manifest** the JSON a
low-tier author writes for the renderer (`planit-report/1`) · **stamp** the
`<meta name="planit-*">` provenance metas a twin carries · **tier** top/mid/low,
a model class resolved at execution time, never a model ID.

---

## 1. Summary

SQ-A ports plan-it's HTML report layer from a proven but narrow ancestor —
conclude-it's `~/.claude/skills/conclude-it/build-report.py` (147 lines) plus
its 138-line template — into a zero-dependency Node.js renderer
(`scripts/build-report.mjs`) that ships inside the plan-it plugin, is
mirror-checked byte-for-byte against its root copy, and expresses the full
"report family" of eight document kinds the v4 pipeline now produces
(SCOPE-BRIEF, TRIAGE, RESEARCH-REPORT, DECISIONS, CONTRACT, KICKOFF,
PLAN-REVIEW, GLOSSARY) through a 17-type block catalogue instead of the
ancestor's three slots (table/cards/html). Every rendered twin carries a
provenance stamp gate-check's `mirror` verb (SQ-B) can verify against the
markdown source, embeds, brand file and template — closing the exact failure
the field already produced once with zero enforcement (`CONTRACT.html` drifted
one section behind its `.md` with no stamp, findings §2.2 / F-A9). The renderer
is the only thing in this package that ever writes a `<script>`-carrying,
browser-opened file, so it is also where the package's two visible-surface
hazards live and must be closed: an incomplete `</script` escape that a
case-flipped `</SCRIPT>` breaks out of (F-A3), and brand accent colors that
fail WCAG AA as light-mode body text (F-A13). Twins are created locally by
default and never published as claude.ai artifacts (G-7); `--open` fires only
when the model explicitly asks for it, and is suppressed headless.

## 2. Problem & goals

The problem, precisely: v3 produced zero HTML (findings §2.2, F-A11); every
hand-built HTML in the field is a one-off with its own font stack, none uses
the Her0 brand, and the one real markdown↔HTML pair in production
(`CONTRACT.md`/`.html`, praxya) already drifted silently because nothing
hashes the relationship. SQ-A's job is to make that drift structurally
impossible and to give every v4 gate a rendered, brand-consistent, honest twin
instead of a wall of markdown.

Goals below are **testable and named by the CONTRACT §6 governance rule they
serve** — not new IDs, so a reviewer can jump straight to the rule text:

- **G-2 (zero dependencies).** `scripts/build-report.mjs` and every
  `tests/v4/renderer/*.mjs` script import `node:` builtins only — no
  `package.json`, no third-party parser, no bundler. Tested: T-V4A4-05.
- **G-4 (no hardcoded model IDs).** No `claude-*`-shaped model ID may survive
  into rendered HTML; the renderer's lint reuses the identical regex
  `planit-guard.mjs` already enforces (`/claude-[a-z0-9-]+/`, F-A16) and honors
  a per-manifest `allow_tokens[]` escape hatch for non-model names that
  happen to match the shape (`claude-cli-runner`, a real false positive in
  the field, F-A16). Tested: T-V4A3-04, T-V4A3-05.
- **G-5 (counts computed, never typed).** `tally` tiles and every
  `computed_footer` table total are counted from the sections/rows the
  manifest actually references at render time — a fourth row added to a
  fixture changes the number with zero manifest edit. Tested: T-V4A2-04.
- **G-6 (markdown canonical; HTML is a derived, stamped twin).** Every
  rendered twin carries `<meta name="planit-source">` (+`-embeds`,
  `-brand`, `-renderer`, `-kind`) naming the exact bytes it was rendered
  from, so SQ-B's `mirror` verb can recompute and compare — this is the
  mechanism that would have caught the praxya drift. Tested: T-V4A1-12 (SQ-A's
  side of the contract; SQ-B's `mirror` verb consumption is out of this
  lane — see §8).
- **G-7 (twins are local-only, never claude.ai artifacts).** `--open`
  defaults off; when passed, it never publishes anywhere network-reachable —
  it shells to the local OS opener only, and is suppressed by
  `PLANIT_NO_OPEN=1` or a non-TTY stdout so a headless/overnight run never
  tries to open a browser. Tested: T-V4A1-08, T-V4A1-09, T-V4A1-10.
- **G-8 (first-use rule).** The renderer, not the model, performs acronym/ID
  expansion: the collapsed glossary panel renders at the top of every kind,
  and the first prose occurrence of each glossary ID is wrapped
  `<abbr class="gl">` with one `.gl-x` expansion; later occurrences get only
  the `<abbr>`; code spans are never touched. Tested: T-V4A3-01, T-V4A3-02,
  T-V4A3-03.
- **G-12 (facts probed, never guessed; measurements are read-only or say so).**
  A `measurement` block asserting `read_only:false` is a render error (exit 1,
  nothing written) — a measurement that wrote is not a measurement. A
  `mockup` without `provenance{source,rows_read,read_at,read_only:true}`
  is never silently drawn — it renders visibly refused. Tested: T-V4A2-09
  (measurement), T-V4A2-08 (mockup).

**Non-goals (this lane, see §8 for full boundary list):** the `mirror`,
`glossary`, `archive`, `runs` gate-check verbs (SQ-B implements the checks
that *consume* the renderer's stamps — SQ-A only writes them correctly);
`--brand-init` scaffolding (out of 4.0.0 per design §10); GLOSSARY.md
*generation* from the package's own IDs (SQ-B/SQ-C; SQ-A only *renders* an
existing GLOSSARY.md); statechart states/transitions naming *when* each kind
renders (SQ-B, design §1); SKILL.md prose telling the model when to pass
`--open` or to prefer blocks over the `html` escape hatch (SQ-C).

## 3. Users & jobs

- **The owner** (Fernando, or any human at a gate) opens a twin in a real
  browser at G0/G1/G4-equivalent moments and needs, in order: what kind of
  document this is and its vocabulary (glossary panel, first thing on the
  page), the honest state of whatever it's showing (a `states` triptych that
  says "not enumerated" rather than silently omitting a case), and — for
  DECISIONS/PLAN-REVIEW — a queue of open items each carrying "why nobody
  should pick this for you," never a bare menu.
- **The low-tier author** (a mid/low-tier subagent authoring a manifest, per
  RUN-POLICY) writes only JSON — no HTML, no CSS, no markdown-rendering logic
  — and needs a CLI that fails loudly and specifically (`RENDER_FAILED` vs
  `RENDERED_PARTIAL` vs `RENDERED`, CONTRACT §3.2) rather than silently
  producing a broken or misleading page. A legacy conclude-it-shaped manifest
  (title/sections/table/cards/embeds, no `schema`/`kind`) must still render
  without a rewrite, because conclude-it keeps using this exact shape.
- **The orchestrator / `handoff`** re-renders and re-verifies twins across an
  amendment loop (CONTRACT §3.1 `REVIEW_CONTRADICTED → parallelPlanning`) and
  needs determinism above all: same manifest + template + brand + embed bytes
  must produce byte-identical HTML, every time, with no timestamp or absolute
  path baked in, so a stale-vs-fresh comparison is a hash compare, not a diff.

## 4. Solution design

Numbered decisions, each grounded against the ancestor's exact `file:line`
(`~/.claude/skills/conclude-it/build-report.py`, `report-template.html`) and
the frozen CONTRACT section it must satisfy. All changes are **additive** to
the ecosystem — conclude-it's Python renderer is untouched and keeps running;
this is a new, separate Node port living inside the plugin (design §10
non-goal: "conclude-it migration" — SQ-A ships the destination, does not
migrate the source).

### D-A1 — CLI surface and exit-code contract
`build-report.py:97-143` is the whole program: read manifest → walk
`sections[]` → fill three template slots → write → print → exit. Port 1:1 in
shape, widen the surface to CONTRACT §4.1's exact signature:
`node scripts/build-report.mjs <manifest.json> [--open] [--brand <path>|default]
[--out <file>] [--check] [--strict]`. Exit codes are **CONTRACT §3.2's
core-logic model, not a new invention**: 0 = `RENDERED`, 2 = `RENDERED_PARTIAL`
(warnings; page still written with visible placeholders — same contract as
`build-report.py:143`'s `sys.exit(2 if problems else 0)`), 1 = `RENDER_FAILED`
(nothing written — widens `die()` at `build-report.py:42-44` from "bad usage"
to every hard-error case: unreadable manifest, unknown `kind`, a
`measurement` with `read_only:false`). `--check`: render to memory, `Buffer.compare`
against the existing twin, never write — this is the function `gate-check
mirror` (SQ-B) calls; it is the mechanism, and SQ-B is the caller (§8
boundary). `--strict` widens `die()`'s reach: a manifest missing `schema`/`kind`
is `RENDER_FAILED` under `--strict`, `RENDERED_PARTIAL` (kind `LEGACY`)
without it — the back-compat path D-A2 describes.

### D-A2 — Manifest schema, `kind`, and legacy back-compat
`build-report.py:12-33`'s manifest shape (`title`, `subtitle_html`, `output`,
`sections[]` where a section is `{heading?, table?, cards?, html?}`) is the
literal ancestor of CONTRACT §4.2's `planit-report/1` schema. Every legacy
field is accepted verbatim; a manifest with no `schema` key renders as `kind:
"LEGACY"` with an exit-2 warning (never `--strict`), each legacy `section`
rewritten internally to one or more `blocks[]` entries (`table`→`table`,
`cards`→`cards`, `html`→`html`) before it enters the same block-dispatch table
new manifests use — one rendering code path, two manifest dialects in,
per design §4.4's back-compat rule.

### D-A3 — Determinism and the stamp contract
`build-report.py` writes no timestamp today (verified, F-A2 — two consecutive
runs `cmp` clean) — this property is preserved and extended: **no absolute
paths** either. `node:crypto`'s `createHash('sha256')` (builtin, satisfies
G-2) computes four hashes at render time — source md, each embed, the brand
file, the template itself — written as the five metas CONTRACT §4.3 freezes
verbatim (`planit-source`, `planit-embeds`, `planit-brand`, `planit-renderer`,
`planit-kind`), relpaths forward-slash, no `./`, relative to the twin's own
directory (not the manifest's). This is what SQ-B's `mirror` verb reads; SQ-A's
job ends at "the stamp is correct and reproducible," not at building the
verb that consumes it (§8).

### D-A4 — Brand: role tokens, detection order, contrast-safe default
`report-template.html:8-17`'s three-block `:root` / `@media
(prefers-color-scheme: dark)` / `:root[data-theme="dark"]` pattern (F-A5) is
kept **verbatim as CSS structure**; what changes is that its 11 literal hex
values become **role tokens** filled from a `planit-brand/1` file
(CONTRACT §4.4: `bg card line ink muted accent accentBg ok warn bad info chip
hold` × light/dark, plus `fonts{display,body,mono,googleFontsHref}`).
Detection order is a first-hit-wins chain (`--brand` flag → `.plan-it/brand.json`
→ `brand.json`/`assets/brand/brand.json`/`docs/brand/brand.json`/`brand/brand.json`
→ a markdown-only guideline present but not tokenised → the bundled
`assets/brand/default.brand.json`). The bundled default is derived from
`assets/brand/Her0 brad guideline.md` §4 (L178-205: Ink `#0D1117`, Signal
`#00E5A0`, Flare `#FF6B4A`, Snow/Cloud/Mist/Slate/Steel/Carbon neutrals,
Valid/Warn/Fail/Info semantics) and §5 (L225-239: Space Grotesk / Inter /
JetBrains Mono), with the **R7 contrast mapping applied**: measured WCAG
ratios put Signal-on-Snow at 1.65:1 and Slate-on-Snow at 3.08:1 (both fail
body text, F-A13), so the default maps `muted→Steel` (8.28:1, passes) and
uses Signal/Flare/Info/Warn only as chip **backgrounds** behind Ink text or as
borders, never as light-mode body-text color — a deliberate, owner-flagged
deviation from the guideline's literal usage table, ratified as R7 in
`delivery/v4/DECISIONS.md`. The badge and `planit-brand` meta always name the
winning source (`default` or `repo:<relpath>`) plus its hash.

### D-A5 — `--open`: platform routing, never affects the exit code
`build-report.py:140-142` is macOS-only, unconditional, and has no
suppression path. Widen per CONTRACT §4.1: `darwin` → `spawnSync('open',
['-a','Google Chrome',file])`, non-zero exit → fallback `spawnSync('open',
[file])`; `linux` → `spawnSync('xdg-open',[file])`; `win32` → `spawnSync('cmd',
['/c','start','',file])`. Suppressed entirely (logs `note: --open suppressed
(headless)`, still exits per the render result) when `PLANIT_NO_OPEN=1` or
`!process.stdout.isTTY`. The open attempt's own success or failure **never**
changes `build-report.mjs`'s exit code — opening a browser is a convenience,
not part of the render contract.

### D-A6 — Block-dispatch architecture: one function per type, one honest failure per type
`build-report.py:110-118`'s section loop (`if s.get("table"): …`, `for c in
s.get("cards", []): …`) generalizes to a dispatch table keyed by
`block.type`, 17 entries (CONTRACT §4.2), each a pure function
`(block, ctx) => { html, warnings[], fatal? }` so a single block's failure
never corrupts another's output — `ctx` carries the embed base directories
(`build-report.py:106`'s `bases` list, unchanged: manifest dir, then CWD),
the glossary map (D-A11), and the running html-block counter (D-A6's own
stdout line, CONTRACT §4.1: `built: … html-blocks=<n>`).

### D-A7 — Decision queue: `decision-card`, `rulings`, `rulings-forward`, `copy-rulings`
`report-template.html:28-69`'s `.card`/`.badge`/`.id`/`.rename` markup and
`build-report.py:66-94`'s `render_card` (id chip, title, badge-by-tone,
optional rename chip, body, "How to test" block, embedded `<details>`) is the
direct ancestor of the `decision-card` block type; kept, extended with the
E3 fields CONTRACT §4.2 freezes: `kind∈decision|authorization|owner-action`,
`options[]`, `recommendation`, `why_yours_html` (the field's differentiator —
"why nobody should pick for you," findings §2.3/F-A8), `unblocks_html`,
optional `deadline`, `status∈open|ruled`, `ruling`. `rulings` renders the
`ID · Ruling · Effect` table the field already writes by hand (F-A8's
"Contract mirror" pattern); `rulings-forward` renders "Your rulings" —
`Item · Your call · State` — sourced from an earlier DECISIONS.md and fails
(exit 2) if a prior item is silently dropped (D5, CONTRACT C-E3-02);
`copy-rulings` (D5) emits every open+ruled ID as one deterministic,
document-order `<pre class="copy">ID: value</pre>` line the owner pastes back
into chat.

### D-A8 — Honest-state blocks: `mockup`, `measurement`, `states`
Three blocks whose entire purpose is refusing to lie (findings §2.5/F-A8,
governance G-12). `mockup` requires `provenance{source, rows_read, read_at,
read_only:true}`; absent → exit 2 and a **visible** red `.mock-bar` chip
"provenance missing — not drawn from measured rows" (never a silently
fabricated screenshot-alike). `measurement` requires `read_only:true`;
`read_only:false` is `RENDER_FAILED` (exit 1, nothing written) — a
measurement that wrote is not a measurement, no soft warning available.
`states` renders the good/empty/misconfigured triptych (`.three` grid,
F-A8's "the pane, in its three honest states" pattern); any of the three
missing renders that column grey, labeled "not enumerated — this state has
not been designed," plus exit 2 — an un-designed state is reported, not
hidden.

### D-A9 — `flow` (mermaid), pinned and offline-honest
`report-template.html` ships no mermaid today; the field's best reference
(SEED-DECISIONS-v2, 12 diagrams) loads `mermaid@10.9.1` from jsdelivr with
`securityLevel:'loose'` and freezes theme at page load (F-A8, F-A17). SQ-A
pins **cdnjs 10.9.1** (HTTP 200-verified, F-A17; 11.4.1 404s on the same
host) — the allow-listed CDN host, `securityLevel:'strict'` (never `'loose'`),
a `<pre class="mermaid">` carrying the **escaped** source so the diagram
degrades to readable text if the script fails to load, plus a `<noscript>`
saying the same. The `{{MERMAID_SCRIPT}}` template slot (D-A14) is emitted
only when ≥1 `flow` block exists in the manifest — a manifest with none
carries zero mermaid script tags, zero network dependency.

### D-A10 — Computed surfaces: `tally`, `lockbox`, `triage-card`, table footers
G-5's mechanism, concretely: `tally` groups declare `rows_from:<section id>`
and the renderer **counts** matching blocks in that section at render time —
never a manifest-supplied number (findings gap #10: SEED-TRIAGE's tally tiles
are hand-typed digits today; this closes exactly that). `table` blocks with
`computed_footer:true` sum numeric columns the same way. `lockbox` renders the
CONTRACT mirror's owner/date/items banner (F-A8's praxya pattern) verbatim as
static content — no computation, listed here only because it shares the
"structural, not prose" family. `triage-card` renders SEED-TRIAGE's anatomy
k/v grid + verdict box; a `verdict` outside `plan|build|decide|skip` is
`RENDER_FAILED` (exit 1) — an unrecognized verdict is a schema error, not a
warning.

### D-A11 — Glossary panel and first-use expansion (G-8)
Every kind renders exactly one `<details class="glossary">` immediately before
its first `<h2>`, built from the manifest's `glossary.path` (a `GLOSSARY.md`
the renderer only *reads*, per §8's boundary with SQ-B/SQ-C's generation
lint). The renderer then walks the assembled body text once, outside
`<code>`/`<pre>`, and wraps the **first** textual occurrence of each glossary
ID with `<abbr class="gl" title="<expansion>">ID</abbr>` followed by one
`.gl-x` small-text expansion; every later occurrence gets only the bare
`<abbr>`. ID matching is the union grammar design §4.8 specifies (`T-[A-Z]\d+
[A-Za-z0-9.]*-\d{2}`, epic/squad IDs, `G[0-4]`, `W\d+`, `D-?\d+`, `R\d+`,
status-vocabulary words). An ID matched in the body but absent from
`GLOSSARY.md` is a **soft** warning here (exit 2, listed on stderr) —
`handoff`'s hard fail on the same condition is SQ-B's lint (CONTRACT
C-E10-01/02, §8 boundary). Missing `GLOSSARY.md` entirely: the panel renders
"GLOSSARY.md not generated yet — IDs on this page are unexpanded," exit 2 —
never a silent empty panel.

### D-A12 — Model-ID leak lint (G-4)
`planit-guard.mjs`'s `MODEL_ID_RE = /claude-[a-z0-9-]+/` (F-A16, verbatim
from CONTRACT C-W3-02's v3 ancestor) is duplicated **byte-identical** into
`build-report.mjs` as a named constant with a comment pointing at the guard's
line, so the two never drift silently out of parity (flagged formally in §9
as a cross-lane coordination risk, since SQ-A cannot edit
`planit-guard.mjs` — SQ-B's exclusive file, CONTRACT §2). The lint runs over
every assembled `body_html`/`html`-typed block after markdown assembly, before
write; a match not present in the manifest's `allow_tokens[]` is exit 2,
naming the exact string (real false positives exist in the field —
`claude-sub`, `claude-cli-runner`, F-A16 — so the allow-list is per-manifest
and its use is visible on stdout, not silently loosened).

### D-A13 — Escape-hole closure (the security fix)
`build-report.py:52`'s `content.replace("</script", "<\\/script")` is
case-sensitive; a `</SCRIPT>` embed breaks the `text/markdown` script block
mid-parse (measured, F-A3). Fix: a case-insensitive regex
`/<\/(script)/gi` → `<\/$1`, applied to every embed **and** to any raw `html`
block content, plus `<!--` → `<\!--` (an HTML comment inside an embedded
script tag is also a breakout vector). `report-template.html:94`'s `esc()`
only escapes `& < >`; extended to escape `"` as well, so an attribute-quote
breakout (`[x](a" onmouseover="y)`) cannot inject a live attribute. Link
targets (`report-template.html:100`'s `inline()`, unconditional `href="$2"`)
are scheme-allow-listed at render time: `http:`, `https:`, `mailto:`, `#`, and
relative paths only — a `javascript:` href is rejected and rendered as inert
text, not a working link. Numbered lists (`report-template.html:126`,
currently a fake `<ul>` with a bold-printed number) become real `<ol>`.

### D-A14 — Template slots and CSS token audit
`{{TITLE}} {{EYEBROW}} {{SUBTITLE}} {{BRAND_BADGE}} {{META_STAMPS}}
{{BRAND_CSS}} {{FONT_LINK}} {{GLOSSARY}} {{BODY}} {{MERMAID_SCRIPT}}
{{FOOTER}}` — a superset of `build-report.py`'s three slots
(`{{TITLE}}`/`{{SUBTITLE}}`/`{{BODY}}`, `build-report.py:122-124`), every one
replaced unconditionally so no `{{` literal survives into output. Every
`var(--token)` referenced anywhere in the emitted `<style>` must resolve in
the bare, un-themed `:root` block (CONTRACT C-E2-13) — a token defined only
inside `@media` or `[data-theme]` is a build-time authoring bug in the brand
file/template, asserted by regex-collecting `var\(--[\w-]+\)` occurrences and
diffing against the bare `:root` declaration set.

### D-A15 — Zero-dependency discipline (G-2)
Every capability the port needs is a Node.js builtin already available at
node v20.19.2 (host fact, F-A18): `node:fs`, `node:path`, `node:crypto`
(SHA-256), `node:child_process` (`spawnSync` for `--open`). No
`package.json`, no npm install step, ever — the same zero-dep posture
`scripts/gate-check.mjs` already holds and CONTRACT G-2 requires structurally.

## 5. Epics table

| EID | Title | Depends on | Covers (CONTRACT rows) | Case count |
|---|---|---|---|---|
| V4A1 | Renderer core + CLI + determinism + exit codes + `--open` routing + legacy manifest compat | — | C-E2-01, C-E2-03, C-E2-10 | 12 |
| V4A2 | Block catalogue (all 17 types incl. failure states) + brand tokens + detection + badge/stamps | V4A1 | C-E2-02, C-E2-04, C-E2-08, C-E2-14, C-E3-01, C-E3-02, C-E3-03, C-E5-01, C-E5-02, C-E5-03 | 15 |
| V4A3 | Glossary panel + first-use `<abbr>` + model-ID leak lint + XSS/escape hardening + theme tokens | V4A1 | C-E10-03, C-E2-09, C-E2-12, C-E2-13 | 11 |
| V4A4 | `references/report-family.md` + fixtures under `tests/fixtures/v4/report/` + `tests/v4/renderer/*.mjs` harness completeness | V4A1, V4A2, V4A3 | (meta — see §8 boundary; documents/proves the other three) | 10 |

Full task checklists, branch names, Tier Tables and the binding per-epic Test
Contracts live in `delivery/v4/epics/epics-a-renderer.md`. Total: **48 cases**,
**0 [REAL]** (every case runs offline against a fixture, per design §5: "None
of the twenty [seeds] is [REAL]; the only network-dependent behaviour —
mermaid, fonts — is asserted by the presence of the pinned URL, not by
fetching it").

## 6. Acceptance criteria

Acceptance = the four Binding Test Contracts in
`delivery/v4/epics/epics-a-renderer.md`, 100% pass, per CONTRACT §7 ("Definition
of SHIPPED … IMPLEMENTED-NOT-VERIFIED ships nothing"). Every one of the 17
`@case-renderer` CONTRACT rows (C-E2-01/02/03/04/08/09/10/12/13/14, C-E3-01/02/03,
C-E5-01/02/03, C-E10-03) is bound to ≥1 T-V4A*-NN case in the CONTRACT
coverage table at the end of the epics file — computed by counting table rows,
never hand-typed (G-5, self-applied). Additionally:

- AC1. `node scripts/build-report.mjs <fixture>.manifest.json` twice → byte-
  identical output (V4A1).
- AC2. Every one of the 8 report-family kinds has a minimal fixture manifest
  under `tests/fixtures/v4/report/` that renders successfully (V4A4).
- AC3. `node tests/v4/prose/zero-deps.mjs`-style self-check: zero non-`node:`
  imports across every file this lane owns (V4A4, supports SQ-C's G-2 gate).
- AC4. `gate-check mirror-check` (SQ-B, out of this lane but a hard downstream
  dependency) sees `scripts/build-report.mjs`, `scripts/report-template.html`,
  `assets/brand/default.brand.json` as three of its 11 byte-identical pairs —
  SQ-A's obligation is committing identical root + plugin copies on every
  commit (V4A4 self-check, T-V4A4-06).

## 7. Risks

- **R1 — HTML escape hatch invites reinvented layout.** The `html` block type
  is the safety valve for content the 16 structured blocks can't express, but
  a model reaching for it too often reproduces the exact "five hand-authored
  one-offs" problem the field already has (findings F-A7). Mitigation: the
  renderer prints `html-blocks=<n>` on every stdout line (D-A6); SQ-C's SKILL
  prose sets the "blocks first, `html` last" norm (out of this lane).
- **R2 — Brand contrast is a deliberate deviation from the guideline's letter.**
  The Her0 guideline's own usage table puts Signal/Slate in roles that fail
  WCAG AA on Snow (F-A13); the bundled default remaps them to backgrounds/chip
  borders and moves `muted` to Steel. Ratified as ruling R7
  (`delivery/v4/DECISIONS.md`) — flagged here so a fresh reviewer sees it is
  intentional, not an oversight.
- **R3 — Two renderers coexist indefinitely.** conclude-it keeps its Python
  renderer (design §10 non-goal: "conclude-it migration" is out of 4.0.0); the
  manifest core is shared in spirit, not in code, until a future release
  points conclude-it at `build-report.mjs` (research §6.8, noted for the
  vault, not actioned here).
- **R4 — Mermaid pinned at 10.9.1 while cdnjs's latest is 11.15.0.** Chosen as
  the lower-risk pin (12 diagrams in the field prove 10.9.1; mermaid 11
  changed some syntax defaults, research §6.6). Revisit at 4.1 — not this
  lane's call to unpin.
- **R5 — Model-ID regex duplicated, not shared.** SQ-A cannot edit
  `planit-guard.mjs` (SQ-B's exclusive file); the regex is copied
  byte-identical with a cross-reference comment rather than imported, so a
  future edit to the guard's regex needs a matching, manual edit here. Formal
  cross-lane flag in §9.
- **R6 — model-ID false positives are real, not hypothetical.** `claude-sub`,
  `claude-cli-runner`, `claude-8ftools` are real session/package names the
  regex would flag (F-A16); the `allow_tokens[]` escape hatch exists
  specifically so authors don't disable the check out of frustration
  (research §6.9).

## 8. Repo & branch plan

One branch per epic, cut from wherever the orchestrator's `W0` prep landed,
worked in a **git worktree** (G-10 — this repo may be touched by other
sessions concurrently): `epic/v4a-renderer-core` (V4A1), `epic/v4a-block-
catalogue` (V4A2), `epic/v4a-glossary-security` (V4A3), `epic/v4a-fixtures-
docs` (V4A4). Merge on green per epic, never squashed across epics. Files
this lane owns exclusively (CONTRACT §2): `scripts/build-report.mjs`,
`scripts/report-template.html`, `assets/brand/default.brand.json`,
`references/report-family.md`, `tests/v4/renderer/*`,
`tests/fixtures/v4/report/**` — root mirrors of the first three follow every
commit (`MIRROR_PAIRS` 8→11, CONTRACT §2). This lane never touches gate-check,
machine, guard, SKILL.md, or any reference file outside
`references/report-family.md` (CONTRACT §2 "Never touches" column).

**Boundary with SQ-B (Core).** SQ-B owns `mirror`, `glossary`, `archive`,
`runs` verbs and the statechart states/guards that decide *when* each report
kind renders (design §1, §6). SQ-A's obligation ends at "the stamp is correct
and the twin is byte-reproducible"; SQ-B's `mirror` verb is the consumer, and
its own binding cases (C-E2-05/06/07, `@case-machine`) are SQ-B's, not
duplicated here.

**Boundary with SQ-C (Prose & packaging).** SQ-C writes SKILL.md's "blocks
first, html last" norm, the "`--open` only at human gates" instruction, and
GLOSSARY.md's *generation* logic (which IDs get rows). SQ-A only *renders*
whatever GLOSSARY.md exists at render time and reports honestly when it
doesn't (D-A11).

## 9. Corrections flagged for the orchestrator

Not edits to the CONTRACT — findings surfaced while grounding this PRD that
the orchestrator should resolve or dismiss at the next amendment pass:

1. **GLOSSARY.md bootstrap ordering (research §6.7, open question).** SCOPE-
   BRIEF is the very first rendered report (before `scopeGate`, design §1),
   which is before any epic/squad/case ID exists — but D-A11's panel logic
   still needs *some* `GLOSSARY.md` on disk at that point (the static
   plan-it-vocabulary rows: G0-G4, size/shape/topology, [REAL], INV, etc.) or
   every early render shows "not generated yet" (exit 2) even in the healthy
   path. CONTRACT §3.1/§4.6 don't currently name who writes a seed
   `GLOSSARY.md` before `intake`. Recommend: SQ-B or SQ-C's `anamnesis`/`intake`
   tooling seeds the static-vocabulary rows at run creation, before
   `scopeBrief` fires. Not a contradiction — an ordering gap between two
   other squads' lanes that SQ-A's renderer surfaces by being the first
   consumer.
2. **Model-ID regex parity is enforced by convention, not by import (R5
   above).** `planit-guard.mjs` is SQ-B's exclusive file (CONTRACT §2); SQ-A
   cannot `import` it without violating lane ownership, so the regex is
   duplicated with a cross-reference comment. Recommend the orchestrator add
   one line to CONTRACT §6 G-4's test hook noting the regex is intentionally
   duplicated in two files and a future amendment that changes one must
   changeboth, or a later release should promote it to a tiny shared
   `node:`-only constants file both lanes may read (not write) — out of scope
   to build this run.
3. **`--check`'s caller is unnamed in CONTRACT §4.5's verb list.** CONTRACT
   §4.5 lists `mirror <md> <html>` as SQ-B's verb but doesn't state it invokes
   `build-report.mjs --check` under the hood (design §4.2 says so explicitly:
   "This is what gate-check's `mirror` verb calls"). No functional gap — SQ-A
   ships `--check` per D-A1 regardless — but flagging so SQ-B's epics cite the
   exact flag name rather than reimplementing an equivalent compare.

---
_SQ-A — mid tier, escalate-on-struggle per RUN-POLICY (`delivery/v4/CONTRACT.md`
§RUN-POLICY)._
