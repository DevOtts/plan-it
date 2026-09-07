# Report family — manifest schema & block catalogue

Companion to `delivery/v4/CONTRACT.md` §4.2 (binding) and
`delivery/v4/epics/epics-a-renderer.md` (V4A1–V4A4). This is prose
documentation of the renderer's (`scripts/build-report.mjs`) input contract —
it does not itself bind any behavior; CONTRACT §4.2 is the frozen source of
truth and this file is diffed against it (case T-V4A4-09).

Legend: `T-<EID>-NN` test case · `C-E<n>-NN` CONTRACT case · `V4A<n>` epic — see
`delivery/v4/GLOSSARY.md`.

## 1 · Manifest schema (`planit-report/1`)

Top-level fields, verbatim from CONTRACT §4.2:

| Field | Required | Meaning |
|---|---|---|
| `schema` | required | must equal `planit-report/1` (or the manifest renders as `kind:LEGACY` without `--strict`) |
| `kind` | required | one of the 8 report-family kinds below |
| `title` | always required | page `<h1>` |
| `subtitle_html` | optional | page subtitle, raw HTML |
| `source` | optional | `{path}` — the md twin; hashed into the `planit-source` stamp |
| `output` | always required | where the twin is written |
| `glossary` | optional | `{path}` — the GLOSSARY.md this run reads (never generates) |
| `rulings` | optional | `{path}` — an earlier DECISIONS.md for `rulings-forward` |
| `allow_tokens` | optional | array of non-model `claude-*`-shaped names exempted from the model-ID lint |
| `sections` | required | `[]{id, heading, blocks[]}` |

## 2 · Report-family kinds

| Kind | Twin | Required sections | Rendered when | Reader |
|---|---|---|---|---|
| SCOPE-BRIEF | `SCOPE-BRIEF.html` | Size/shape/topology, DoD | before gate G1 | the human, at G1 |
| TRIAGE | `TRIAGE.html` | Anatomy, verdict | at the triage gate | the human, at triage |
| RESEARCH-REPORT | `<stream>.html` | Findings, measurements | after discovery/synthesis | the human and squads |
| DECISIONS | `DECISIONS.html` | Ruled, defaults, authorizations, owner actions | continuously through the run | the human, at every gate |
| CONTRACT | `CONTRACT.html` | Vocabulary, ownership, interfaces, cases | at freeze | squads, then the human at G4 |
| KICKOFF | `KICKOFF.html` | Launch prompts | at handoff to squads | the squads |
| PLAN-REVIEW | `PLAN-REVIEW.html` | Contradiction queue, ratification | at gate G4 | the human, at G4 |
| GLOSSARY | `GLOSSARY.html` | Static vocabulary, minted IDs | continuously (seeded at intake) | anyone, any time |

## 3 · Block catalogue (17 types)

| Type | Required fields | Renders as | Failure state |
|---|---|---|---|
| `table` | `headers?`, `rows[]`, `computed_footer?` | an HTML table; footer sums numeric columns at render time when `computed_footer:true` | none — always renders |
| `cards` | `items[]{id?, title, badge?, rename_html?, body_html?, test_html?, embeds?}` | one `.card` per item (ancestor `render_card` shape) | a missing embed inside an item is `RENDERED_PARTIAL` (see `embed`) |
| `decision-card` | `id`, `status∈open\|ruled`, `question_html`, plus `why_yours_html`+`recommendation` (open) or `ruling` (ruled) | a `.card.decision-card` with id chip, status badge, options, recommendation | missing required field for its status → `RENDERED_PARTIAL`, card omitted, id named on stderr |
| `embed` | `path`, `label?` | a `<details class="more">` with the file's markdown in a client-rendered `<script type="text/markdown">` | file not found → `RENDERED_PARTIAL`, visible placeholder "report file not found at build time" |
| `mockup` | `id?`, `label?`, `html`/`content`, `css?`, `provenance{source, rows_read, read_at, read_only:true}` | a `.mock-win` frame, `css` scoped to `#<id>` | missing/invalid `provenance` → `RENDERED_PARTIAL`, red chip "provenance missing — not drawn from measured rows" |
| `flow` | `source` (mermaid text) | `<pre class="mermaid">` (escaped source) + pinned cdnjs 10.9.1 script (once per page) + `<noscript>` fallback | none — a flow block always renders (its source is shown as text if mermaid never loads) |
| `states` | `good?`, `empty?`, `misconfigured?` (each `{text\|html}`) | a `.three` triptych, colour-coded per key | a missing key → `RENDERED_PARTIAL`, that column grey, "not enumerated — this state has not been designed" |
| `measurement` | `value`, `unit?`, `where`, `read_at`, `read_only` | a `.measure` tile | `read_only` absent or `false` → `RENDER_FAILED`, nothing written for the whole page |
| `rulings` | `rows[]{id, ruling, effect, state?}` | an `ID · Ruling · Effect` table | none — always renders |
| `rulings-forward` | `from?` (path to an earlier DECISIONS.md), `rows[]{id, your_call, state}` | a "Your rulings" table | a prior item in `from` absent from `rows[]` → `RENDERED_PARTIAL`, dropped item named on stderr; `from` missing entirely → soft warning, not fatal |
| `copy-rulings` | none (derives from every `decision-card`/`rulings` id already assembled) | one `<pre class="copy">ID: value</pre>` block, document order, plus a copy button | none — degrades to an empty block if nothing to copy |
| `glossary` | `path?` (falls back to `manifest.glossary.path`) | a plain (non-collapsed) `ID · Means · Where defined` table | file not found → `RENDERED_PARTIAL`, "GLOSSARY.md not generated yet" |
| `lockbox` | `owner`, `date`, `items[]` | a static banner listing items verbatim, in order | none — always renders |
| `tally` | `groups[]{label, rows_from, type?}` | one tile per group, count computed at render time from the referenced section's actual blocks (G-5) | referenced section missing → tile shows `—`, warning, `RENDERED_PARTIAL` |
| `triage-card` | `what?`, `why?`, `need?`, `decide?`, `depends?`, `verdict∈plan\|build\|decide\|skip` | an anatomy k/v grid + verdict box | `verdict` outside the closed set → `RENDER_FAILED`, nothing written (schema violation) |
| `copy` | `content` | a bare `<pre class="copy">` + copy button | none — always renders |
| `html` | `content` | passthrough (escaped for script/comment breakout, href-scrubbed), increments the `html-blocks=<n>` stdout counter | none — always renders |

## 4 · Provenance stamps

See CONTRACT §4.3 (binding, verbatim): `planit-source`, `planit-embeds`,
`planit-brand`, `planit-renderer`, `planit-kind`.

## 5 · Determinism and security

Same manifest + template + brand + embed bytes ⇒ byte-identical HTML (no
timestamps, no absolute paths). Every embed and raw `_html`/`content` field is
passed through case-insensitive `</script` and `<!--` escaping and an href
scheme allow-list (`http:`, `https:`, `mailto:`, `#`, relative paths only) —
see CONTRACT §6 G-4 (model-ID lint, byte-identical regex to
`planit-guard.mjs`) and V4A3's Test Contract (`delivery/v4/epics/epics-a-renderer.md`).
