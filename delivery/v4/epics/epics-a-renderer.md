# Epics — plan-it v4, Squad SQ-A: Renderer (HTML report layer)

Companion to `delivery/v4/prds/prd-a-renderer.md`. Law: `delivery/v4/CONTRACT.md`
**v1.0-draft — FROZEN FOR SQUADS** — never edited by this lane.

Legend: `C-E<n>-NN` = enforcement case for enhancement n (CONTRACT `## Cases`) ·
`T-<EID>-NN` = this epic's own binding test case · `G-n` = a CONTRACT §6
governance rule · `[REAL]` = needs a live target (none in this file — see
"Count" line per epic) — see `delivery/v4/GLOSSARY.md`.

Status vocabulary used below (closed, CONTRACT §1): NOT-STARTED ·
IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED. Every epic below starts
NOT-STARTED; this file authors the binding contract only, per RUN-POLICY's
"PRD/epic authoring = mid" tier — no code lands from this planning pass.

Tier vocabulary (RUN-POLICY, CONTRACT §RUN-POLICY): `top` = judgment/
cross-cutting (never resolved below coordinator review) · `mid` = spec'd
implementation against a bound Test Contract · `low` = deterministic,
fully-spec'd mechanical work (fixture scaffolds, manifest authoring).
`scaffold-pointer` grammar (`plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`
`POINTER_RE`): `build-it:<preset>[#k=v]` or `.claude/agents/<name>.md`, no
whitespace.

---

## Epic V4A1 — Renderer core: CLI, determinism, exit codes, `--open` routing, legacy manifest compat

Branch: `epic/v4a-renderer-core` (worktree; G-10)
Depends on: none (Wave 1 foundation — V4A2/V4A3/V4A4 all import the
CLI/dispatch/stamp scaffolding this epic ships)
Status: NOT-STARTED

### Scope

Ships the whole CLI surface, exit-code contract, determinism guarantee,
stamp-writing, and `--open` platform routing — the skeleton every later block
type and lint plugs into. Also ships the legacy conclude-it manifest
back-compat path so `kind: LEGACY` renders without a rewrite (PRD D-A2).

### Task checklist

- [ ] `scripts/build-report.mjs` (NEW, `plugins/plan-it/skills/plan-it/scripts/`,
  mirrored to root `scripts/build-report.mjs`) — argv parsing: positional
  `<manifest.json>`, flags `--open --brand <path>|default --out <file> --check
  --strict`, following the `arg.startsWith("--")` filter pattern
  `~/.claude/skills/conclude-it/build-report.py:98-99` already uses.
- [ ] Exit-code dispatcher: 0 `RENDERED` / 2 `RENDERED_PARTIAL` (warnings,
  page still written) / 1 `RENDER_FAILED` (nothing written) — widen
  `die()`'s role (`build-report.py:42-44`) from "bad usage only" to every
  hard-error branch; `sys.exit(2 if problems else 0)`'s pattern
  (`build-report.py:143`) becomes the warnings-array-length check.
- [ ] Manifest read + required-field validation: `schema`/`kind` required
  under `--strict` (exit 1 if either absent, nothing written); absent without
  `--strict` → `kind:"LEGACY"`, exit 2 warning, proceed. `title`/`output`
  always required regardless of `--strict` (`build-report.py:104-105`'s
  check, kept).
- [ ] Legacy section→block rewrite: a manifest with `sections[].{table,
  cards, html}` (no `blocks[]`) is rewritten in memory to the equivalent
  `blocks[]` entries before dispatch — one render path for both dialects
  (PRD D-A2).
- [ ] `node:crypto` SHA-256 helper; compute + write the five stamp metas
  (`planit-source`, `planit-embeds`, `planit-brand`, `planit-renderer`,
  `planit-kind`) into `{{META_STAMPS}}` — relpaths relative to the twin's own
  output directory, forward slashes, no `./` (CONTRACT §4.3).
  the twin's own directory, forward slashes, no `./` (CONTRACT §4.3).
- [ ] Determinism: no `Date.now()`/timestamp anywhere in emitted bytes; no
  absolute path written (only manifest-authored content and relpaths);
  object/array iteration order is manifest-array order only.
- [ ] `--check` mode: render fully to an in-memory buffer, `Buffer.compare`
  against the existing `<NAME>.html` at the manifest's declared output path;
  exit 0 identical / 2 stale-or-missing / 1 I/O error; **never writes**.
- [ ] `--open` platform router (`spawnSync`, `node:child_process`): darwin →
  `open -a "Google Chrome" <file>` then bare `open <file>` on non-zero;
  linux → `xdg-open <file>`; win32 → `cmd /c start "" <file>`; suppressed by
  `PLANIT_NO_OPEN=1` or `!process.stdout.isTTY` (logs `note: --open
  suppressed (headless)`); never mutates the exit code. `PLANIT_TEST_PLATFORM`
  env override for test determinism across CI hosts.
