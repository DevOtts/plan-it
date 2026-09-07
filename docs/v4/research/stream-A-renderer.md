# Stream A — HTML report layer (renderer, report family, manifest schema, brand tokens, md↔html mirror)

Run: plan-it v4 research · Stream A · 2026-09-07 · status: research report complete — every claim tagged [VERIFIED-IN-CODE] / [MEASURED] / [INFERRED]; no code shipped
Concern: enhancements E2 (HTML report layer), E5 (show-don't-describe blocks), E10 render side (glossary panel + first-use expansion), rulings D2 (brand), D3 (HTML beside md twin, always local), D5 (copy-your-rulings block).

Acronyms used in this report, expanded once here: **md** = markdown; **CDN** = content delivery network (a public host for a script file); **CSP** = Content Security Policy (a browser allow-list of script origins; local files opened from disk have none); **GFM** = GitHub-Flavored Markdown (the table syntax `| a | b |`); **WCAG AA** = the Web Content Accessibility Guidelines contrast level (4.5:1 for body text, 3:1 for large text and UI chrome); **XSS** = cross-site scripting (untrusted text breaking out into executable markup); **SHA-256** = the 64-hex content hash node ships in `node:crypto`; **G1/G2/G3** = plan-it's three human gates (scope · decisions · freeze); **DoD** = Definition of Done; **CLI** = command-line interface; **CWD** = current working directory.

## 0. Scope + method (what you read, what you ran)

Read in full (read-only):
- `~/.claude/skills/conclude-it/build-report.py` (147 lines), `~/.claude/skills/conclude-it/report-template.html` (138 lines), `~/.claude/skills/conclude-it/SKILL.md` L60, L294–316, L375 (renderer invocation).
- Seven reference HTMLs plus this run's own blueprint, parsed with a Python census script (tags, classes, tables, `<details>`, mermaid, external scripts, fonts, `:root` tokens, theme hooks, `claude-*` hits) rather than eyeballed. Files: `delivery/v4/resources/Enhance plan-it/{DECISIONS-bkp-case,SEED-TRIAGE-2026-09-04,SEED-DECISIONS-v2}.html`; Engine-Core `0-done/mission-control-card-context/visual/anatomia-de-uma-decisao.html`, `0-done/praxya-sprint1-ads-rules/delivery/CONTRACT.html` (+ its `CONTRACT.md` sibling and `GATE.md`), `0-done/open-sessions-closeout/{OVERNIGHT-RUN-REPORT,DECISIONS}.html` (+ `DECISIONS.md`); `delivery/v4/V3-VS-V4-CORE-ENHANCEMENTS.html`.
- Brand: `assets/brand/Her0 brad guideline.md` §4 (L160–223), §5 (L225–239), §9 (L325–349).
- Gate-check anchors: `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs` `cmdHandoff` L675–760, status vocab L843–860, `MIRROR_PAIRS` L1556–1565, `cmdMirrorCheck` L1567–1612, dispatch L1615–1652; `plugins/plan-it/scripts/hooks/planit-guard.mjs` L84–100 (W3 model-id regex); `tests/v3/mirror-drift.mjs` (test-harness shape); `plugins/plan-it/hooks/hooks.json`; `plugins/plan-it/.claude-plugin/plugin.json`; `references/formats.md` §1, `references/templates.md` L148–180.

Ran (all read-only or scratchpad-only):
- `build-report.py` twice on a scratchpad manifest with a GFM table, a `</script>` / `</SCRIPT>` breakout probe, a `javascript:` link, and a missing embed → exit codes, byte-identity (`cmp`), SHA-256, and a Python `html.parser` pass over the emitted `<script type="text/markdown">` block.
- `curl -I` on cdnjs mermaid `10.9.1` and `11.4.1`, the cdnjs library API, and the Google Fonts URL for Space Grotesk + Inter + JetBrains Mono.
- WCAG contrast computation for 16 brand color pairs.
- `find` across `~/Workspace` for brand-file naming conventions; `node --version`; `which open`; `ls /Applications | grep Chrome`.

## 1. Findings

**F-A1 · conclude-it renderer inventory.** [VERIFIED-IN-CODE] `build-report.py` L12–33 documents the manifest: `title`, `subtitle_html`, `output`, `sections[]` where a section is `{heading?, table?{headers,rows}, cards?[], html?}` and a card is `{id, title, badge{label, tone∈ok|hold|open|act}, rename_html, body_html, test_html, embeds[{path,label}]}`. Template slots are exactly three: `{{TITLE}}` (L6, L75), `{{SUBTITLE}}` (L76), `{{BODY}}` (L77). Embed paths resolve relative to the manifest dir, then CWD (L106, L47–53). Output path: absolute, else manifest-dir-relative, else CWD (L129–133). Exit codes: `die()` → 1 (L42–44); warnings → 2 (L143); else 0. Cell content in tables and `body_html` is raw HTML, not escaped (L59–61, L78); only `id`, badge label, embed label/path and the title are escaped (L69, L74, L86, L89, L122).

**F-A2 · The renderer is deterministic and its warning path works.** [MEASURED] Two consecutive runs on the same manifest produced byte-identical output (`cmp` clean; SHA-256 `57fff9d3…e857280`, 9,105 bytes). No timestamp is written by the script. A missing embed produced `WARNING: embed not found: missing.md (card X1)`, exit 2, and the visible placeholder `*(report file not found at build time: `missing.md`)*` in the page (L83–85).

**F-A3 · The `</script` escape is incomplete: uppercase breaks out.** [MEASURED] L52 does `content.replace("</script", "<\\/script")`, case-sensitive. My embed contained `</SCRIPT><b>case</b>`; Python's `html.parser` over the emitted block reported `END script` mid-embed followed by a live `START b`. HTML end-tag matching is ASCII case-insensitive, so a markdown embed containing `</Script>` terminates the `text/markdown` script block and everything after it is live markup. The mini renderer also never escapes `"` (template L94 escapes only `& < >`) and passes link targets through verbatim (L100), so `[x](javascript:…)` and `[x](a" onmouseover="…)` reach the DOM as written. [INFERRED: exploitability in Chrome from the spec; the parse-level breakout is measured.]

**F-A4 · Mini markdown renderer feature set.** [VERIFIED-IN-CODE] template L93–131: `#`–`####` headings, `**bold**`, `*italic*`, inline code, links, `---`, fenced code, blockquotes, `-`/`*` lists, GFM tables (header + separator row required). Numbered lists render as `<ul>` with a bold number (L126), not `<ol>`. Not supported: nested lists, images, task lists, `#####`/`######`, reference links, inline HTML (escaped by design). Rendering is client-side at load (L132–135); the shipped HTML is self-contained.

**F-A5 · Theme handling is the three-block token pattern.** [VERIFIED-IN-CODE] template L8–17: bare `:root` light tokens; `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`; `:root[data-theme="dark"]`. 11 tokens: `bg card ink muted line accent act gate ok chip hold`. Toggle cycles auto→light→dark, persisted in `localStorage` inside try/catch (L79–92). Font is the system stack (L19); no brand fonts.

**F-A6 · How conclude-it invokes it.** [VERIFIED-IN-CODE] SKILL.md L60: a haiku-tier subagent authors only the JSON manifest; L306: `python3 <skill-folder>/build-report.py <manifest.json> --open`; L314: "non-zero exit / WARNING = broken report (fix manifest, rebuild)"; L375: "never a claude.ai Artifact — local file, opened in Chrome". `--open` is `open -a "Google Chrome"` with `check=False` (L141): macOS-only, no Linux/Windows path, no fallback when Chrome is absent.

**F-A7 · Reference HTML census.** [MEASURED] (bytes · h2 · tables · `<details>` · mermaid blocks · external scripts · font family · dark-mode hooks · `claude-` hits)

| File | bytes | h2 | tables | details | mermaid | ext script | fonts | dark hooks | `claude-` hits |
|---|---|---|---|---|---|---|---|---|---|
| DECISIONS-bkp-case.html | 21,332 | 3 | 2 | 6 | 0 | none | system | prefers only (no toggle) | 4 (`claude-sub`, `claude-8ftools` = session names) |
| DECISIONS.html (ruled twin) | 23,176 | 3 | 2 | 6 | 0 | none | system | prefers only | 4 (same) |
| OVERNIGHT-RUN-REPORT.html | 96,205 | 4 | 3 | 7 | 0 | none | system | prefers + data-theme | 10 (`claude-cli-runner` = package name) |
| SEED-TRIAGE-2026-09-04.html | 38,086 | 7 | 2 | 0 | 0 | none | Bricolage Grotesque + IBM Plex (Google Fonts) | prefers + data-theme | 0 |
| SEED-DECISIONS-v2.html | 240,521 | 15 (+35 h3) | 29 | 8 | 12 | jsdelivr `mermaid@10.9.1` | via `var(--mono)`, 7 `<style>` tags | 6 media blocks, 3 section-scoped token sets | 6 incl. **`claude-sonnet-5`** (a real model ID) |
| anatomia-de-uma-decisao.html | 23,754 | 6 | 2 | 0 | 0 | none | Instrument Serif + IBM Plex | prefers + data-theme | 0 |
| CONTRACT.html | 18,257 | 10 | 4 | 0 | 0 | none | Archivo + IBM Plex | prefers + data-theme | 0 |
| V3-VS-V4-CORE-ENHANCEMENTS.html | 55,227 | 8 (+10 h3) | 3 | 1 | 0 (5 text mentions, flows are arrow text in `.flow`) | none | Manrope + Source Serif 4 + JetBrains Mono | prefers + data-theme | 0 |

Three of the eight use the conclude-it template verbatim (same 11 tokens, same class names `card id badge b-* more srcnote mdout overflow sub`). The other five are hand-authored one-offs with five different font stacks; none uses the brand's Space Grotesk + Inter. SEED-TRIAGE has no `<meta charset>`.

**F-A8 · Reusable markup patterns extracted from the references.** [MEASURED]
- *Decision card* (DECISIONS-bkp-case): `<div class="card"><h3><span class="id">D4</span> title <span class="badge b-open">open</span></h3>` → `<p>File: <code>…</code></p>` → question paragraph with **A**/**B** options → `<p class="unblocks">` (what it unblocks / same-family call) → `<details class="more"><summary>Read more</summary><p class="exp">Why nobody should pick for you: …</p><p class="srcnote">Source note (rendered):</p><div class="mdout"><script type="text/markdown">…</script></div></details>`. The ruled twin replaces the badge with `b-ok` and the h3 gains "ruled: A". Ruled table columns: `ID | Ruling | Effect`. The HTML subtitle names the twin: "markdown twin: `DECISIONS.md`".
- *Rulings-carried-forward table* (SEED-DECISIONS-v2 "Your rulings"): `Item | Your call | State` with `<span class="tag t-good|t-warn">` state chips and evidence after the chip ("T-E2-14 16:53Z · your approve").
- *Honest-states triptych* (SEED-DECISIONS-v2 "The pane, in its three honest states"): `.three` grid, column headers coloured `var(--ok)` / `var(--muted)` / `var(--bad)`, labels literally "good · …", "legitimately empty · …", "misconfigured · …"; empty and bad states use `.state.empty` / `.state.bad` boxes whose text says what the system did, not what the screen shows ("0 de 89 transcrições dispararam um trigger. Isto é um facto sobre o que o brain fez"). anatomia-de-uma-decisao does the same as `.two-up > .stage > .stage-label` "B · ainda não rodou nada" / "C · mal configurado" and follows with `.callout.warn` stating that state C removes the Approve button.
- *Mockup* (SEED-DECISIONS-v2 Salas pane): `.hsl-win > .hsl-bar (dots + URL + "Space fernando-ott · UTC") > .hsl-scroll > .hsl-panes > .hsl-pane` with real measured counts in every row ("Salas · 28 · por cliente", "grupo · 1.474 msgs · 09-04 15:07") and overflow rows "+15 salas sem cliente atribuído". Each mockup section carries its own `<style>` with a namespaced token set (`.hsl`, `.s1r`, `.s23`, `.cr`) and its own dark override.
- *Measurement provenance* (SEED-DECISIONS-v2): `<details><summary>Rows and queries behind this fragment</summary>` naming tool (`mongosh`), namespace, database, "read-only", and the UTC timestamp "2026-09-04 ~22:00Z".
- *Flow*: `<pre class="mermaid">flowchart LR …</pre>` ×12, initialised with `mermaid.initialize({startOnLoad:true, theme: matchMedia('(prefers-color-scheme: dark)').matches?'dark':'default', securityLevel:'loose'})`. Theme is chosen once at load, so a manual toggle does not re-theme diagrams.
- *Triage verdict* (SEED-TRIAGE): `.tally` four tiles (Plan now / Already planned, build instead / Owner decision / Measured zero, skip) with counts; per-seed `<section class="seed">` → `.head` (eyebrow, h2, `.path.mono` "SEED.md · 323 lines · seeded 2026-09-03", `.pill.plan|build|decide|light`) → `.anatomy` k/v grid ("What it does / Why it exists / Do we need it / Plan-it must decide / Depends on") → `.verdict` left-border box; `.footer` "Sources re-checked today: …".
- *Contract mirror* (CONTRACT.html): `.eyebrow` "Praxya · Sprint 1 · Delivery law" → h1 → `.meta` with `.pill.p-ok` "v1.0 — FROZEN · G3 approved · Fernando Ott · 2026-08-26" and "Canonical source: `delivery/CONTRACT.md` (this page mirrors it; the orchestrator keeps them in sync)" → `.lockbox` "**G2 locks (Fernando, 2026-08-26):** pilot org = …" → numbered h2 sections mirroring the md.

**F-A9 · The one existing md↔html "mirror" already drifted, and nothing could tell.** [MEASURED] `CONTRACT.md` has 11 H2 (§10 "Amendments" with a dated v1.1 entry from 2026-08-27, §11 "Changelog"); `CONTRACT.html` has 10 h2 and ends at "10 · Changelog". The HTML predates the amendment and carries no hash, date-of-render, or source stamp. The `.meta` sentence promises the orchestrator keeps them in sync; nothing checks it. This is precisely the failure E2's `mirror` check must make impossible.

**F-A10 · The DECISIONS twin is not a content mirror.** [MEASURED] open-sessions-closeout `DECISIONS.md` is 43 lines (rulings ledger table + wave gates); `DECISIONS.html` is 23 KB and additionally holds the explanations and the embedded source notes. So "twin" in the field means *the md is the canonical ledger; the HTML is the md plus embeds plus explanatory prose*. The mirror rule must therefore assert provenance (rendered from this md at this hash, with these embeds at these hashes), not text equivalence.

**F-A11 · v3 produced zero HTML.** [MEASURED] `find delivery docs -name "*.html"` returns only the four v4 files (this run's blueprint and the three copied references). Every v3 deliverable is markdown.

**F-A12 · Brand tokens.** [VERIFIED-IN-CODE] `assets/brand/Her0 brad guideline.md` L178–182 primaries Ink `#0D1117`, Signal `#00E5A0`, Flare `#FF6B4A`; L186–196 neutrals Snow `#FFFFFF`, Cloud `#F6F8FA`, Mist `#E6EDF3`, Slate `#8B949E`, Steel `#484F58`, Carbon `#C9D1D9`, Ink Soft `#161B22`, Ink Mid `#21262D`; L199–205 semantics Valid `#2EA043`, Warn `#D29922`, Fail `#F85149`, Info `#58A6FF`; §9 L327–347 adds `signalD #00B37D`, `flareD #D4553A`. §5 L225–239: Space Grotesk (titles, labels uppercase spacing 4, display numbers), Inter (body, secondary, taglines italic), JetBrains Mono (code), Calibri as the documented fallback. L208–210: Signal is "destaque cirúrgico, NUNCA fundo universal"; usage 50/30/12/8.

**F-A13 · Brand accents fail body-text contrast on light backgrounds.** [MEASURED] WCAG ratios: Signal on Snow 1.65 (fail even for UI); SignalD on Snow 2.71 (fail); Flare on Snow 2.82 (fail); FlareD on Snow 4.07 (UI/large only); Slate on Snow 3.08 (UI/large only, not body); Warn on Snow 2.52 (fail); Info on Snow 2.53 (fail); Valid/Fail on Snow 3.37/3.35 (UI/large only). On Ink everything passes: Signal 11.46, Flare 6.72, Carbon 12.26, Slate 6.15. Steel on Snow 8.28 and Ink on Snow 18.92 pass. Consequence: the light theme cannot use Signal/Flare/Info/Warn as text colours; they must be backgrounds behind Ink text or bordered chips, and "muted" body text must be Steel, not Slate.

**F-A14 · Brand-file naming in the wild has no single convention.** [MEASURED] `find ~/Workspace -maxdepth 4` for brand files: `docs/brand/` directories (maestro-portal, despachante-digital), `brand/BRAND.md` + `brand/brand-guide.md` + `brand/brand-tokens.md` (snap-studio), `docs/brand-guidelines.md` (agentkits-marketing), `assets/brand/*.md` (plan-it). No repo has a `brand.json`. Any detector must accept markdown guidelines, which means either parsing hex tables out of prose or requiring a machine-readable sidecar.

**F-A15 · Gate-check has no notion of HTML today, and its extension points are clear.** [VERIFIED-IN-CODE] `cmdHandoff` L675–689 lints only `collectMdFiles(dir)`; `MIRROR_PAIRS` L1556–1565 is the fixed root↔plugin list of 8 (SKILL, machine, gate-check, guard, 4 references); drift exits 2 (L1611, "distinct drift exit, per T-C3-06"); commands dispatch through the table at L1617–1630 and the module is import-safe (L1633–1635) so exported check functions can be unit-tested. The test-harness shape (`tests/v3/mirror-drift.mjs`) is: spawn `gate-check <verb> --dir <fixture>`, assert exit code and stderr regexes.

**F-A16 · The model-id leak regex already exists.** [VERIFIED-IN-CODE] `planit-guard.mjs` L89 `const MODEL_ID_RE = /claude-[a-z0-9-]+/;` (verbatim from CONTRACT C-W3-02). The census shows it would false-positive on `claude-sub`, `claude-8ftools`, `claude-cli-runner` (session and package names in two references) and true-positive on `claude-sonnet-5` in SEED-DECISIONS-v2. The renderer lint should reuse the regex for parity with the guard and accept an explicit per-manifest allow-list for non-model tokens rather than loosening the regex.

**F-A17 · CDN and font availability.** [MEASURED] `https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js` → HTTP 200; `…/11.4.1/mermaid.min.js` → 404; cdnjs library API reports latest `11.15.0`. Google Fonts `css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap` → 200. Local files opened via `file://` have no CSP, so both hosts load in Chrome; the claude.ai artifact allow-list is irrelevant because D3 forbids artifacts for these reports.

**F-A18 · Host facts.** [MEASURED] `node` v20.19.2 (ESM, `node:crypto`, `node:child_process` available); `/usr/bin/open` present; `Google Chrome.app` installed. `xdg-open` and `google-chrome` absent on this host, as expected on macOS.

**F-A19 · GATE.md format (the target of E3's answered queue).** [VERIFIED-IN-CODE] praxya `GATE.md`: "Answered" table `# | Decision / authorization | Answer` (G-1…G-7), "Still human, but NOT blocking the run" table `# | Item | Owner | When` (H-1…H-3), and "Standing rules the orchestrator enforces" bullets. A DECISIONS→GATE projection therefore needs three item kinds already present in E3's text: decisions, authorizations, owner actions.

**F-A20 · KICKOFF pinning already hashes the contract.** [VERIFIED-IN-CODE] `templates.md` L150–153: KICKOFF block 0 pins `Contract: <path> sha256=<64-hex>`; `delivery/v3/KICKOFF.md` L14 carries a real one. The mirror stamp proposed below reuses this exact grammar (`<relpath> sha256=<hash>`), so the hash discipline the builder already trusts extends to the HTML layer without a new convention.

## 2. What v3 has that v4 builds on (reuse map)

| Existing thing | Where | v4 use |
|---|---|---|
| Manifest → template → HTML pattern, three slots, deterministic body assembly | `build-report.py` L97–143 | Port 1:1 to `build-report.mjs`; keep `title/subtitle_html/output/sections` so a conclude-it manifest still renders (back-compat sugar: section-level `table`/`cards`/`html`) |
| Card + badge + `rename` chip + "How to test" + embed `<details>` markup | `build-report.py` L66–94, template L28–69 | `decision-card`, `cards`, `embed` block types; badge tones `ok/hold/open/act` map onto status vocabulary chips |
| Three-block light/dark token pattern + persisted toggle | template L8–17, L79–92 | Keep verbatim; tokens become brand-driven (§4.3) |
| Client-side mini md renderer with GFM tables | template L93–135 | Keep client-side (§4.6) with the escape fixes from F-A3 |
| `</script` escaping of embeds | `build-report.py` L52 | Make case-insensitive and also neutralise `<!--` (§4.6) |
| Exit-code contract 0 / 2 warnings / 1 error | `build-report.py` L42–44, L143 | Identical; gate-check treats 2 as "broken report" like conclude-it SKILL L314 |
| `--open` via `open -a "Google Chrome"` | `build-report.py` L141 | Extend with platform fallbacks (§4.5); default remains "create locally" (D3) |
| `mirror-check` byte-parity verb, exit 2 on drift, fixture `--dir` mode | `gate-check.mjs` L1556–1612 | Add the new script/template/brand files as mirror pairs; the new `mirror` (md↔html) verb copies its shape and exit code |
| `handoff` lint accumulators `ok/fail/finish`, md-file walker | `gate-check.mjs` L675–689 | `mirror` runs inside `handoff --dir` after the md checks (Stream B wires it) |
| W3 model-id regex | `planit-guard.mjs` L89 | Renderer's leak lint uses the same regex over the rendered HTML |
| Status vocabulary set | `gate-check.mjs` L849 | Renderer's `status` chip block accepts only these four strings |
| KICKOFF pin grammar `<path> sha256=<hash>` | `templates.md` L153, `delivery/v3/KICKOFF.md` L14 | Mirror stamp uses the same grammar |
| Decision log tags `[DECIDED]/[CHANGED]/[CONFIRM: owner]` and roadmap lock table `Decision · Choice · Owner · Date` | `formats.md` L15–26 | DECISIONS.md rows map onto `rulings` block columns (§4.4) |
| Test-harness shape: spawn gate-check on a fixture, assert exit + stderr | `tests/v3/mirror-drift.mjs` | Every seed in §5 runs this way |
| Field markup patterns (decision card, rulings table, honest-states triptych, mockup window, measurement provenance details, triage verdict, contract lockbox) | F-A8 | Become the fixed CSS of the template; the manifest fills slots |

## 3. Gaps v4 must close

1. **No node renderer exists; the only renderer is Python inside a user-level skill folder** (`~/.claude/skills/conclude-it/`), outside the plugin and outside mirror-check. → E2. Zero-dep node port shipped inside `plugins/plan-it/`.
2. **Three slots cannot express the reference pages.** The references use decision cards with "unblocks" and "why nobody should pick for you", rulings tables, honest-state triptychs, mockup windows, mermaid flows, measurement provenance, triage tallies, contract lockboxes (F-A8); the template has table/card/html only (F-A1). → E2, E3, E5, E6.
3. **No mirror assertion.** CONTRACT.html drifted one section behind its md with no stamp (F-A9). → E2 mirror check.
4. **No brand.** All eight references use different or system fonts; none uses Her0 tokens (F-A7); D2 requires repo-guideline-else-bundled-default with a visible badge. → E2/D2.
5. **Escape hole in embeds** (F-A3) → E2 (security of the renderer; a malicious or merely unlucky research note could break the page).
6. **No glossary surface anywhere** (grep for glossary/legend hit only a `.legend` key in the blueprint and one word in SEED-DECISIONS-v2) → E10 render side.
7. **`--open` is macOS-only with no fallback and no "create-only" statement** (F-A6) → D3.
8. **Mermaid theme frozen at load; no offline story; jsdelivr host** (F-A8 flow) → E5.
9. **`claude-*` model IDs can leak into HTML** (SEED-DECISIONS-v2 contains `claude-sonnet-5`, F-A16) → hard constraint 4 applied to the HTML layer.
10. **Counts typed, not computed, in HTML** — SEED-TRIAGE tally tiles are hand-typed digits → hard constraint 5: `tally` and table footers must be computed from rows.
11. **Rulings never carried forward automatically** — "Your rulings" in SEED-DECISIONS-v2 is hand-authored → E3/D5 `rulings` block sourced from DECISIONS.md.
12. **No standard place for the twin** — references sit beside their md by convention only (`DECISIONS.md`/`.html`, `CONTRACT.md`/`.html`) → D3 naming rule + `mirror` check.

## 4. Design proposal for this concern

### 4.1 Files and where they live (additive; new mirror pairs)

```
plugins/plan-it/skills/plan-it/scripts/build-report.mjs          # renderer (node ≥18, builtins only)
plugins/plan-it/skills/plan-it/scripts/report-template.html      # template with slots
plugins/plan-it/skills/plan-it/assets/brand/default.brand.json   # bundled Her0 tokens (D2 fallback)
plugins/plan-it/skills/plan-it/references/report-family.md       # manifest schema + block catalogue (Stream C writes prose; this section is its source)
scripts/build-report.mjs · scripts/report-template.html · assets/brand/default.brand.json   # root mirrors
```
`MIRROR_PAIRS` gains three pairs (8 → 11). The release-checklist string "mirror-check 8/8" in `CHANGELOG.md` must change to 11/11 (flag for Stream B/C). The 1.2 MB brand PDF is NOT shipped in the plugin; only the JSON tokens are.

Twin naming (D3): every rendered report is `<NAME>.html` beside `<NAME>.md` in the same directory, same basename, same case. Manifests are transient authoring inputs and live in the run's state dir, never beside the twin: `.plan-it/<run>/manifests/<NAME>.manifest.json` (Stream B owns `.plan-it/<run>/` layout; I only need one folder in it).

### 4.2 CLI and exit codes

```
node build-report.mjs <manifest.json> [--open] [--brand <path>|default] [--out <file>] [--check]
```
- **0** rendered, no warnings. **2** rendered with warnings (missing embed, unresolved glossary ID, unknown block type rendered as placeholder, brand file unparsable → fell back to default, mermaid block present but `flow.offline` not declared). **1** error, nothing written (manifest unreadable, `schema` missing/unknown, `title`/`output`/`kind` missing, source md missing, output dir not creatable).
- `--check`: render to memory, compare with the existing `<NAME>.html`; exit 0 identical, 2 stale/missing, 1 error. Never writes. This is what gate-check's `mirror` verb calls (§4.7).
- `--brand`: explicit path wins over detection; `default` forces the bundled tokens.
- Stdout: one line `built: <abs path> (<bytes> bytes) brand=<default|repo:<relpath>> stamp=sha256:<12-hex prefix>`; warnings on stderr prefixed `WARNING:`; errors `build-report: ERROR:`.
- `--open` never changes the exit code (a failed `open` prints `note: could not open: <reason>`).

### 4.3 Brand: tokens, detection, badge (D2)

`default.brand.json` (schema `planit-brand/1`), derived from the guideline §4/§5/§9 with the F-A13 contrast mapping applied:
```json
{
  "schema": "planit-brand/1",
  "name": "Her0 (DevOtts default)",
  "source": "assets/brand/Her0 brad guideline.md §4 §5 §9",
  "palette": { "ink":"#0D1117","inkSoft":"#161B22","inkMid":"#21262D","signal":"#00E5A0","signalD":"#00B37D",
               "flare":"#FF6B4A","flareD":"#D4553A","snow":"#FFFFFF","cloud":"#F6F8FA","mist":"#E6EDF3",
               "slate":"#8B949E","steel":"#484F58","carbon":"#C9D1D9",
               "valid":"#2EA043","warn":"#D29922","fail":"#F85149","info":"#58A6FF" },
  "fonts": { "display":"\"Space Grotesk\", \"Segoe UI\", system-ui, sans-serif",
             "body":"Inter, -apple-system, \"Segoe UI\", Roboto, sans-serif",
             "mono":"\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, monospace",
             "googleFontsHref":"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" },
  "roles": {
    "light": { "bg":"snow","card":"cloud","line":"mist","ink":"ink","muted":"steel","accent":"signalD","accentBg":"signal@15%",
               "ok":"valid","warn":"warn","bad":"fail","info":"info","chip":"mist","hold":"steel",
               "rule":"semantic colours are chip backgrounds or borders with ink text; never body text (contrast: Signal/Snow 1.65, Slate/Snow 3.08)" },
    "dark":  { "bg":"ink","card":"inkSoft","line":"inkMid","ink":"carbon","muted":"slate","accent":"signal","accentBg":"signal@15%",
               "ok":"valid","warn":"warn","bad":"fail","info":"info","chip":"inkMid","hold":"slate" }
  }
}
```
The template consumes only **role tokens** (`--bg --card --line --ink --muted --accent --accent-bg --ok --warn --bad --info --chip --hold --font-display --font-body --font-mono`), so a repo brand only needs to fill roles; the renderer emits the three-block CSS (F-A5) from `roles.light`/`roles.dark`. `@15%` is rendered as `color-mix(in srgb, <hex> 15%, transparent)` exactly as the template already does (L34–37).

**Detection order** (first hit wins; every step is a plain existence check from the target repo root, which is the run's `--dir`/CWD):
1. `--brand <path>` flag.
2. `.plan-it/brand.json` (a repo can pin its choice once).
3. `brand.json` · `assets/brand/brand.json` · `docs/brand/brand.json` · `brand/brand.json`.
4. A markdown guideline: `assets/brand/*.md`, `docs/brand/*.md`, `docs/brand*.md`, `brand/*.md`, `BRAND.md` (F-A14 names). The renderer does **not** parse hex tables out of prose (too fragile to be deterministic); a markdown-only hit yields **exit 2 + warning** `brand guideline found at <path> but no brand.json sidecar — rendered with default tokens; run "build-report.mjs --brand-init <path>"` and the badge reads `brand: default (guideline present, not tokenised)`. `--brand-init` is a later convenience (out of 4.0 unless Stream C wants it) that scaffolds `brand.json` from the first `| Name | Hex |` table it finds and asks the owner to confirm.
5. Bundled `default.brand.json`.

**Badge**: the template header always renders `<span class="brand-badge" data-brand="default|repo">brand: Her0 default</span>` or `brand: <name> · <relpath>`, plus a `<meta name="planit-brand" content="default|repo:<relpath> sha256=<hash>">` so the mirror check can also detect a changed brand file.

### 4.4 Report family and manifest (E1, E2, E3, E5, E7, E10)

Manifest schema `planit-report/1`:
```json
{ "schema":"planit-report/1", "kind":"DECISIONS", "title":"…", "subtitle_html":"…",
  "source":{"path":"DECISIONS.md"}, "output":"DECISIONS.html",
  "glossary":{"path":"GLOSSARY.md"}, "rulings":{"path":"DECISIONS.md#rulings"},
  "sections":[ {"id":"open","heading":"Open — read & answer when ready","blocks":[ {"type":"decision-card", …} ]} ] }
```
`kind` selects the required-section checklist and the header eyebrow; `source.path` is what the stamp hashes; `sections[].blocks[]` is the ordered content. Section-level `table`/`cards`/`html` (conclude-it shape) is accepted and rewritten to blocks so an old manifest still renders.

| Kind | md twin | Required sections (renderer warns, exit 2, if absent) | Rendered when (state names are Stream B's; I name the moment) | Reader |
|---|---|---|---|---|
| SCOPE-BRIEF | `SCOPE-BRIEF.md` | glossary · `cards` one per candidate size×shape (produces: file tree `embed`; build shape: sessions/waves `flow`; cost to human: gates + questions `table`; "wrong when" sentence) · `states` for the run itself (good / too small / misconfigured repo) · recommendation `decision-card` | before the G1 question (E1) | owner, first contact with the run |
| RESEARCH-REPORT | `research/<stream>.md` or `01-findings.md` | glossary · findings `table` (claim, evidence path:line, tag) · `measurement` blocks · `mockup`/`flow` where UI/flow-shaped · `states` per surface · sources footer | end of discovery, before synthesis | owner + spec authors |
| TRIAGE (E6) | `TRIAGE.md` | glossary · `tally` (computed) · per-seed `triage-card` (anatomy k/v + verdict ∈ Plan now/Build instead/Owner decision/Skip) · `measurement` with stale badge | before planning starts | owner |
| DECISIONS (E3) | `DECISIONS.md` | glossary · `rulings` table (ruled rows: ID · ruling · effect) · open `decision-card`s (kind ∈ decision/authorization/owner-action; question, options, recommendation, "why nobody should pick for you", `embed` Read-more, unblocks, deadline-relative-to-wave for owner actions) · `rulings-forward` (carried from earlier reports) · `copy-rulings` block (D5) | G2 moment in guided mode; PLAN-REVIEW moment in autonomous-draft | owner, answers here; answered queue projects to `GATE.md` |
| CONTRACT mirror | `CONTRACT.md` | glossary · `lockbox` (G2 locks: owner, date, list) · numbered sections mirroring every md H2 (renderer **derives** the section list from the md headings, so F-A9 cannot recur) · `cases` table computed from `## Cases` | at freeze and on every amendment | squads, orchestrator |
| KICKOFF | `KICKOFF.md` (+ `SESSIONS.md`) | glossary · pins `table` (repo, SHA, state file, contract hash) · launch prompt `copy` block · sessions manifest `table` (name, role, opens-when, reads) with one `copy` block per session · runbook `flow` | handoff | the person opening terminals |
| PLAN-REVIEW (E7) | `PLAN-REVIEW.md` | glossary · defaults `table` numbered R1…Rn (default applied · alternative · why this default · contradict by writing "Rn: <alt>") · package summary `tree` embed · `states` (what happens if you answer nothing) · `copy-rulings` | after autonomous draft, before freeze | owner, one review round |
| GLOSSARY panel | `GLOSSARY.md` | rendered as the collapsed panel at the top of **every** kind above; standalone `GLOSSARY.html` optional | regenerated whenever IDs change | everyone |

DECISIONS.md → manifest mapping: a ruled row `| D4 | ruling | effect |` → `rulings.rows`; an open item written per `formats.md` §1 (`D3. [CONFIRM: owner] …`) → a `decision-card` with `status:"open"`; `[DECIDED]` → `rulings` row with `state:"ruled"`; `[CHANGED]` → `rulings` row with `state:"changed"` and both values. The `copy-rulings` block renders the ruled + open IDs as a fenced text the owner pastes back into chat: `D4: A · D8: 1+2 · D12: grant` (one line, deterministic order = document order).

### 4.5 `--open` behaviour (D3)

Default is **create locally, do not open** (the run may be headless or overnight). With `--open`: `process.platform==='darwin'` → `spawnSync('open',['-a','Google Chrome',file])`; non-zero → `spawnSync('open',[file])`. `linux` → `xdg-open`. `win32` → `cmd /c start "" <file>`. `PLANIT_NO_OPEN=1` or a non-TTY stdout suppresses opening and prints `note: --open suppressed (headless)`. Opening never affects the exit code (§4.2). The SKILL prose (Stream C) tells the model to pass `--open` only at human gates (SCOPE-BRIEF, DECISIONS, PLAN-REVIEW, KICKOFF), never for RESEARCH-REPORT fan-out renders.

### 4.6 Template slots, block types, and where markdown is rendered

Template slots (all replaced; `{{` never survives into output): `{{TITLE}} {{EYEBROW}} {{SUBTITLE}} {{BRAND_BADGE}} {{META_STAMPS}} {{BRAND_CSS}} {{FONT_LINK}} {{GLOSSARY}} {{BODY}} {{MERMAID_SCRIPT}} {{FOOTER}}`. `{{MERMAID_SCRIPT}}` is empty unless at least one `flow` block exists.

Block catalogue (every block accepts optional `id`, `title`, `note_html`; every renderer branch has an honest failure state):

| type | required fields | renders as | failure state |
|---|---|---|---|
| `table` | `headers[]`, `rows[][]`; opt `computed_footer:true` | `.overflow > table`; footer row with **computed** counts per numeric column | ragged row → warning + cell `—` |
| `cards` | `items[]` (conclude-it card shape) | `.card` list | missing `title` → warning, card shows `(untitled)` |
| `decision-card` | `id`, `kind`∈decision/authorization/owner-action, `question_html`, `options[]{label,html}`, `recommendation`, `why_yours_html`, `unblocks_html`; opt `deadline`, `embed`, `status`∈open/ruled, `ruling` | F-A8 card markup, badge = status, `.unblocks`, `<details class="more">` with `.exp` + embedded md | `status:ruled` without `ruling` → warning; open card without `why_yours_html` → warning (the field is the E3 differentiator) |
| `embed` | `path`; opt `label`, `open:false` | `<details class="more"><summary>` + `.srcnote` + `<script type="text/markdown">` | file missing → exit 2 + visible placeholder (as today) |
| `mockup` | `html`, `provenance{source, rows_read, read_at, read_only:true}`; opt `css` (scoped under the block id) | `.mock-win > .mock-bar (dots · label · provenance chip) > .mock-body`; `data-provenance="<source> · <rows_read> rows · <read_at>"` on the wrapper; CSS is rewritten to `#<id> …` selectors | missing `provenance` → **exit 2** and a red `.mock-bar` chip "provenance missing — not drawn from measured rows" (never silently render a fabricated mock) |
| `flow` | `mermaid` (source); opt `caption` | `<pre class="mermaid" data-src="…">` + escaped source; loads mermaid **10.9.1 from cdnjs** (200-verified, F-A17) as the last body script, `startOnLoad:true`, `securityLevel:'strict'`, `theme` derived from the page's current data-theme and re-run on toggle | offline: script fails to load, the `<pre>` stays as readable source text under the caption "diagram source (renderer offline)"; a `<noscript>` note says the same. No `loose` security level |
| `states` | `good{label,html}`, `empty{label,html}`, `misconfigured{label,html}` | `.three` triptych with coloured headers (F-A8) | any of the three missing → warning + a grey column "not enumerated — this state has not been designed" |
| `measurement` | `value`, `unit`, `where` (tool/namespace/path), `read_at` (ISO), `read_only:true`; opt `stale_after` | `.measure` tile: value · unit · "read from <where> at <read_at> · read-only"; `data-stale-after` so the page marks it stale client-side | `read_only` absent or false → **exit 1** (a measurement that wrote is not a measurement) |
| `rulings` | `rows[]{id, ruling, effect, state∈ruled/changed/parked}` | `ID · Ruling · Effect` table (F-A8) | none |
| `rulings-forward` | `from` (path of the earlier DECISIONS.md), `rows[]` | "Your rulings" table `Item · Your call · State` with evidence | `from` missing → warning "no earlier rulings to carry" |
| `copy-rulings` | derived: all `decision-card`/`rulings` ids | `<pre class="copy">D4: A · D8: 1+2</pre>` + copy button | none |
| `glossary` | `path` | collapsed `<details class="glossary">` at page top with `ID · Means · Where defined`; the renderer also wraps the **first** occurrence of each glossary ID in body text with `<abbr title="…">` | file missing → panel renders "GLOSSARY.md not generated yet — IDs on this page are unexpanded" + exit 2; an ID used in the page but absent from the glossary → warning listing it (the hard fail is Stream B's handoff lint) |
| `lockbox` | `owner`, `date`, `items[]` | CONTRACT `.lockbox` banner (F-A8) | none |
| `tally` | `groups[]{label, tone, rows_from:<section id>}` | tiles whose numbers are **counted** from the referenced sections at render time | referenced section missing → tile shows `—` + warning |
| `triage-card` | `seed`, `path`, `anatomy{}` (what/why/need/decide/depends), `verdict∈plan/build/decide/skip`, `verdict_html` | SEED-TRIAGE section markup (F-A8) | verdict outside the four → exit 1 |
| `copy` | `text` | `<pre class="copy">` + copy button | none |
| `html` | `html` | passthrough (escape hatch, discouraged) | none; counted in stdout so reviewers see how often the model bypassed blocks |

**Where markdown renders: client-side, as today.** Recommendation with trade-off: client-side keeps the HTML self-contained (one file, no build-time HTML for embeds, matches conclude-it and the three template-based references), and the embedded `.md` stays greppable verbatim inside the page. The cost is that lints cannot see the rendered form of embeds; that is acceptable because every lint (status vocab, model IDs, glossary IDs, counts) runs over the **markdown twin and the manifest**, which are the canonical inputs. Server-side rendering would only buy lintable HTML for embeds and would duplicate the markdown parser in node. Hardening required either way: escape `/<\/(script)/gi` → `<\/$1` (F-A3), replace `<!--` with `<\!--` inside script data, escape `"` in `esc()`, and allow link schemes only `http(s):`, `mailto:`, `#`, relative paths. Numbered lists become real `<ol>`.

Determinism rule: the renderer writes **no timestamps** and **no absolute paths** into the HTML; dates and paths come from the manifest as authored content. Object key order in the manifest is irrelevant (blocks are arrays). Same manifest + same template + same brand + same embed bytes ⇒ byte-identical HTML.

### 4.7 The md↔html mirror rule (E2, D3) — contract for gate-check's `mirror` verb (Stream B implements)

Stamps written by the renderer into `<head>`:
```html
<meta name="planit-source"   content="DECISIONS.md sha256=<64-hex>">
<meta name="planit-embeds"   content="research/notes/d4.md sha256=<64-hex>; …">   <!-- omitted when none -->
<meta name="planit-brand"    content="default sha256=<64-hex of default.brand.json>">   <!-- or repo:<relpath> sha256=… -->
<meta name="planit-renderer" content="build-report.mjs/4.0.0 template sha256=<64-hex>">
<meta name="planit-kind"     content="DECISIONS">
```
Paths are relative to the twin's directory, forward slashes, no `./`. Hashes are over raw bytes (no newline normalisation), the same way KICKOFF pins the contract.

`gate-check mirror --dir <repo-root>` (also invoked from `handoff --dir` after the md checks):
1. For every `<NAME>.md` under `delivery/` whose kind is in the family table, a sibling `<NAME>.html` **must exist** (exit 2 "missing twin"). Other md files may have twins; they are checked only if present.
2. Parse the five metas; missing `planit-source` → exit 2 "unstamped HTML (hand-authored?)".
3. Recompute SHA-256 of the source md, each embed, the brand file, and the template; any mismatch → exit 2 listing the file and both hashes. `planit-renderer` version newer than the HTML's → warning only.
4. Exit 0 prints `PASS — mirror: N twin(s) current`. Exit 1 only for I/O errors.

Failure → recovery flow: stale twin → `node build-report.mjs <manifest> ` re-renders → `mirror` passes. The manifest is the durable input, so re-rendering is mechanical and needs no model call unless the md changed shape (then the low-tier author updates the manifest). A hand-edited HTML is refused by rule 2, which is the point: the HTML is never the source.

### 4.8 First-use acronym expansion (E10 render side)

The renderer performs the expansion so the model does not have to remember: for each glossary row `| ID | Means | Where |`, the first textual occurrence of `ID` in the body (outside `<code>` and `<pre>`) is wrapped `<abbr class="gl" title="<Means>">ID</abbr>` followed by ` (<Means>)` in `.gl-x` small text; later occurrences get only the `<abbr>`. ID matching uses the union of the existing grammars: `T-[A-Z]\d+[A-Za-z0-9.]*-\d{2}`, `[A-Z]\d+(-[A-Z]\d+)?` epic/squad IDs, `G[123]`, `W\d+`, `D-?\d+`, `CB-\d+`, `INV-\d+`, `R\d+`, and the status vocabulary words. Any ID matched but absent from the glossary is emitted as a warning list (exit 2) so the author fixes GLOSSARY.md; Stream B's handoff lint makes it a hard fail at handoff.

## 5. Test-contract seeds (ID-less; all run as `node tests/v4/<file>.mjs` spawning the renderer or gate-check on a fixture under `tests/fixtures/v4/report/`, asserting exit code + stdout/stderr regex + file bytes, in the shape of `tests/v3/mirror-drift.mjs`)

1. **Renderer determinism.** Given fixture manifest `decisions.manifest.json` with two embeds and one flow, when `build-report.mjs` runs twice into two output paths, then `Buffer.equals` is true and the stdout `stamp=` prefixes match. How: spawn twice, `cmp` bytes.
2. **Missing embed → exit 2 + visible placeholder.** Given a manifest whose embed path does not exist, when rendered, then exit is 2, stderr matches `/WARNING: embed not found: .*missing\.md/`, and the HTML contains `report file not found at build time`.
3. **Manifest without `kind`/`schema` → exit 1, nothing written.** Given a conclude-it-shaped manifest with no `schema`, when rendered with `--strict`, then exit 1 and the output file does not exist. (Without `--strict` it renders as kind `LEGACY` with a warning, exit 2 — back-compat case.)
4. **Brand detection order.** Given a fixture repo root with `.plan-it/brand.json` AND `assets/brand/brand.json` AND a markdown guideline, when rendered without `--brand`, then the HTML `planit-brand` meta names `.plan-it/brand.json`; when `.plan-it/brand.json` is removed, `assets/brand/brand.json` is used; when only the markdown remains, the badge text is `brand: default (guideline present, not tokenised)` and exit is 2.
5. **Bundled default when nothing is found.** Given an empty fixture root, when rendered, then `planit-brand` content starts with `default sha256=` and the hash equals SHA-256 of `default.brand.json`; the badge reads `brand: Her0 default`.
6. **Mirror stamp mismatch fails.** Given a rendered twin, when one byte of the source md is appended and `gate-check mirror --dir` runs, then exit 2 and stderr matches `/DECISIONS\.md: stamped sha256=([0-9a-f]{64}) but current sha256=([0-9a-f]{64})/`; re-rendering makes it exit 0.
7. **Unstamped hand-authored HTML is refused.** Given `X.md` and an `X.html` with no `planit-source` meta, when `mirror` runs, then exit 2 with `unstamped HTML`.
8. **Missing twin for a family kind.** Given `delivery/DECISIONS.md` and no `DECISIONS.html`, when `mirror` runs, then exit 2 `missing twin`; given a non-family md (e.g. `notes.md`) with no html, then no failure.
9. **Glossary panel on every kind.** Given one minimal manifest per kind in the family table (8 kinds), when each is rendered, then each HTML contains exactly one `<details class="glossary"` before the first `<h2>`; and when `GLOSSARY.md` is absent, the panel contains `not generated yet` and exit is 2.
10. **First-use expansion.** Given a glossary row `| S1-A1 | scoped-settings collections epic | epics/… |` and a body mentioning `S1-A1` three times (one inside `<code>`), when rendered, then the first prose occurrence is `<abbr class="gl" title="scoped-settings collections epic">S1-A1</abbr>`, the code one is untouched, and there is exactly one `.gl-x` expansion.
11. **No model-ID leak into HTML.** Given a manifest with `claude-sonnet-5` in a `body_html`, when rendered, then exit 2 and stderr matches `/model ID "claude-sonnet-5" in rendered HTML/` (regex identical to `planit-guard.mjs` L89); given `claude-cli-runner` listed under manifest `allow_tokens`, no warning.
12. **Dark/light tokens all defined in bare `:root`.** Given the rendered HTML, when the first `:root{…}` block is parsed, then every `--token` referenced anywhere in the `<style>` via `var(--token)` is defined there (no colour whose only definition is inside `@media` or `[data-theme]`). How: regex-collect `var\(--[\w-]+\)` and compare sets.
13. **Mermaid offline fallback.** Given a manifest with one `flow`, when rendered, then the HTML contains `<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js"`, exactly one `<pre class="mermaid"` whose text equals the escaped source, `securityLevel:'strict'`, and a `<noscript>` note; and a manifest with no `flow` contains no mermaid script tag at all.
14. **`--open` platform routing.** Given `--open` and a stubbed `PATH` whose `open` script logs its argv, when run with `process.platform` forced to `darwin` (env `PLANIT_TEST_PLATFORM=darwin`), then the log shows `-a "Google Chrome" <file>`; when the stub exits non-zero, a second call without `-a` is logged; when `PLANIT_NO_OPEN=1`, nothing is logged and stdout has `--open suppressed`; exit code is unchanged in all three.
15. **Script-escape completeness (XSS).** Given an embed containing `</SCRIPT>`, `</script >`, `<!--`, `[x](javascript:alert(1))` and `[x](a" onmouseover="y)`, when rendered and parsed with a tolerant HTML parser (node: a 40-line state machine over `<script` … `</script` ASCII-case-insensitive), then exactly one `<script type="text/markdown">` element closes where the renderer closed it, the emitted text contains `<\/SCRIPT>` and `<\!--`, and no `href="javascript:` or `onmouseover=` attribute exists in the file.
16. **Mockup without provenance is refused visibly.** Given a `mockup` block with no `provenance`, when rendered, then exit 2 and the HTML contains `provenance missing — not drawn from measured rows` inside that block's `.mock-bar`.
17. **Counts computed, never typed.** Given a `tally` whose group references a section with 3 `triage-card`s, when rendered, then the tile number is `3`; when a fourth card is added to the fixture, the tile reads `4` with no manifest change to the tally.
18. **Measurement must be read-only.** Given a `measurement` block with `read_only:false`, when rendered, then exit 1 and nothing is written.
19. **Legacy conclude-it manifest still renders.** Given the exact manifest from `build-report.py` L14–33 (title/sections/table/cards/embeds), when rendered by `build-report.mjs`, then exit ≤ 2, the HTML contains the same `card`, `badge b-ok`, `details.more`, `mdout` class names, and the scoreboard table has 1 data row.
20. **Mirror pairs include the renderer.** Given the live repo, when `gate-check mirror-check` runs, then stdout lists `scripts/build-report.mjs`, `scripts/report-template.html`, `assets/brand/default.brand.json` as byte-identical pairs and the summary reads `11 pair(s)`.

Seeds 4, 5, 14 need no live target. None of the twenty is [REAL]; the only network-dependent behaviour (mermaid, fonts) is asserted by the presence of the pinned URL, not by fetching it.

## 6. Contradictions / risks / open questions for synthesis

1. **Block catalogue vs the richness of the best reference.** SEED-DECISIONS-v2 gets its quality from hand-written, section-scoped CSS and bespoke mockup markup (F-A8). A fixed block set will not reproduce it one-for-one; the `mockup.css` escape (scoped under the block id) and the `html` passthrough are the safety valves. Risk: the model reaches for `html` and reinvents layout. Mitigation proposed: the renderer prints `html blocks: N` on stdout and PLAN-REVIEW shows that count; Stream C's SKILL prose sets the norm (blocks first, `html` last).
2. **Brand contrast contradicts the guideline's usage table.** The guideline uses Signal for CTAs/badges and Slate for secondary text; on Snow both fail WCAG (F-A13). The default brand JSON maps `muted` to Steel and treats Signal/Flare as backgrounds in light mode. This is a deliberate deviation from the guideline's letter to honour its intent (readability); the owner should ratify. [INFERRED: that the owner prefers readable over literal.]
3. **`--open` on a headless overnight run.** D3 says "always create locally"; opening a browser from a `claude -p` worker is wrong. The proposal defaults to create-only and gates `--open` on TTY/env. Stream B/C must agree where the SKILL says "open at human gates only".
4. **Mirror check vs the amendment loop.** CONTRACT amendments change the md many times during `parallelPlanning ⟲ AMENDMENT`; every amendment requires a re-render or `mirror` fails at handoff. That is intended, but it adds a mechanical step to the amendment playbook (Stream B/C) and the manifest for the CONTRACT mirror must be derivable from the md headings without a model call (§4.4 says the renderer derives the section list).
5. **Mirror pairs count.** Adding three pairs changes `mirror-check` from 8 to 11 and the CHANGELOG verification line; `machine-diff` is unaffected. Whoever owns the release checklist (Stream B) must update the expectation.
6. **Mermaid version pin.** 10.9.1 is verified on cdnjs and proven by 12 diagrams in the reference; the cdnjs latest is 11.15.0. Mermaid 11 changed some syntax defaults; staying on 10.9.1 is the lower-risk pin for 4.0. Revisit at 4.1.
7. **Where GLOSSARY.md comes from.** I define its consumption (panel + first-use expansion) and its row grammar; its **generation** from the package (every epic ID, case prefix, gate, wave, squad, governance rule, status term) is a gate-check or SKILL step owned by Stream B/C. Bootstrapping: SCOPE-BRIEF renders before any epic IDs exist, so its glossary contains only the run-level vocabulary (G1/G2/G3, size, shape, topology, [REAL], INV, freeze); the panel's "not generated yet" state must not fire there — the run-level glossary must exist from `intake`.
8. **Two renderers for a while.** conclude-it keeps its Python renderer; plan-it ships the node one. Same manifest core, two implementations. Proposal: conclude-it later points at `build-report.mjs` (out of scope for v4; note for the vault).
9. **Model-ID regex false positives** (`claude-sub`, `claude-cli-runner`) are real in the references. The allow-list must be per manifest and visible in stdout, or authors will disable the check.
10. **Open question:** should `mirror` also require the md to link its twin (a footer line `HTML twin: X.html`)? It would make the relationship discoverable from the markdown side for the AI reader. Cheap to add; not in the proposal to keep the md canonical and unchanged by rendering.

## 7. Teammate boundaries

Deliberately not covered here:
- **Statechart states and transitions** for `triage`, `anamnesis`, `scopeBrief`, `render`, `planReview`, and where in `machine.json` each report is produced — Stream B. I only named the *moment* each kind is rendered (§4.4 table) and the `mirror` verb's input/output contract (§4.7); the verb's implementation, its place in `handoff`, the `runs`/`archive` verbs, and `.plan-it/<run>/` layout are Stream B's.
- **GLOSSARY.md generation** and the "unknown ID fails" handoff lint (E10 hard fail) — Stream B; I specified the row grammar and the renderer's soft warning.
- **SKILL.md prose**, the low-tier author's instructions for filling manifests, the "blocks first, html last" norm, the "open at human gates only" rule, `references/report-family.md` wording — Stream C. §4 here is the source they can lift from.
- **Decision-queue semantics** (three item kinds, deadlines relative to waves, projection to GATE.md) beyond what the `decision-card` block must render — E3 owner stream.
- **Topology/SESSIONS.md content** — I only reserved the KICKOFF manifest sections that display it.
- Anything about the brand PDF or the guideline's narrative sections (§1–3, §6–8) — not renderer concerns.

---
Files measured or read for this report are listed in §0; no file outside `docs/v4/research/stream-A-renderer.md` and the session scratchpad was written.