- [ ] Stdout contract: exactly one line
  `built: <path> (<bytes> bytes) brand=<default|repo:<relpath>> stamp=sha256:<12-hex> html-blocks=<n>`
  (CONTRACT §4.1); warnings prefixed `WARNING:` on stderr; errors prefixed
  `build-report: ERROR:` on stderr (`build-report.py:43`'s prefix, kept).
- [ ] `scripts/report-template.html` (NEW, mirrored to root) — port
  `report-template.html:1-138` wholesale as the starting skeleton with the
  11-slot set from PRD D-A14 (`{{TITLE}} {{EYEBROW}} {{SUBTITLE}}
  {{BRAND_BADGE}} {{META_STAMPS}} {{BRAND_CSS}} {{FONT_LINK}} {{GLOSSARY}}
  {{BODY}} {{MERMAID_SCRIPT}} {{FOOTER}}`); block-type CSS/markup for V4A2/V4A3
  is added by those epics, not here — this epic ships the shell only.
- [ ] `tests/v4/renderer/determinism.mjs`, `strict-schema.mjs`,
  `render-required-fields.mjs`, `check-mode.mjs`, `open-routing.mjs`,
  `stdout-format.mjs`, `stamp-format.mjs` (NEW, all under
  `tests/v4/renderer/`) — see Test Contract below for exact assertions.
- [ ] `tests/fixtures/v4/report/` (NEW) — minimal fixtures for this epic's
  cases: `legacy-manifest/` (the literal `build-report.py:14-33` manifest
  shape), `no-schema-strict/`, `missing-title-output/`, `two-embeds-one-
  flow/` (reused by `--check`/determinism), `check-stale/`.

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | ~1 session | escalate to top on struggle (RUN-POLICY) | build-it:iteration-impl#slice=V4A1 |
| top | review of stamp/determinism correctness only | — (top does not escalate further) | build-it:launch#slice=V4A1-review |

### Test Contract — Renderer core (V4A1)  (BINDING: 100% pass or /iterate)
Types: [unit][integration] · Count: 14 (0 [REAL]) · Surfaces: CLI (node
subprocess spawn) + byte/regex assertions on stdout, stderr, and the written
file. Done = every case below is PASS. No [REAL] case VERIFIED on a mock —
none of these twelve needs a live target; the network-shaped ones (mermaid,
fonts) are asserted by presence of a pinned URL string, never by fetching.

| ID | Given/When/Then | Expected output | run: |
|---|---|---|---|
| T-V4A1-01 | Given fixture `two-embeds-one-flow/decisions.manifest.json`, when `build-report.mjs` runs twice to two output paths, then the two files are byte-identical (`Buffer.equals`) and both stdout `stamp=` prefixes match | exit 0 both runs; `cmp` clean | `node tests/v4/renderer/determinism.mjs` |
| T-V4A1-02 | Given a manifest with no `schema`/`kind`, when rendered with `--strict`, then nothing is written | exit 1, output path does not exist, stderr `build-report: ERROR:` | `node tests/v4/renderer/strict-schema.mjs` |
| T-V4A1-03 | Given the same manifest, when rendered WITHOUT `--strict`, then it renders as `kind:"LEGACY"` | exit 2, `planit-kind` meta = `LEGACY`, WARNING on stderr | `node tests/v4/renderer/strict-schema.mjs` |
| T-V4A1-04 | Given the literal `build-report.py:14-33` conclude-it manifest (title/sections/table/cards/embeds, no `schema`), when rendered, then the HTML contains the same `card`, `badge b-ok`, `details.more`, `mdout` class names as the ancestor and the scoreboard table has 1 data row | exit ≤ 2 | `node tests/fixtures/v4/report/legacy-manifest/run.mjs` invoking `node scripts/build-report.mjs tests/fixtures/v4/report/legacy-manifest/manifest.json --out /tmp/legacy.html` |
| T-V4A1-05 | Given a manifest missing `title` or `output`, when rendered (with or without `--strict`), then nothing is written | exit 1, stderr names the missing field | `node tests/v4/renderer/render-required-fields.mjs` |
| T-V4A1-06 | Given a rendered twin, when `--check` runs against the same manifest, then it reports identical and never writes | exit 0, target file mtime unchanged | `node scripts/build-report.mjs tests/fixtures/v4/report/two-embeds-one-flow/decisions.manifest.json --check` |
| T-V4A1-07 | Given the twin from T-V4A1-06 with one byte appended to the source before `--check`, then it reports stale | exit 2, stderr names stale-or-missing, no write | `node tests/v4/renderer/check-mode.mjs` |
| T-V4A1-08 | Given `--open` and `PLANIT_TEST_PLATFORM=darwin` with a stubbed `open` on `PATH` logging argv, when run, then the log shows `-a "Google Chrome" <file>`; when the stub exits non-zero, a second bare `open <file>` call is logged | exit code unchanged by either open outcome | `node tests/v4/renderer/open-routing.mjs` |
| T-V4A1-09 | Given `--open` and `PLANIT_NO_OPEN=1`, when run, then nothing is logged by the open stub and stdout contains `--open suppressed`; same for a forced non-TTY stdout | exit code unchanged | `node tests/v4/renderer/open-routing.mjs` |
| T-V4A1-10 | Given `--open` and `PLANIT_TEST_PLATFORM=linux` / `win32`, when run, then the stub logs `xdg-open <file>` / `cmd /c start "" <file>` respectively | exit code unchanged | `node tests/v4/renderer/open-routing.mjs` |
| T-V4A1-11 | Given any successful render, when stdout is captured, then it matches exactly one line `/^built: .+ \(\d+ bytes\) brand=(default|repo:.+) stamp=sha256:[0-9a-f]{12} html-blocks=\d+$/` | regex match on stdout | `node tests/v4/renderer/stdout-format.mjs` |
| T-V4A1-12 | Given a rendered twin, when its five `<meta name="planit-*">` tags are parsed, then `planit-source` matches SHA-256 of the source md, `planit-renderer` names `build-report.mjs/4.0.0` + the template's own hash, and every relpath is forward-slash with no `./` prefix | all five metas present and hash-correct | `node tests/v4/renderer/stamp-format.mjs` |
| T-V4A1-13 | AMD-9: Given a manifest stored in a SUBFOLDER of the package (`tests/fixtures/v4/report/manifest-in-subdir/manifests/report.manifest.json` with `source.path: "../REPORT.md"`, `output: "../REPORT.html"`, one embed `../EMBED.md`), when rendered, then `planit-source` reads `REPORT.md sha256=…` and `planit-embeds` reads `EMBED.md sha256=…` — every stamped relpath is relative to the TWIN's directory (CONTRACT §4.3), never the manifest's — and `gate-check mirror REPORT.md REPORT.html` (V4B4 verb) exits 0 | exit ≤ 2; both stamps twin-relative; mirror exit 0 | `node tests/v4/renderer/stamp-relpath-subdir.mjs` |
| T-V4A1-14 | AMD-9: Given a manifest whose embedded markdown contains the literal text `var(--token)` inside a code span (as `delivery/v4/CONTRACT.md` C-E2-13 does), when rendered, then the CSS-token lint inspects only the rendered `<style>` blocks and emits no "CSS tokens referenced but not declared" warning for content text | no CSS-token WARNING on stderr; exit 0 with a tokenised brand or 2 only for the brand warning | `node tests/v4/renderer/css-token-scan-scope.mjs` |

---

## Epic V4A2 — Block catalogue (all 17 types) + brand tokens + detection + badge/stamps

Branch: `epic/v4a-block-catalogue` (worktree; G-10)
Depends on: V4A1 (dispatch table, stamp writer, template shell)
Status: NOT-STARTED

### Scope

Implements all 17 block-dispatch functions (PRD D-A6 through D-A10) and the
full brand pipeline (detection order, role-token CSS emission, badge). This
is the largest epic — it is where the report family actually becomes
legible instead of a bare shell.

### Task checklist

- [ ] `assets/brand/default.brand.json` (NEW, mirrored to root) — the
  bundled `planit-brand/1` default per PRD D-A4: palette (Ink/Signal/Flare/
  Snow/Cloud/Mist/Slate/Steel/Carbon/Valid/Warn/Fail/Info, from
  `assets/brand/Her0 brad guideline.md` §4 L178-205), fonts (Space Grotesk/
  Inter/JetBrains Mono + Google Fonts href, §5 L225-239), `roles.light`/
  `roles.dark` with the R7 contrast remap (`muted→steel`, semantics as chip
  backgrounds only in light mode).
- [ ] Brand detector: `--brand <path>` flag → `.plan-it/brand.json` →
  `brand.json` / `assets/brand/brand.json` / `docs/brand/brand.json` /
  `brand/brand.json` → a markdown-only guideline match (`assets/brand/*.md`,
  `docs/brand/*.md`, `docs/brand*.md`, `brand/*.md`, `BRAND.md`) → bundled
  default. Markdown-only hit: exit 2, badge reads `brand: default (guideline
  present, not tokenised)`, tokens = bundled default.
- [ ] Brand→CSS emitter: reads `roles.light`/`roles.dark`, emits the
  three-block token pattern (`report-template.html:8-17`'s structure, kept)
  into `{{BRAND_CSS}}`; `@15%`-suffixed palette refs render as
  `color-mix(in srgb, <hex> 15%, transparent)` (`report-template.html:34-37`
  pattern, kept). `{{FONT_LINK}}` emits the brand's `googleFontsHref` as a
  `<link>` (or nothing, if the brand has no font block).
  `{{BRAND_BADGE}}` renders `brand: <name>` + relpath when repo-sourced.
- [ ] `table` (`computed_footer:true` sums numeric columns from the actual
  rendered rows) and `cards` (direct port of `render_table`/render-card
  scoreboard shape, `build-report.py:56-63`).
- [ ] `decision-card`: id chip, title, badge-by-status(open/ruled), optional
  rename-style deadline chip, question/options/recommendation/
  `why_yours_html`/`unblocks_html`, `<details class="more">` embed — direct
  extension of `render_card` (`build-report.py:66-94`,
  `report-template.html:28-69`). `status:"open"` missing `why_yours_html` or
  `recommendation` → exit 2 naming the card id. `status:"ruled"` missing
  `ruling` → exit 2.
- [ ] `embed`: port `read_embed`/details wrapper (`build-report.py:47-53,
  81-92`) unchanged in shape (escape hardening is V4A3's task, not
  duplicated here); missing file → exit 2 + the same visible placeholder
  text `report file not found at build time`.
- [ ] `mockup`: `.mock-win > .mock-bar (dots · label · provenance chip) >
  .mock-body`; `provenance` absent → exit 2 + red `.mock-bar` chip
  "provenance missing — not drawn from measured rows"; `css` field is
  rewritten to `#<block-id> …`-scoped selectors before emission (namespacing
  so one mockup's CSS never leaks into another's).
- [ ] `measurement`: `.measure` tile (value · unit · "read from `<where>` at
  `<read_at>` · read-only"); `read_only` absent or `false` → exit 1, nothing
  written for the WHOLE render (not just the block) — a measurement that
  wrote invalidates the page's honesty claim entirely.
- [ ] `states`: `.three` triptych, coloured headers
  (`var(--ok)`/`var(--muted)`/`var(--bad)`); any of good/empty/misconfigured
  absent → that column renders grey "not enumerated — this state has not
  been designed" + exit 2 (not a hard fail — the page still ships, honestly
  incomplete).
- [ ] `flow` (mermaid): `<pre class="mermaid" data-src>` with the
  case-insensitively escaped source (shares V4A3's escape helper — see V4A3
  dependency note below); emits `<script src="https://cdnjs.cloudflare.com/
  ajax/libs/mermaid/10.9.1/mermaid.min.js">` into `{{MERMAID_SCRIPT}}` only
  when ≥1 `flow` block exists; init call uses `securityLevel:'strict'`,
  `startOnLoad:true`, theme derived from the page's current `data-theme`; a
  `<noscript>` note states the same fallback text as the `<pre>`'s own
  caption when JS is unavailable.
- [ ] `rulings`: `ID · Ruling · Effect` table from `rows[]{id,ruling,effect,
  state}` (F-A8 pattern).
- [ ] `rulings-forward`: "Your rulings" table (`Item · Your call · State`)
  sourced from `from` (an earlier DECISIONS.md's rulings); a prior item
  present in `from` but absent from the current `rows[]` → exit 2 naming
  the dropped item; `from` missing entirely → warning "no earlier rulings to
  carry", not a hard fail.
- [ ] `copy-rulings`: derives from every `decision-card`/`rulings` id already
  in the assembled body (no separate manifest field needed) and emits
  `<pre class="copy">ID: value</pre>` lines in **document order**, one line,
  plus a copy-to-clipboard button (client-side `navigator.clipboard`,
  try/catch — clipboard API may be unavailable; falls back to a visible
  "select the text above" note).
- [ ] `lockbox`: CONTRACT-mirror banner — `owner`, `date`, `items[]` as a
  static list (F-A8's praxya `.lockbox` pattern).
- [ ] `tally`: groups declare `rows_from:<section id>`; the renderer counts
  matching block instances in that section **at render time** — no manifest
  number is ever trusted. Referenced section missing → tile shows `—` +
  warning (not exit 1 — a missing tally source degrades gracefully).
- [ ] `triage-card`: anatomy k/v grid (what/why/need/decide/depends) +
  verdict box (SEED-TRIAGE pattern, F-A8); `verdict` outside
  `plan|build|decide|skip` → exit 1, nothing written (schema violation, not
  a warning).
- [ ] `copy`: bare `<pre class="copy">` + copy button, no special logic.
- [ ] `html`: passthrough escape hatch; every occurrence increments the
  `html-blocks=<n>` stdout counter V4A1 ships.
- [ ] `tests/v4/renderer/missing-embed.mjs`, `brand-detection.mjs`,
  `tally-computed.mjs`, `decision-card-complete.mjs`, `rulings-forward.mjs`,
  `copy-rulings.mjs`, `mockup-provenance.mjs`, `measurement-readonly.mjs`,
  `states-triptych.mjs`, `mermaid-fallback.mjs`, `block-catalogue-smoke.mjs`,
  `triage-card-verdict.mjs`, `lockbox-block.mjs`, `html-passthrough-
  count.mjs` (NEW, all under `tests/v4/renderer/`).
- [ ] `tests/fixtures/v4/report/` additions: `missing-embed/`,
  `brand-triple-hit/` (all three brand sources present, to test precedence),
  `brand-guideline-only/`, `brand-none/` (empty repo root), `tally-three-
  cards/` (+ a fourth added mid-test to prove computation), `decision-card-
  incomplete/`, `rulings-forward-drop/`, `mockup-no-provenance/`,
  `measurement-writeable/`, `states-missing-one/`, `one-flow-block/`,
  `no-flow-block/`, `triage-bad-verdict/`.

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | ~2 sessions (largest epic — 17 block types) | escalate to top on struggle, one block type at a time (RUN-POLICY) | build-it:iteration-impl#slice=V4A2 |
| top | brand-contrast ratification + escaping review only | — | build-it:launch#slice=V4A2-review |

### Test Contract — Block catalogue + brand (V4A2)  (BINDING: 100% pass or /iterate)
Types: [unit][integration] · Count: 15 (0 [REAL]) · Surfaces: CLI + file/regex
assertions on rendered HTML. Done = every case below is PASS. No [REAL] case
VERIFIED on a mock.

| ID | Given/When/Then | Expected output | run: |
|---|---|---|---|
| T-V4A2-01 | Given a manifest whose `embed` block names a nonexistent file, when rendered, then the page contains the visible placeholder | exit 2, stderr `/WARNING: embed not found: .*missing\.md/`, HTML contains `report file not found at build time` | `node tests/v4/renderer/missing-embed.mjs` |
| T-V4A2-02 | Given a fixture repo root with `.plan-it/brand.json` AND `assets/brand/brand.json` AND a markdown guideline, when rendered without `--brand`, then `.plan-it/brand.json` wins; removing it, `assets/brand/brand.json` wins; with only the markdown remaining, badge = `brand: default (guideline present, not tokenised)` | `planit-brand` meta names the winning source each time; exit 2 only in the markdown-only case | `node tests/v4/renderer/brand-detection.mjs` |
| T-V4A2-03 | Given an empty fixture root, when rendered, then `planit-brand` starts with `default sha256=` equal to SHA-256 of `default.brand.json` and the badge reads `brand: Her0 default` | exit 0 | `node tests/v4/renderer/brand-detection.mjs` |
| T-V4A2-04 | Given a `tally` group referencing a section with 3 `triage-card` blocks, when rendered, then the tile reads `3`; when a 4th card is added to the fixture with no manifest change, then the tile reads `4` | no manifest edit between the two renders | `node tests/v4/renderer/tally-computed.mjs` |
| T-V4A2-05 | Given a `decision-card` with `status:"open"` and no `why_yours_html` (or no `recommendation`), when rendered, then it fails naming the card id; given `status:"ruled"` with no `ruling`, same | exit 2, stderr names the card id in both branches | `node tests/v4/renderer/decision-card-complete.mjs` |
| T-V4A2-06 | Given a DECISIONS manifest whose `rulings-forward.from` names an earlier DECISIONS.md with 3 rulings, when the current `rows[]` drops one, then rendering fails naming the dropped item; with all 3 present, the "Your rulings" table lists all 3 | exit 2 (drop case) / exit 0 (complete case) | `node tests/v4/renderer/rulings-forward.mjs` |
| T-V4A2-07 | Given a page with 2 ruled + 2 open decision-cards, when rendered, then `copy-rulings` emits exactly 4 `ID: value` pairs in document order, one per line inside one `<pre class="copy">` | order matches document order exactly | `node tests/v4/renderer/copy-rulings.mjs` |
| T-V4A2-08 | Given a `mockup` block with no `provenance`, when rendered, then the block's `.mock-bar` contains the red chip text | exit 2, HTML contains `provenance missing — not drawn from measured rows` | `node tests/v4/renderer/mockup-provenance.mjs` |
| T-V4A2-09 | Given a `measurement` block with `read_only:false`, when rendered, then nothing is written | exit 1, output path does not exist | `node tests/v4/renderer/measurement-readonly.mjs` |
| T-V4A2-10 | Given a `states` block missing `misconfigured`, when rendered, then that column renders grey with "not enumerated" text | exit 2, HTML contains `not enumerated — this state has not been designed` | `node tests/v4/renderer/states-triptych.mjs` |
| T-V4A2-11 | Given a manifest with one `flow` block, when rendered, then the HTML contains the pinned cdnjs 10.9.1 script tag, exactly one `<pre class="mermaid">` with the escaped source, `securityLevel:'strict'`, and a `<noscript>` note; given a manifest with zero `flow` blocks, then no mermaid script tag exists anywhere in the file | string-presence + string-absence assertions | `node tests/v4/renderer/mermaid-fallback.mjs` |
| T-V4A2-12 | Given minimal `table`/`cards` blocks, when rendered, then the table has a computed footer row (numeric columns summed) and the cards list renders the scoreboard markup with `badge b-ok` class parity to the ancestor | exit 0 | `node tests/v4/renderer/block-catalogue-smoke.mjs` |
| T-V4A2-13 | Given a `triage-card` with `verdict:"maybe"` (outside plan/build/decide/skip), when rendered, then nothing is written | exit 1 | `node tests/v4/renderer/triage-card-verdict.mjs` |
| T-V4A2-14 | Given a `lockbox` block with owner/date/3 items, when rendered, then the banner lists all 3 items verbatim in the order given | exit 0 | `node tests/v4/renderer/lockbox-block.mjs` |
| T-V4A2-15 | Given a manifest with 2 `html` blocks and 3 structured blocks, when rendered, then stdout's `html-blocks=` value reads `2` exactly | regex match on stdout | `node tests/v4/renderer/html-passthrough-count.mjs` |

---

## Epic V4A3 — Glossary panel + first-use `<abbr>` + model-ID leak lint + XSS/escape hardening + theme tokens

Branch: `epic/v4a-glossary-security` (worktree; G-10)
Depends on: V4A1 (dispatch scaffolding, stdout contract); shares the escape
helper with V4A2's `flow`/`embed` blocks — land this epic's escape module
first if built in parallel, or accept a short-lived duplicate helper
reconciled at merge (flagged in PRD §9 risk R1's sibling note).
Status: NOT-STARTED

### Scope

Everything that makes the renderer trustworthy to open: the glossary panel
and first-use expansion (G-8), the model-ID leak lint (G-4), the full XSS/
escape hardening (the security fix over the ancestor's known hole, F-A3),
and the CSS token completeness audit (C-E2-13).

### Task checklist

- [ ] Glossary panel emitter: reads `manifest.glossary.path`, renders exactly
  one `<details class="glossary"><summary>Glossary</summary>` table (`ID ·
  Means · Where defined`) into `{{GLOSSARY}}`, placed immediately before the
  first `<h2>` in `{{BODY}}` regardless of block order. Missing
  `GLOSSARY.md` → panel text "GLOSSARY.md not generated yet — IDs on this
  page are unexpanded", exit 2.
- [ ] First-use expansion pass: after full body assembly, walk text nodes
  outside `<code>`/`<pre>`, match the union ID grammar (design §4.8:
  `T-[A-Z]\d+[A-Za-z0-9.]*-\d{2}`, epic/squad IDs, `G[0-4]`, `G-\d+`, `W\d+`,
  `D-?\d+`, `R\d+`, status-vocabulary words), wrap the first occurrence of
  each `<abbr class="gl" title="<expansion>">ID</abbr>` + one `.gl-x`
  small-text expansion, later occurrences bare `<abbr>`. An ID matched but
  absent from `GLOSSARY.md` → soft warning listed on stderr, exit 2 (the
  hard handoff-time fail is SQ-B's lint, not duplicated here).
- [ ] Model-ID leak lint: `const MODEL_ID_RE = /claude-[a-z0-9-]+/;` (a
  byte-identical copy of `planit-guard.mjs`'s constant, with a comment
  pointing at the guard's exact line — PRD D-A12, flagged as cross-lane risk
  R5) run over every assembled block's rendered text; a match not present in
  `manifest.allow_tokens[]` → exit 2 naming the exact string.
- [ ] Escape hardening: case-insensitive `/<\/(script)/gi` → `<\/$1` on every
  embed and raw `html` block; `<!--` → `<\!--` inside script-tag content;
  `esc()` extended to escape `"` in addition to `& < >`
  (`report-template.html:94` currently escapes only three); link-scheme
  allow-list (`http:`, `https:`, `mailto:`, `#`, relative paths) applied to
  every rendered `href`, `javascript:` rejected and rendered as inert text.
- [ ] Numbered-list fix: `report-template.html:126`'s fake bold-`<ul>` for
  ordered lists becomes a real `<ol><li>` emission.
- [ ] CSS token audit (build-time self-check, runs as part of every render):
  regex-collect every `var(--[\w-]+)` in the assembled `<style>`, diff
  against the bare (un-media-guarded, un-`[data-theme]`-guarded) `:root`
  block's declared custom properties; any token referenced but not declared
  there is a build-time authoring error surfaced on stderr (does not change
  the exit code by itself — it is a template/brand authoring bug, not a
  manifest error).
- [ ] `tests/v4/renderer/glossary-panel.mjs`, `model-id-leak.mjs`,
  `xss-escape.mjs`, `theme-tokens.mjs`, `ordered-list.mjs`, `glossary-
  unknown-id-warn.mjs` (NEW, all under `tests/v4/renderer/`).
- [ ] `tests/fixtures/v4/report/` additions: `glossary-missing/`, `glossary-
  one-kind-each/` (8 minimal manifests, one per report-family kind), `model-
  id-leak/`, `model-id-allowlisted/`, `xss-embed-probe/` (contains
  `</SCRIPT>`, `</script >`, `<!--`, `[x](javascript:alert(1))`, an
  attribute-quote breakout, all in one embed), `ordered-list-source/`.

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | ~1 session | escalate to top on struggle (RUN-POLICY) | build-it:iteration-impl#slice=V4A3 |
| top | escaping + adversarial-verify review (never resolved below coordinator, RUN-POLICY "judgment" row) | — | build-it:launch#slice=V4A3-review |

### Test Contract — Glossary, security, tokens (V4A3)  (BINDING: 100% pass or /iterate)
Types: [unit][integration] · Count: 12 (0 [REAL]) · Surfaces: CLI + HTML-
parser assertions (a tolerant node state-machine parser over `<script>` /
`<abbr>` / `href` occurrences, per design §4.6 seed 15's method). Done = every
case below is PASS. No [REAL] case VERIFIED on a mock; adversarial-verify
class (formats.md §PART C cascade classes) is covered by T-V4A3-06/07/11
re-parsing the renderer's own output rather than trusting its write.

| ID | Given/When/Then | Expected output | run: |
|---|---|---|---|
| T-V4A3-01 | Given one minimal manifest per each of the 8 report-family kinds, when each is rendered, then each HTML contains exactly one `<details class="glossary"` occurring before the first `<h2>` | exit ≤ 2 for all 8 | `node tests/v4/renderer/glossary-panel.mjs` |
| T-V4A3-02 | Given `GLOSSARY.md` absent, when any kind is rendered, then the panel text reads "not generated yet" | exit 2 | `node tests/v4/renderer/glossary-panel.mjs` |
| T-V4A3-03 | Given a `GLOSSARY.md` row `\| S1-A1 \| scoped-settings collections epic \| epics/… \|` and a body mentioning `S1-A1` three times (one inside `<code>`), when rendered, then the first prose occurrence is `<abbr class="gl" title="scoped-settings collections epic">S1-A1</abbr>` with exactly one `.gl-x` expansion, the code occurrence is untouched, and the third occurrence is a bare `<abbr>` | exact 3-occurrence pattern | `node tests/v4/renderer/glossary-panel.mjs` |
| T-V4A3-04 | Given a manifest with `claude-sonnet-5` inside a `body_html`, when rendered, then it fails naming the exact string, using the identical regex `planit-guard.mjs` enforces | exit 2, stderr `/model ID "claude-sonnet-5" in rendered HTML/` | `node tests/v4/renderer/model-id-leak.mjs` |
| T-V4A3-05 | Given the same manifest with `claude-cli-runner` added to `manifest.allow_tokens`, when rendered, then no warning fires for that token | exit ≤ 0 for that token (other unrelated warnings, if any, unaffected) | `node tests/v4/renderer/model-id-leak.mjs` |
| T-V4A3-06 | Given an embed containing `</SCRIPT>`, `</script >`, and `<!--`, when rendered and the output is parsed with a tolerant `<script>`-boundary state machine, then exactly one `<script type="text/markdown">` element closes where the renderer intended, and the emitted text contains the literal escaped sequences `<\/SCRIPT>` and `<\!--` | no premature script-boundary close detected by the parser | `node tests/v4/renderer/xss-escape.mjs` |
| T-V4A3-07 | Given the same embed additionally containing `[x](javascript:alert(1))` and `[x](a" onmouseover="y)`, when rendered, then no `href="javascript:` and no `onmouseover=` attribute exists anywhere in the file | zero regex matches for both patterns | `node tests/v4/renderer/xss-escape.mjs` |
| T-V4A3-08 | Given the rendered HTML of any fixture, when the first bare `:root{…}` block is parsed for declared `--token` names and every `var(--token)` reference in the `<style>` is collected, then every referenced token is declared in that bare block | zero tokens referenced-but-undeclared | `node tests/v4/renderer/theme-tokens.mjs` |
| T-V4A3-09 | Given a markdown embed containing a `1. foo` / `2. bar` numbered list, when rendered, then the output contains a real `<ol><li>foo</li><li>bar</li></ol>`, not a bold-prefixed `<ul>` | regex confirms `<ol>` presence, `<ul>` absence for that list | `node tests/v4/renderer/ordered-list.mjs` |
| T-V4A3-10 | Given a body mentioning an ID that matches the union grammar but has no `GLOSSARY.md` row, when rendered, then it is listed as a warning (not silently dropped) | exit 2, stderr names the unknown ID | `node tests/v4/renderer/glossary-unknown-id-warn.mjs` |
| T-V4A3-11 | Given the xss-embed-probe fixture is rendered twice (write, then re-parse the written file from disk — not the in-memory buffer), when the second parse runs, then the same zero-breakout result holds — proving the assertion checks the actual written bytes, not a pre-write string | adversarial-verify: re-reads the world, does not trust its own write | `node tests/v4/renderer/xss-escape.mjs` |
| T-V4A3-12 | AMD-10: Given a GLOSSARY.md with the family rows `T-*-NN`, `C-E*-NN`, `G-n`, `AMD-n`, `LG-n`, `F-*n`, `D-B<n>` and a manifest whose body mentions `T-V4B4-17`, `C-E8-01`, `G-7`, `AMD-3`, `LG-16`, `F-A12`, `D-B6` and the unknown `Q-99`, when rendered, then the seven known IDs are expanded on first use with their family row's text and exactly one glossary WARNING is emitted, for `Q-99` — the renderer's `familyMatch` implements the §5 placeholders (`*`=`[A-Za-z0-9.]+`, `NN`=`[A-Z0-9]{2,3}`, `<n>`/trailing `n`=`\d+`) byte-for-byte as `gate-check glossary` does | 7 expansions, 1 warning naming `Q-99`, exit 2 only for that warning | `node tests/v4/renderer/glossary-family-grammar.mjs` |

---

## Epic V4A4 — `references/report-family.md`, fixture completeness, and renderer test-harness wiring

Branch: `epic/v4a-fixtures-docs` (worktree; G-10)
Depends on: V4A1, V4A2, V4A3 (this epic proves their combined surface is
documented, fixtured, and self-consistent — it cannot start meaningfully
before the other three exist, though its doc-writing task can draft in
parallel against the frozen CONTRACT)
Status: NOT-STARTED

### Scope

The one non-code epic: `references/report-family.md` (the manifest schema +
block catalogue prose, single-copy, no root mirror per CONTRACT §2's
MIRROR_PAIRS list — only the three renderer/template/brand files gain
mirrors), plus a completeness sweep proving every CONTRACT-frozen fixture
path and `run:` command actually exists and every block type / report kind
is documented. This epic carries **no CONTRACT `@case-renderer` row of its
own** — it is the meta-layer that proves V4A1–V4A3's rows are real,
fixtured, and documented, not a fourth slice of renderer behavior. Its
Test Contract is binding exactly like the other three (CONTRACT §7: 100%
pass, IMPLEMENTED-NOT-VERIFIED ships nothing).

### Task checklist

- [ ] `references/report-family.md` (NEW, `plugins/plan-it/skills/plan-it/
  references/`, no root mirror) — write the manifest schema
  (`planit-report/1` top-level fields, verbatim from CONTRACT §4.2), the
  8-row report-family table (kind · twin · required sections · rendered
  when · reader, from research stream-A §4.4 and design §5), and the
  17-row block catalogue (type · required fields · renders as · failure
  state, from CONTRACT §4.2 and design §4.6/PRD §4 D-A6–D-A10).
- [ ] `tests/fixtures/v4/report/` — one minimal, self-contained manifest
  fixture per report-family kind (8 total: SCOPE-BRIEF, TRIAGE,
  RESEARCH-REPORT, DECISIONS, CONTRACT, KICKOFF, PLAN-REVIEW, GLOSSARY),
  each renderable standalone with `node scripts/build-report.mjs
  <fixture> --strict` at exit ≤ 2.
- [ ] Fixture-naming audit: every `tests/fixtures/v4/report/<name>/` this
  squad created matches, verbatim, the fixture path implied by the frozen
  `run:` cell of its CONTRACT row (no invented directory names that drift
  from what CONTRACT already commits to in its Cases table).
- [ ] Zero-deps self-check scoped to this lane's own files (`scripts/build-
  report.mjs`, every `tests/v4/renderer/*.mjs`): grep for any `require(`/
  `import` target that is not `node:`-prefixed or a same-lane relative
  path.
- [ ] Local mirror-pair pre-check: `scripts/build-report.mjs`, `scripts/
  report-template.html`, `assets/brand/default.brand.json` are byte-
  identical between the plugin path and the root path at HEAD — this is a
  pre-check this lane runs on its own commits; SQ-B's `mirror-check` verb
  (C-E9-09) is the authoritative release gate and is not reimplemented
  here.
- [ ] Negative-fixture completeness sweep: for every `@case-renderer` row
  in `delivery/v4/CONTRACT.md`'s `## Cases` table (17 rows), confirm the
  fixture directory its `run:` cell implies exists on disk with content
  that actually exercises the violating condition (not an empty stub).
- [ ] Legend-line self-check: this epics file and `references/report-
  family.md` each carry the `Legend:` line (CONTRACT §5) wherever 3+
  per-run ID prefixes co-occur (G-8, self-applied).
- [ ] `tests/v4/renderer/report-family-kinds-documented.mjs`, `report-
  family-blocks-documented.mjs`, `renderer-scripts-present.mjs`, `fixture-
  kinds-render.mjs`, `zero-deps-renderer.mjs`, `mirror-pairs-local.mjs`,
  `fixture-naming-matches-contract.mjs`, `legend-line-self-check.mjs`,
  `manifest-schema-doc-matches-contract.mjs`, `negative-fixture-
  completeness.mjs` (NEW, all under `tests/v4/renderer/`).

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| low | ~0.5 session (mechanical: doc authoring against a frozen schema, fixture existence checks) | escalate to mid on struggle (RUN-POLICY) | build-it:iteration-impl#slice=V4A4 |
| top | final cross-epic coverage sign-off only | — | build-it:launch#slice=V4A4-review |

### Test Contract — Docs, fixtures, harness completeness (V4A4)  (BINDING: 100% pass or /iterate)
Types: [unit][integration] · Count: 10 (0 [REAL]) · Surfaces: file-existence +
grep/regex assertions over this lane's own committed files (a meta-QA layer,
not renderer behavior). Done = every case below is PASS. No [REAL] case
VERIFIED on a mock.

| ID | Given/When/Then | Expected output | run: |
|---|---|---|---|
| T-V4A4-01 | Given `references/report-family.md`, when parsed for its report-family table, then all 8 kinds (SCOPE-BRIEF, TRIAGE, RESEARCH-REPORT, DECISIONS, CONTRACT, KICKOFF, PLAN-REVIEW, GLOSSARY) appear with a required-sections cell | 8/8 rows present | `node tests/v4/renderer/report-family-kinds-documented.mjs` |
| T-V4A4-02 | Given the same file, when parsed for its block catalogue, then all 17 block types (table, cards, decision-card, embed, mockup, flow, states, measurement, rulings, rulings-forward, copy-rulings, glossary, lockbox, tally, triage-card, copy, html) each have a required-fields cell and a failure-state cell | 17/17 rows present | `node tests/v4/renderer/report-family-blocks-documented.mjs` |
| T-V4A4-03 | Given every `run:` cell of the 17 `@case-renderer` CONTRACT rows, when the named `tests/v4/renderer/*.mjs` file is looked up, then it exists and is directly executable via `node <file>` without throwing a module-not-found error | 17/17 files present and loadable | `node tests/v4/renderer/renderer-scripts-present.mjs` |
| T-V4A4-04 | Given the 8 per-kind fixtures under `tests/fixtures/v4/report/`, when each is rendered with `--strict`, then each exits ≤ 2 and produces a non-empty output file | 8/8 render | `node tests/v4/renderer/fixture-kinds-render.mjs` |
| T-V4A4-05 | Given `scripts/build-report.mjs` and every `tests/v4/renderer/*.mjs`, when scanned for import/require targets, then every target is either `node:`-prefixed or a relative path inside this lane's own tree | zero non-`node:` external targets (G-2) | `node tests/v4/renderer/zero-deps-renderer.mjs` |
| T-V4A4-06 | Given the three new mirror-pair files at HEAD, when the plugin-path and root-path copies are byte-compared, then all three are identical | 3/3 pairs identical | `node tests/v4/renderer/mirror-pairs-local.mjs` |
| T-V4A4-07 | Given the 17 `@case-renderer` CONTRACT rows' `run:` cells, when their implied fixture directory names are extracted and compared against the actual `tests/fixtures/v4/report/` directory listing, then every implied name exists verbatim (no renamed/drifted directory) | 17/17 names match | `node tests/v4/renderer/fixture-naming-matches-contract.mjs` |
| T-V4A4-08 | Given this epics file and `references/report-family.md`, when scanned for co-occurrence of 3+ distinct per-run ID prefixes in one section, then a `Legend:` line is present in that file before or after the section | no un-legended 3+-prefix section | `node tests/v4/renderer/legend-line-self-check.mjs` |
| T-V4A4-09 | Given `references/report-family.md`'s manifest-schema section, when its field list is diffed against CONTRACT §4.2's `planit-report/1` top-level fields, then the two sets are identical | zero field-name drift | `node tests/v4/renderer/manifest-schema-doc-matches-contract.mjs` |
| T-V4A4-10 | Given the 17 `@case-renderer` CONTRACT rows, when each row's fixture is inspected for content (not just directory existence), then each actually contains the violating condition its case describes (e.g. the mockup-no-provenance fixture's manifest genuinely omits `provenance`) | 17/17 fixtures non-empty and condition-bearing | `node tests/v4/renderer/negative-fixture-completeness.mjs` |

---

## CONTRACT coverage — every `@case-renderer` row bound

All 17 `@case-renderer` rows from `delivery/v4/CONTRACT.md` `## Cases`, computed
by reading that table directly (never hand-typed):

| CONTRACT row | Bound in epic | Binding T- case(s) |
|---|---|---|
| C-E2-01 | V4A1 | T-V4A1-01 |
| C-E2-02 | V4A2 | T-V4A2-01 |
| C-E2-03 | V4A1 | T-V4A1-02, T-V4A1-03, T-V4A1-04 |
| C-E2-04 | V4A2 | T-V4A2-02, T-V4A2-03 |
| C-E2-08 | V4A2 | T-V4A2-04 |
| C-E2-09 | V4A3 | T-V4A3-04, T-V4A3-05 |
| C-E2-10 | V4A1 | T-V4A1-08, T-V4A1-09, T-V4A1-10 |
| C-E2-12 | V4A3 | T-V4A3-06, T-V4A3-07, T-V4A3-11 |
| C-E2-13 | V4A3 | T-V4A3-08 |
| C-E2-14 | V4A2 | T-V4A2-11 |
| C-E3-01 | V4A2 | T-V4A2-05 |
| C-E3-02 | V4A2 | T-V4A2-06 |
| C-E3-03 | V4A2 | T-V4A2-07 |
| C-E5-01 | V4A2 | T-V4A2-08 |
| C-E5-02 | V4A2 | T-V4A2-09 |
| C-E5-03 | V4A2 | T-V4A2-10 |
| C-E10-03 | V4A3 | T-V4A3-01, T-V4A3-02, T-V4A3-03 |

**Row count: 17/17 bound** (verifiable by counting the table above against
CONTRACT `## Cases`'s own `@case-renderer`-tagged rows — G-5 self-applied,
never hand-summarized). Total binding cases across all four epics: **48**
(V4A1: 12 · V4A2: 15 · V4A3: 11 · V4A4: 10). **0 of 48 are `[REAL]`** — every
case runs offline against a fixture; the only network-shaped behavior
(mermaid CDN, Google Fonts) is asserted by presence of the pinned URL string
in the rendered output, never by a live fetch, per design §5's own
seed-count note ("None of the twenty is [REAL]").

---
_SQ-A — mid tier, escalate-on-struggle per RUN-POLICY
(`delivery/v4/CONTRACT.md` §RUN-POLICY)._
