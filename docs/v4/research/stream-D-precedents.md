# Stream D — Field precedents (what actually worked in the last two months of runs)

Acronym expansions used below on first mention: **DoD** = Definition of Done · **CDP** = Chrome DevTools Protocol (browser automation) · **QA** = quality assurance · **PR** = pull request · **TTL** = time to live · **DM** = direct message · **CPV** = custo por venda (cost per sale, a Portuguese ads metric) · **ROAS** = return on ad spend.

## 0. Scope + method (what you read, what you ran)

Read end to end:
- `~/Workspace/Engine/Engine-Core/.taskstate/open-sessions-closeout/ORCHESTRATOR-STATE.md` (269 lines, the full overnight trail of an 8-wave orchestrator run, 2026-08-25/26).
- `~/Workspace/Engine/Engine-Core/.agents/history/claudinho/2026-08-26--done-open-sessions-closeout-aug26-orchestrator.md` (session-history ledger card for that same run).
- The praxya "Sprint 1 — Otimizar Ads" delivery package: `KICKOFF.md`, `GATE.md`, `00-program-plan.md`, `STATUS.md`, `W4-QA-REPORT.md` (first ~150 lines), `DECISIONS-VARIAVEIS-2026-08-27.md`, all under `~/Workspace/Engine/Engine-Core/docs/implementation/0-done/praxya-sprint1-ads-rules/delivery/`.
- Session cards `.agents/history/claudeloudr/2026-08-27--praxya-sprint1-ads-rules-research.md` and `.agents/history/claudinho/2026-08-27--s1-ads-orchestrator.md`.
- `docs/implementation/0-done/open-sessions-closeout/README.md`, `REMAINING.md`, `DECISIONS.md` (final ruled ledger), `DECISIONS-pt2.md` (round-2 queue).
- HTML sources, stripped to text with a small local Python script (`html.parser`-based, no dependency — printed with block-level tags as line breaks) since no `lynx`/`w3m`/`bs4` was available in this environment: `SEED-TRIAGE-2026-09-04.html` (full, 360 lines of text), `DECISIONS-bkp-case.html` (full, both the Devotts-local copy and the Engine-Core original — byte-similar), `anatomia-de-uma-decisao.html` (full), and the first ~650 lines of the 1,894-line stripped `SEED-DECISIONS-v2.html` (sampled per instructions — top matter, S1 redesign, and the N5 "fabricated finding" fragment; the remaining ~1,250 lines cover S2–S4 detail not needed for this stream's mandate).
- Grepped `plugins/plan-it/skills/plan-it/references/{templates.md,formats.md}` and `scripts/gate-check.mjs` to confirm what v3 already has (decision-log grammar, KICKOFF/STATUS shapes, closed status vocabulary) so gaps are stated as deltas, not re-inventions.

I did not run any code (no build/test tooling in scope for this stream) — this is a read-and-distill assignment. All HTML "line" references below are to the **stripped text file**, not the source markup, since the markup has no stable line correspondence; where a claim needs a precise anchor I quote instead.

## 1. Findings (F-D1…)

### Orchestrator run (open-sessions-closeout, 2026-08-25/26 — 8 waves)

**F-D1 — Residual disposition at close is a three-way closed set, and the counts are the story.** The program backlog went 33 → 19 → 3 across two drain passes. [VERIFIED-IN-CODE, quoted]
- Round 1 (night): `docs/implementation/0-done/open-sessions-closeout/DECISIONS-pt2.md:1-7` — "sourced from the 19 remaining backlog notes... Wave 8 (WAVE-8-final-drain.md) executes the agent half".
- Round 2 (Wave 8, same day): `ORCHESTRATOR-STATE.md:29` — "Backlog 19→3 (exact exit-criteria set); board NOT archived (REMAINING.md, 4b25127)".
- The terminal state file, `REMAINING.md:1-9`, is explicit about *why* 3 items survived and the board stays open: "Wave 8 (`wave8-final-drain`) drained the board's backlog from 19 notes to the 3 below. Per the wave's own exit criteria the board is NOT archived while owner-blocked work remains — this index is the honest remainder." It then names the disposition of everything else in one sentence: "Everything else was executed, verified, or closed-by-measurement with a disposition footer and archived to `0-done/0-small-tasks/2026-08-24/` (14 notes) or re-filed as an ordinary follow-up in `1-backlog/2026-08-24/` (2 notes)."

This gives a concrete **three-outcome disposition set** for anything still open when an epic/wave/program wants to close:
1. **executed / verified** → closes clean, no residue.
2. **closed-by-measurement** → a measured fact retired the question (see F-D9 below for the general pattern), archived with a footer explaining what was measured.
3. **owner-gated** → moved to the *ordinary* weekly backlog (not kept on the program board), because it's no longer program work, it's a standing owner action — `REMAINING.md:10-14` names the 3 survivors and each has an explicit "why it stays" (a time-fused reminder, a re-authorization only Fernando can do, a key only Fernando can mint).

**Rule extracted:** a board archives when every remaining row is disposed as one of {executed-clean, closed-by-measurement, owner-gated-with-named-owner}. A row that is none of these — an unresolved binding-test-case failure, an ambiguous ruling — blocks archiving. `README.md:16` states the mechanism generally: "`DECISIONS.md` / `DECISIONS.html` hold everything only Fernando can decide or do. Several waves are partially gated on them."

**STATUS/epic column grammar for E8**, distilled from the STATUS legend actually used (`docs/implementation/0-done/praxya-sprint1-ads-rules/delivery/STATUS.md:4-5`): "States: backlog · in-progress · built · deployed · VERIFIED (100% test contract) · IMPLEMENTED-NOT-VERIFIED (target unreachable — listed with reason) · blocked." This is the existing v3 closed vocabulary (see §2) *plus* a disposition axis that only applies at close time, which the open-sessions-closeout program supplies: BACKLOG-WITH-REASON / OWNER-GATED / (IMPLEMENTED-NOT-VERIFIED, reused). See §4 for the proposed grammar.

**F-D2 — Every orchestrator ruling in the record follows the same shape: state the tension, name the conservative/reversible choice, cap the blast radius, and log it with an ID.** Six rulings on the record, D-W4-1 through D-W4-5 plus D-W5-1 (referenced in the session card but not detailed in the state file excerpt read), all in `ORCHESTRATOR-STATE.md`:
- **D-W4-1** (`:118-125`) — dropped a pipeline step because it was *provably* broken (squad steps can't see prior output, "code-verified in squad-persona-runner.service.ts"), not guessed; ratified an existing workaround; and scoped an amendment narrowly ("CDP operator MAY act the checkpoints for the ONE dry-run devotional... ≤US$3 total (D2), no publish").
- **D-W4-2** (`:149-153`) — when a subagent's claim ("brand playbook pre-existing/filled") turned out wrong and cost money, the ruling didn't paper over it: it marked the underlying data `brandless:true` ("honest — greenfield channel has no authored brand; inventing brand values tonight would be fabrication") and logged a program-level lesson ("verify subagent claims against the artifact before spending money on them").
- **D-W4-3** (`:160-162`) — a **strike rule**: "unless systemic, ONE plain retry; if step 1 fails a 3rd time, HOLD wave at honest state + backlog the root-cause, /exit-it." A bounded number of retries, named up front, with an explicit stop condition.
- **D-W4-4** (`:173-177`) — distinguishes a **non-strike** failure (infra rolled a pod mid-run, not the pipeline's fault) from a real failure, and turns the *type* of failure into a program-level backlog note ("`/deploy-router` doesn't track in-flight squad runs as a resource — deploys and live runs collide invisibly").
- **D-W4-5** (`:202-206`) — when two prior decisions (Wave 4's need vs an unrelated Aug-23 "make claude-cli the default backbone" change) tension against each other, the ruling is a **decision procedure**, not a one-off answer: "measure the actual backbone-connection documents... pre-committed rule: flag-only gap on the already-chosen connection = set it + one non-strike attempt; ambiguous/no-connection/type-excluded = HOLD honest, backlog, exit." This is a ruling that survives beyond the one instance because it's phrased as an if/then.

**What makes a ruling orchestrator-takeable vs must-escalate**, read across all five: the orchestrator rules on *how to execute a decision Fernando already made* (D1–D8 in GATE.md are pre-answered; the orchestrator is filling in the mechanics under uncertainty) and on *non-reversible-but-capped* operational choices (retry counts, non-strike classifications, conservative-path selections) — never on anything that spends real client-facing capital or crosses a stated boundary. The line is drawn explicitly at the morning queue: `ORCHESTRATOR-STATE.md:231-234` — "apps-box aivivum VOLUMES: does D11's 'clean up everything' override the prior deliberate 'shut down, don't destroy data' call? Irreversible data deletion — **your word, not ours**." That phrase — "your word, not ours" — is the literal escalation trigger: irreversible + ambiguous-scope + touches something the owner explicitly reserved elsewhere. Compare `:258-267` (D-W4-5 outcome) which is a **HIGH severity, blocks-everything** finding that still gets a recommendation with two options rather than a ruling, because it requires an architectural choice with cost trade-offs the orchestrator has no standing to make.

**Rule for GATE.md's standing section:** an item may be ruled by the run itself only if it is (a) already covered by an existing Answered/GATE decision and this is just applying it under a new circumstance, (b) capped in blast radius (a dollar limit, a retry count, a single named account), and (c) reversible or already-logged-irreversible-with-consent. Anything that is irreversible AND newly-discovered AND outside a named cap escalates verbatim, phrased as a question with options, never guessed. `GATE.md`'s own standing rule (praxya, line 32) states the twin of this for verification: "New genuinely-human decision discovered mid-run → append here + morning report; choose the reversible conservative path if one exists, else park that epic only." [VERIFIED-IN-CODE]

**F-D3 — Operational lessons, each with a named failure it fixes:**

| Lesson | Evidence | Fix pattern |
|---|---|---|
| Usage-limit wakeup chain | `ORCHESTRATOR-STATE.md:78-81` "ScheduleWakeup heartbeat ~25 min... if limited, keep rescheduling +30 min; resume from this file." | ≤3600s hops, chained, resuming from a durable state file — never parking on the human. Same pattern in `00-program-plan.md:47-50`. |
| Headless fallback when a terminal sticks | `ORCHESTRATOR-STATE.md:93-94` "Fallback if terminals stay unreachable >30 min: spawn detached headless sessions instead — `nohup claude -p "<kickoff>" --session-id <uuid> --model sonnet --permission-mode bypassPermissions > .../logs/wave-N.log 2>&1 &`" | Pre-generated session-ids so a headless session can still be addressed by name once it registers. |
| `claude -p --resume` poll correction | `ORCHESTRATOR-STATE.md:214-220` — a headless (`-p`, print-mode) session "died silently... 'waiting for the push-gate notification' — notifications never arrive in -p mode, process exited". Fixed by "RESUMED via `claude -p --resume 1e7425d2`... with explicit synchronous-operation correction: poll real state, never end turn waiting for notifications, exact-PID kills only." | Headless/print-mode sessions cannot receive async notifications — any protocol step that says "wait for X" is a silent-death trap in that mode; must poll instead. |
| Deploy-vs-squad-run collision | `ORCHESTRATOR-STATE.md:170-183` (D-W4-4) — a live squad run went "stuck 'running' forever" because `brain-api-core` "rolled to a new pod mid-step (someone's deploy)". Program-level gap logged: "`/deploy-router` doesn't track in-flight squad runs as a resource — deploys and live runs collide invisibly (tonight = the [REAL] instance)." | Named as a **generalizable gap**, not just a one-off bug: a deploy-coordination tool that only tracks other deploys, not long-running application work, has a blind spot. |
| Worktrees-only convention | `ORCHESTRATOR-STATE.md:243-246` "two live sessions were mid-edit on the SAME shared git checkouts Wave 5 needed to merge... Suggest a standing convention: worktrees-only for any session editing a repo another session might touch." **This was then explicitly ruled as a plan-it/build-it enhancement**: `docs/implementation/0-done/open-sessions-closeout/DECISIONS-pt2.md:23` "P2-11 Worktrees-only convention... ✅ RULED 2026-08-26: yes — as a plugin enhancement for plan-it/build-it via 1-backlog card... `1-backlog/2026-08-24/worktrees-only-convention-as-plan-it-build-it-plugin-enhancement.md`" | Direct precedent evidence that a topology feature (E4) should default multi-session builds to worktree isolation — this is not a stream inference, it's a standing owner ruling naming plan-it/build-it by name. |
| Idle ≠ delivered | `00-program-plan.md:40-41` "**Verify on disk, not on 'done'**: after any squad reports, check branches/commits/files exist (`git -C <repo> log`), run the epic's local gate... Idle ≠ delivered." | An orchestrator never advances a wave/epic to `deployed`/`VERIFIED` on a squad's self-report alone; it re-checks the artifact. |
| Reap at wave close | `00-program-plan.md:55-56` "**Reap** each squad session's agents when its wave closes; final `/conclude-it` writes the ledger card + CONCLUDE_REPORT." | Matches the global user rule already in this user's CLAUDE.md (reap finished subagents at end of a wave) — this is the *program-plan-level* codification of that rule, worth porting into the orchestrator-runbook template verbatim. |
| Morning report shape | `ORCHESTRATOR-STATE.md` final log entries + session card `2026-08-26--done-open-sessions-closeout-aug26-orchestrator.md:30-35` — "OVERNIGHT-RUN-REPORT.html (7 embedded wave reports)... reports = local HTML opened in Chrome, never a claude.ai artifact" and `CONCLUDE_REPORT.html`. | E2's exact standing rule already exists as a lesson from *this* precedent run — v4's E2 is formalizing something the field already converged on. |

**F-D4 — The "honest hold" wave (Wave 4) and what an honest per-wave state table looks like.** Wave 4's row in the wave-map table (`ORCHESTRATOR-STATE.md:20`) reads: "⏸ CONCLUDED-HELD 02:0x (honest hold, exit approved) — squad/personas/automation BUILT on fernando-ott; 3/3 faithful scripts; both checkpoint gates exercised for real; render NEVER entered: BLOCKED by fernando-ott Space backbone-resolution gap... Spend $0.696/$3.00. Rulings D-W4-1..5 on record". This single cell demonstrates the grammar an honest state table needs, in order: (1) a status glyph that is *not* success or failure but a third thing (⏸, "held") (2) what was actually built, stated positively (3) what was proven for real vs not entered (4) the exact blocker, named (5) spend against its cap (6) a pointer to every ruling that got it here. Compare the clean-success rows (Wave 5, `:21`, "✅ CONCLUDED... **60/64 VERIFIED**, 4 INV honest... T-E2-14 deliberate... deferred pending a global_delivery audit, backlog note filed") — same grammar, same six elements, different outcome. **This table-cell grammar (status glyph · what shipped · what's proven vs not · named blocker/exception · spend-vs-cap · ruling pointers) is the reusable unit**, not the specific wording.

### The praxya package ("Sprint 1 — Otimizar Ads")

**F-D5 — Sessions table shape.** `00-program-plan.md:8-16` (§1) is a 6-row table: `# | Session name | Role | Opens when`. Session names are exact strings meant for `/rename` and cross-session `SendMessage` addressing (confirmed in the launch prompts, which each start `/session-init then act as...` or reference the orchestrator by its literal registered name). Roles state repo lane + what artifact the session owns (e.g. "SQ-A · brain-api-core: `setting_definitions` + `entity_settings` + resolver + REST + agent tools + `settings.update` ActionType"). "Opens when" is either "First" / "With #1 (W1)" / "W2 (orchestrator signals)" — i.e. every session opens either immediately or on an explicit wave signal, never on a guess. [VERIFIED-IN-CODE]

**F-D6 — The six launch prompts, and what each MUST contain.** Read all six in `KICKOFF.md:38-137`. Every squad prompt (not the orchestrator's, which differs — see below) contains, in this order:
1. **Command + package path**: `/build-it SQ-A of Sprint 1 — Otimizar Ads.` then `Your package: docs/implementation/.../prds/prd-a-core-settings.md + epics/epics-a-core-settings.md (5 epics S1-A1..A5, 53 binding cases).`
2. **Law**: `Law: delivery/CONTRACT.md v1.0 (never edit — contradictions go to the orchestrator session "s1-ads-orchestrator" via SendMessage).`
3. **Lane / ownership of files**: `Lane: brain-api-core + brain-agent, branches epic/s1a-*.` — for SQ-D and SQ-C specifically the lane is negatively scoped too, to prevent file collisions between two squads touching the same app: `Lane: brain-app-meta-ads + radar's ingest.service.ts and database.ts DDL ONLY (SQ-C owns the rest of radar — do not touch it)` (`:90-91`) and the mirror on SQ-C, `:119-120`: "Lane: brain-app-radar EXCEPT ingest.service.ts + database.ts DDL (SQ-D owns those)".
4. **Branch pattern**: `epic/s1a-*`, `epic/s1d-*`, `epic/s1b-*`, `epic/s1c-*` — one namespaced prefix per squad.
5. **DoD**: `DoD per epic = 100% of its Test Contract.`
6. **Register-with-orchestrator handshake**: `Register with the orchestrator (SendMessage "s1-ads-orchestrator": "SQ-A ready") and start W1 on its signal.` — every squad registers before building and *waits for a signal* if its wave hasn't started (SQ-B and SQ-C explicitly "wait for its W2 signal").
7. **Gotchas**: one concrete trap per squad, e.g. SQ-A: "Gotcha: agent tools DUAL-register (factory.py AND mcp/server.py) or it's half-shipped." SQ-D: `[REAL] cases need a real seu-stillo/praxya ingest run` (an implicit gotcha about test-data availability). SQ-B: the exact dummy-ad protocol with the account ID and backoff timing pre-specified so no squad has to ask.

The **orchestrator's own prompt** (`:42-67`) is structurally different — it doesn't need law/lane/branch since it doesn't write code; instead it gets a 7-step numbered mandate (execute W0 itself, verify squads on disk, amend the contract on cross-cutting contradiction, run QA wave, usage-limit resilience, boundary enforcement, morning deliverable) plus an explicit `/read-chat` pointer to the planning session for full context on demand.

**F-D7 — GATE.md's three-part shape**, confirmed by direct read of `GATE.md:1-32`:
1. **Answered** (owner + date stamped) — a table `# | Decision / authorization | Answer`, 7 rows (G-1..G-7), mixing genuine architecture calls (G-6 "Design calls") with pure authorizations (G-3 "Overnight Meta writes", G-5 "Overnight deploys").
2. **Still human, but NOT blocking the run** — a table `# | Item | Owner | When`, 3 rows, explicitly things that need Fernando/Moretti's attention **later** but do not gate tonight's build (venda_event values beyond the pilot, a morning verification ritual, threshold tuning).
3. **Standing rules the orchestrator enforces** — a bulleted list of 3 always-on policies (usage-limit resilience, never-fake-a-green rule for `[REAL]` cases, the escalation procedure for a newly discovered decision).

The header line is the whole contract in one sentence: `GATE.md:3-6` — "Everything the overnight run needs from a human, answered UP FRONT so `/build-it` runs to conclusion without waking anyone. All items below are ANSWERED — the run is ungated." This is the artifact E3's "answered queue becomes GATE.md" ruling (per SHARED-CONTEXT.md) is describing — it already exists, fully formed, in the field.

**F-D8 — The "build-order corrections the squads flagged" mechanism.** `KICKOFF.md:26-29`: "SQ-C internal order: **C1 → C3 → C2 → C4 → C5** (rules need `setting()` via the client first)... S1-C4 additionally waits on S1-D1 landing + one real ingest; S1-C5 waits on S1-B1/B2." This is a correction *discovered during planning* (a squad, reading its own epics at plan time, found an internal ordering dependency the epic list didn't originally encode) and it gets promoted into the KICKOFF header as a standing instruction every session must respect — not buried in an epic file nobody re-reads. `00-program-plan.md:34-35` restates it as a dependency note in the waves table too, so it appears in two places a reader might look.

**F-D9 — STATUS.md as the run's chronicle.** `STATUS.md:1-27` is the epic table (Epic · Lane/session · Wave · State · Evidence — the Evidence column is always a specific measured fact: row counts, digest hashes, case IDs). `STATUS.md:28-58` (the "## Log") is a **reverse-chronological append-only log**, one bullet per event, each timestamped, each naming which squad/epic/finding it concerns. This log is where the real story lives — it captures things the table can't: a retracted finding ("R3 fires on 6' = 2 genuine + duplicates" corrected at `:45`), a live root-cause reframe (`:34`, "REFRAME (decisive): the 327-signal payload is 100% COMPOSITION... 'paused builtins firing' RETRACTED"), and a discrepancy in the final tally itself — the epic table row (`:26`) says "92/96 PASS" while the very next log line (`:31`) says "Final: 93 PASS · 1 FAIL-vs-bar (backlog) · 3 INV-by-design". **This 92-vs-93 mismatch is itself evidence for the hard constraint "counts computed, never typed"** — a live, real-world case of a tally drifting by one between two places in the same document because it was hand-typed twice.

**F-D10 — What the QA wave read**, from `00-program-plan.md:126-136` and `W4-QA-REPORT.md:1-10`: the QA session's prompt is `/full-qa` scoped to `CONTRACT.md §8` + `STATUS.md` + **every** `epics/*.md` Test Contract (158 cases total), run "against the DEPLOYED system", "unit+api suites in-repo, e2e-cdp via chrome-cdp-control on admin-praxya, [REAL] Meta cases via the dummy-ad protocol on act_993493246321401 only." `W4-QA-REPORT.md:1-4` shows QA is organized as one subagent per epic-letter ("qa-epic-a/b/c/d"), each producing a per-case PASS/FAIL/PARTIAL/IMPLEMENTED-NOT-VERIFIED table with evidence, and — critically — QA **re-runs a fix and keeps the original failure visible but collapsed**: `W4-QA-REPORT.md` shows a `<details><summary>Original FAIL evidence (pre-fix, superseded — kept for the record)</summary>` block around the B2-12 bug, with the corrected PASS verdict stated plainly above it. This is the same "never delete a superseded finding, mark it superseded and keep it visible" instinct found independently in SEED-DECISIONS-v2 (F-D14 below) — two different sessions, two months apart, converging on the same practice.

**F-D11 — What the s1 orchestrator card says went wrong or was found incidentally**, from `.agents/history/claudinho/2026-08-27--s1-ads-orchestrator.md:17-25`:
- **QA tally discrepancy at the final count**: the card states "93/96 PASS · 1 FAIL-vs-bar (84.3% parent-id, backlog) · 3 INV-by-G-3-design" — this is the *session-card's* number, and it matches STATUS.md's log-line 93, not the STATUS.md table's 92. Neither document is internally reconciled against the other; a reader has to know to trust the log over the table. **This is a second, independent instance of the same computed-vs-typed count problem as F-D9**, this time cross-document rather than same-document.
- **The fleet Meta outage** was found *incidentally* while executing an unrelated sprint: "🔴 INCIDENTAL: fleet Meta data frozen since 08-05 (dead Nango token + nangoProviderKey renamed off -8f) — FIXED, all 12 orgs re-ingested. fernando-ott tenant not audited." The STATUS.md log (`:56`) shows this was caught only because a build blocker forced someone to look at connector health — nothing in the plan or contract anticipated it.
- **7 real prod bugs found+fixed+re-verified in-run** during what was scoped as a feature build, not a bug hunt.

**What a v4 SESSIONS/GATE template should add because of this:** (a) a **single computed-tally rule** — any document showing a pass/fail count for the same Test Contract must derive it from the same source (ideally a script reading the contract + evidence files), never re-typed in two places; this is exactly the existing "Counts computed, never typed" hard constraint, and F-D9/F-D11 are field evidence for *why* it's a hard constraint, not a nice-to-have. (b) GATE.md / SESSIONS.md should carry an explicit **"incidental finding" channel** distinct from the Test Contract — a place a squad or QA session logs "found this while doing something else, not asked for, real" without it being mistaken for scope creep or silently dropped, because F-D11's fleet outage and F-D2's brain-agent-log-blind-spot finding (`ORCHESTRATOR-STATE.md:163-165`) both show this happens routinely and both times it mattered.

### Triage + measurement (E6) — `SEED-TRIAGE-2026-09-04.html`

**F-D12 — Four verdict kinds, each with a distinct exit artifact**, read directly from the page's own summary tiles and per-seed "Verdict" paragraphs (`seed-triage.txt:14-29`, and per-section verdicts at `:108,152-154,200-202,242-244,282-284,324-326`):

| Verdict | Count this run | Exit artifact | Example |
|---|---|---|---|
| **Plan now** | 3 | A normal /plan-it run, state file `.plan-it/<name>.state.json`, feeds a batched G1 | hermes-studio-layer ("as the anchor package of this cycle"), agent-proposes-skill, self-serve-first-run |
| **Build instead** | 2 | Archive the SEED folder "as absorbed by" an already-frozen package, hand straight to `/build-it` from its existing launch prompt — explicitly "Do not plan these again" | initiative-aware-send-tiering + governed-send-approval-rail-hardening → absorbed by `governed-send-tiering-and-rail` (CONTRACT v1.1 frozen) |
| **Owner decision** | 1 | "Not a plan-it run. A one-page decision memo with the corrected facts and the retention options goes in [the consuming package]'s G2 gate." Not a plan, not a build — a memo consumed by another package's gate. | interactions-group-message-bodies (premise was false; decision reduces from L to S once corrected) |
| **Skip, with backlog card** | 1 | "Do not run plan-it on this. Keep the... queries... as a script..., re-run... weekly... file one backlog card... Promote to a program only if a re-run ever returns a non-zero count. The seed folder moves to 0-done with this measurement as its close-out." | org-attribution-reconciliation (measured zero drift) |

**F-D13 — Three measurements moved three verdicts, and each is reported with the same four-part shape.** Quoting the page's own framing (`seed-triage.txt:30`): "Three read-only measurements ran on the live tenants after the first draft of this page. They moved three verdicts: group bodies are stored after all, org-attribution drift is zero today, and the N5 cost model is settled by data." Extracting the grammar from each instance:
- **Group-body measurement** (`:300-310`): value = "88% [of 6,299 live-webhook rows] / 94.8% [of 440 backfill rows] carry a body"; where read = "message rows, split by ingestion source" on "fernando-ott"; when = "today" (run date, stated once at page header: 2026-09-04); read-only = implicit (a `SELECT`-shaped sweep, no write path mentioned); moved which verdict = flipped the seed's central claim from "not persisted" to **premise false**, shrinking the decision from L (store-vs-wall) to S (retention posture for data already stored).
- **Org-attribution drift measurement** (`:222-226`): value = "zero drift" on "8,408" (fernando-ott) and "45,147" (praxya) interactions; where = "org resolver... vs stored organization_id"; when = "today"; read-only = explicit ("It never writes" — but flagged with a caveat, see below); moved which verdict = Plan → Skip.
- **N5 cost measurement** (`:132`): value = "83 triggered runs, 55 passed the reflection gates... roughly 50 to 80 tokens per run"; where = "fernando-ott (last 14 days)"; when = "last 14 days" as of run date; read-only = it's a cost/volume measurement not a mutation check; moved which verdict = settled "decision #1" ("fold in" vs a second call) by data rather than leaving it open.

**Read-only caveat worth carrying into the grammar**: the org-attribution page is honest that the *measurement itself* may not be side-effect-free — `:224`: "The sweep is not free either. The resolver's `resolve()` unconditionally memoizes aliases and registers integration bindings on every call... A 'read-only oracle' needs a read-only variant of the resolver, or accepts idempotent writes." **A measurement block's "read-only" field must be able to say "yes, verified" vs "assumed, not verified" vs "no, idempotent-writes-accepted"** — this triage page itself demonstrates all three states are real possibilities, not merely a formality.

**Measurement block grammar (proposed, distilled from the above):**
```
Measured: <value> · where: <exact source(s), org/tenant named> · when: <date or window> ·
read-only: yes-verified | assumed | idempotent-writes-accepted · moved: <verdict before> → <verdict after>
```

**F-D14 — "Stale fact" and "Premise false" badges are two different things, used precisely.** `seed-triage.txt:41,198,322` show the badges inline, each followed by one sentence naming exactly what's wrong:
- **Stale fact** (self-serve-first-run, `:198`): "The seed's effort estimate and decision #2 both assume byo-subscription is unbuilt. It is built and verified." — the claim *was true when written*, reality moved on.
- **Premise false** (interactions-group-message-bodies, `:322`): "The seed's central claim did not survive measurement. Whether it was true for the rows the 08-31 drain inspected is not reconstructible; the connector block that writes bodies predates that date." — the claim was never (verifiably) true, or its truth cannot even be reconstructed retroactively.

The distinction matters for what happens next: a **stale fact** just needs its number corrected before sizing (self-serve-first-run stays a Plan, just re-sized). A **premise false** finding can flip the *verdict itself* (group-bodies moved from "Decide: store vs wall" to "Decide: retention posture," a smaller decision) or, in the org-attribution case, retire the whole seed.

**F-D15 — "Plan-it must decide" lists are per-seed, plan-time-scoped, and distinct from GATE.md.** Every Plan-verdict seed section ends with a bulleted "Plan-it must decide" list (e.g. hermes-studio's 5 items at `:88-100`, agent-proposes-skill's 4 at `:136-146`) — these are decisions the *coming plan-it run's G1/G2 gates* must surface, not decisions the eventual build needs pre-answered (that's GATE.md's job, and it doesn't exist yet at triage time — there's no build yet to gate).

**F-D16 — "Proposed planning lineup" batches all runs behind one gate, and names their cross-dependencies.** `seed-triage.txt:328-356`: three separate `/plan-it` runs (A/B/C) are named individually, each keeps "its own state file under `.plan-it/<name>.state.json`", but the closing lines are explicit that they present as **one decision moment**: "Every run pauses at its own G1 and G2. Three runs means three batched decision gates; expect them presented together so you answer once." This is E7's "one batched questionnaire" ruling (D1, autonomous-draft default) applied one level up — not just batching questions *within* a run, but batching *across* multiple concurrently-triaged runs.

### Decision queue (E3)

**F-D17 — Ruled-table columns, confirmed identical across two independent copies of the artifact** (Devotts-local `DECISIONS-bkp-case.html` and the Engine-Core original, plus the final-round `DECISIONS.md`): **ID · Ruling · Effect**. `decisions-bkp.txt:13` header row, and the final ledger `DECISIONS.md:9` header: "`| ID | Ruling (Fernando, 2026-08-25) | Effect / where it executes |`". Every ruling row states the decision AND its concrete consequence in the same cell (e.g. `DECISIONS.md:16`: "✅ APPROVED, hard cap **US$3 per entire video process** | Wave 1 V3 (`budget_usd ≤ 3`)"). A ruling with no stated effect would be untraceable to what it unblocks — every row in both the bkp and final versions has one.

**F-D18 — Open-card anatomy**, read directly from `decisions-bkp.txt:41-138` (D4, D8, D9, D10, D12, D13 cards):
1. **Question** — a one-line title framed as the actual choice ("Squad-run identity: A or B open").
2. **File** — a pointer to the backing note, e.g. `docs/implementation/open-sessions-closeout/backlog/squad-run-identity-needs-fernandos-a-or-b.md`.
3. **The situation in plain language** — what's broken and why it's ambiguous (2-4 sentences, no jargon dump).
4. **"Why nobody should pick for you"** — a named paragraph, always present, e.g. D4 (`:55-58`): "Why nobody should pick for you: widening identity is the wrong reflex for squads that can pause/activate real ads; B quietly makes one person accountable for everything in the audit trail." This is the load-bearing anti-pattern-prevention sentence — it exists specifically so a future agent (or a rushed human) doesn't just pick the cheap option without understanding the hidden cost.
5. **Options, cheapest first** — explicitly ordered, e.g. D8 (`:70-72`): "Options, cheapest first: (1) distinguishing title on the meta card... (2) meta card links to its content card; (3) suppress the meta card..."
6. **Recommendation** — always stated, always justified with effort (e.g. "Recommended: 1+2 together (S effort)").
7. **"Read more" with source note embedded** — every card has a `Read more` disclosure that renders the underlying backlog note or PRD excerpt *inline* rather than making the reader open another file (`decisions-bkp.txt:53-60,74-76,88-94,109-111,123-125,138-140` — each followed by "Source note (rendered):"). D9's embedded source (`:90-93`) even quotes the exact sentence from the frozen PRD that the recommendation contradicts, with the disproving fact stated right next to it: "From the frozen PRD: 'Wave 2 is data only...' The original premise... was disproven by live grounding on 2026-08-14 — all tenants already served /home and /equipe at HTTP 200; only the data differs."
8. **Related same-family call** — D4 (`:51`): "Related same-family call: D-B4 (is publish still refused for autonomous squads?) — cheapest answered together." Cards that share a root cause point at each other so the human doesn't rule them inconsistently one at a time.

**F-D19 — The wave-gates-after-round table**, `decisions-bkp.txt:142-158` and its final-round counterpart `DECISIONS.md:32-40`: a small `Wave | Status` table that recomputes, after every ruling round, exactly which downstream units are now unblocked ("✅ GO"), still scope-reduced, or still pending. The final round's version is terser because it's the terminal state: "**Nothing is waiting on Fernando anymore.**" This is the mechanism that lets a human ruling on 6 items instantly see the blast radius across 7 waves without re-reading every wave file.

**Classification of every item into decision / authorization / owner-action**, from `DECISIONS.md` (final) and `DECISIONS-pt2.md` (round 2):

| Item | Classification | Deadline stated? |
|---|---|---|
| A1 (Video Forge keys entered) | authorization (a prerequisite state, already satisfied) | no |
| A2 (quick-wins bundle) | decision | no |
| A3 (audio-transcription parked) | decision (scope) | no |
| D1 (roll api-core to praxya) | authorization | no |
| D2 (US$3 hard cap) | authorization (spend cap) | no |
| D3 (scope overrun sign-off + default) | authorization | no |
| D4 (squad-run identity A/B — open in round 1, ruled+executed by round 2) | decision (architecture) | no, but flagged HIGH/blocking-every-app once diagnosed |
| D5 (praxya brain-agent rides deploy) | authorization | no |
| D6 (simplified mode default) | decision | no |
| D7 (31-day auto-expire) | decision | no |
| D8 (two approval surfaces) | decision (UX) | no |
| D9 (Mission Control P8 fleet data) | decision (scope/fold-in) | no |
| D10 (old Hetzner box retirement) | **owner-action** ("your word, not ours" language used elsewhere for this class; requires Fernando's own console clicks — "you do the two console actions (delete records, cancel the VPS)") | no |
| D11 (aivivum teardown) | authorization | no |
| D12 (8ftools headless permissions) | decision (policy) | no |
| D13 (.value vs .defaultValue normalization) | decision (technical) | no |
| D14 (JWT re-mint) | authorization | no |
| D15 (hermes parked) | decision (scope) | no |
| P2-1..P2-11 (round-2 queue, `DECISIONS-pt2.md:13-23`) | mix: P2-1/P2-2/P2-4/P2-5/P2-7 = decision; P2-3/P2-9/P2-10 = authorization; P2-8 = owner-action (verify+archive is Fernando-adjacent but delegated) | `chemott-agent-jwt-expires-2026-11-22.md` (owner-action, "Not decisions — staying open by design") carries the **only explicit deadline** found in either document: "time-fused reminder (renewed; next action ~2026-11-24)." |

**Gap this surfaces for E3's schema**: across two full decision queues (round 1 + round 2, ~29 ruled items + 6 open cards), only **one item ever carries an explicit deadline**, and it's a pure calendar fact (a JWT expiry), not a planning deadline. Neither GATE.md nor DECISIONS.md has a deadline *column* — it's prose, buried, when it exists at all. If E3 wants deadline-awareness it has to add the column; the field precedent doesn't demonstrate one, it demonstrates the gap.

**F-D20 — Rulings carried forward between report versions, and a corrected/fabricated finding flagged in place.** From the sampled `SEED-DECISIONS-v2.html` top matter (`seed-decisions-v2.txt:1-30`, "What changed since v1" and "Your rulings"):
- **Carry-forward table** is literally titled "Your rulings" with columns `Item | Your call | State` (`:19-27`) — e.g. "PII / retention posture | (a) keep storing + declare | drafted, 4 sign-off markers still open" and "N5 threshold | approved | recorded + v2 below." Every ruling from the prior round is restated with its *current state*, not just repeated verbatim — the "State" column is where drift or progress since v1 gets tracked.
- **"What changed since v1"** (`:8-17`) is a short bulleted list that does three things in four bullets: confirms the human was right about something ("You were right about S1"), reports a package as fully closed since v1 ("governed-send is CLOSED, 35/35, archived... nothing there is owed by you"), reports a hole *found because the human asked a question* ("Your discoverability question found a real hole in N5, verified in code"), and flags the fabricated finding (next point).
- **Fabricated finding, flagged in place, twice** — at the top-matter summary (`:17`: "One agent fabricated a finding. It is corrected in place and flagged where it appears, because you should know which numbers were re-verified and which were not.") and again at its actual location deep in the document (`:1421`: "⚠ One claim in this fragment was fabricated by the agent that wrote it (a 'shadow admission mode' failure affecting 20 runs, with a quoted string that appears 0 times in 77 transcripts). It is corrected in place. The 14 verified successes and the 39 admission-400s were independently re-measured and hold."). **The correction states exactly which numbers survived independent re-verification and which didn't** — it doesn't just delete the bad claim, it tells the reader what to trust and what not to.
- **"The generalization pattern you spotted"** (`:19-25`): a 3-row table (`Layer | Mechanism | What stayed specific`) that names a *repeated* failure shape found across three unrelated subsystems (dispatch, vocabulary, UI) — each row: the seam that *is* generic, and the specific thing hardcoded inside it anyway (e.g. "Dispatch | `capabilities.communicator` is a real declared seam | hardcoded in 3 files — a slug list, a switch, and 3 WhatsApp facts"). The closing line predicts a fourth instance from the pattern rather than treating each as isolated: this is a report *learning from its own findings*, not just listing them.

### Show-don't-describe (E5)

**F-D21 — Catalogue of concrete devices**, drawn from `anatomia-de-uma-decisao.html` (fully read) and the sampled `SEED-DECISIONS-v2.html`:

1. **Mockup built from real, field-by-field measured rows**, with the field's provenance stated inline. `anatomia.txt:12-20`: a JSON-shaped dump of a real card's actual fields ("squad_name = ...", "question = null", "run_id = ..."), timestamped against when the reader's own screenshot was taken ("42 minutos antes do seu print"). `seed-decisions-v2.txt:365-368`: each memory row in the mockup carries its provenance chip inline — "`nesta sala · derivado · org · 08-31 10:14 · conf 1.0`" — value, scope, timestamp, and confidence, all visible on the mock row itself, not in a caption.
2. **Honesty note that the read was bounded / measured not estimated.** Closest field precedent to the brief's "only the first 220 characters were read" example: `anatomia.txt:191-193` — "Todos os números aqui foram medidos no Mongo da praxya em 20/08/2026, não estimados." (translated: "Every number here was measured in praxya's Mongo on 2026-08-20, not estimated.") [INFERRED: the exact "220 characters" framing was not found verbatim in the sampled sources; the pattern it exemplifies — stating precisely how much of a source was actually read, or precisely when/where a number was measured — recurs throughout, e.g. `seed-decisions-v2.txt` header: "every number measured read-only on fernando-ott, praxya untouched."]
3. **Three honest states, explicitly enumerated and each rendered as its own mini-mockup**: `anatomia.txt:107-152` — state A/"good" (the bosslife card, real content, an Approve button that means something), state B/"nothing run yet" (a first-checkpoint card, "Nada foi executado ainda... você está autorizando a squad a começar, não revisando um resultado"), state C/"misconfigured — the user's own screenshot" (`question: null`, **no Approve button drawn at all** — "O estado C não oferece 'Aprovar'... vira um problema de configuração — com o caminho para consertar" i.e. it renders "Open the squad and fix it" / "Discard" instead). `seed-decisions-v2.txt:356-380` repeats the same three-way pattern for a different surface ("A pane, in its three honest states": good/room-with-144-derivable-memories, legitimately-empty/"Nada aprendido nesta sala... Isto é um facto", misconfigured/"scope_id holds an ObjectId... must show '2 memórias com scope_id inválido' rather than 0").
4. **The removed affordance, stated as a design rule, not an accident.** `anatomia.txt:150`: "Um botão de aprovar sobre uma pergunta que não existe convida exatamente o erro que você quase cometeu: decidir sem saber o quê." (a Approve button over a non-existent question invites exactly the mistake almost made). `seed-decisions-v2.txt:378`: "No 'generate insights' button is drawn: an affordance that promises the brain read the meeting when it did not is the mistake [the prior design] made with the approve button." Same rule, applied twice, to two different surfaces, independently — this is the [[practice memory in this user's global CLAUDE.md]] about "honesty constrains the interface — sometimes by removing affordances" showing up verbatim in the artifacts, not just the memory file.
5. **Mermaid flow of a mechanism**, using real function/seam names, not generic boxes: `seed-decisions-v2.txt:1436-1444` — a `flowchart TD` whose nodes are literally `reflect_and_capture()`, `flat_facts[]`, `typed_candidates[]`, the real field name `skill_candidate`, annotated "ONE LLM call · openai/gpt-4o-mini · the EXISTING seam N3 shipped".
6. **Before/after on a real object**: `anatomia.txt:60-105` — the actual bosslife delivery card as currently rendered ("◀ hoje") next to the same data re-rendered answering the five questions (below), with the exact hidden fact named ("O veredito da etapa 7 está no banco desde 2 de agosto — 1.879 caracteres a uma etapa de distância, escondidos porque a regra atual só olha um passo para trás").
7. **Projected volume, loose vs strict**: `seed-decisions-v2.txt` N5 section (sampled, `:1421` context) reports "55 of 83 runs qualified in 14 days" as the *measured* volume under the shipped detector, explicitly contrasted against what a looser LLM-judges-every-run detector would produce ("Ask the LLM to judge every qualifying run in isolation and Mission Control fills with one-off 'skills' nobody wants" — [MEASURED value for the strict path, INFERRED/qualitative for the loose path since no loose-path count was measured, only warned about]).
8. **"The five questions a card must answer"**, `anatomia.txt:43-56`, in this order, translated: *Who is asking* (the squad and client, not a slug) · *What exactly do they want* (the checkpoint's actual question, "sem inventar frase quando não existe uma" — without inventing a sentence when none exists) · *Where is this in the work* (step X of Y, named, plus what already ran) · *What's the basis for deciding* (the squad's last real output, or the honest admission there isn't one yet) · *What happens if I approve* (stated differently at step 1 vs the last step — "hoje é uma frase fixa" i.e. today it's a fixed sentence, which is the bug). Plus a sixth, non-card affordance: "everything else [is] one click away — the 'Ver contexto' button opening the whole run in a drawer."

## 2. What v3 has that v4 builds on (reuse map)

| v3 artifact / function | Location | v4 reuse |
|---|---|---|
| Decision-log grammar `[DECIDED]/[CHANGED]/[CONFIRM: owner]` | `plugins/plan-it/skills/plan-it/references/formats.md:8-27` (§1) | Reusable as the tag vocabulary inside GATE.md's "Answered" rows and DECISIONS.md's ruled table — praxya's `✅/⏸` glyphs (F-D7, F-D17) are a compatible but less structured variant; v4 should reconcile them onto formats.md's existing tags rather than inventing a third vocabulary. |
| Open-questions-as-blocking-table | `formats.md:29-35` (§2), columns `# / Question / Owner / Blocks` | Direct ancestor of GATE.md's "Still human, but NOT blocking" table (F-D7) and of the open-card anatomy's "Blocks/Unblocks" effect column (F-D17, F-D18) — v4 extends the existing 4-column shape with the field precedent's extra elements (why-nobody-should-pick-for-you, options-cheapest-first, read-more). |
| Governance/invariant block (`G-` / `CB-` IDs, each mapped to ≥1 test) | `formats.md:37-46` (§3) | The GATE.md/DECISIONS.md ID scheme (G-1..G-7, D1..D15, P2-1..P2-11 in the field precedents) is the same ID-per-decision discipline already required for governance clauses — v4 should use one consistent ID namespace convention across CONTRACT governance IDs and GATE/DECISIONS IDs so they're groppable, not accidentally colliding. |
| `KICKOFF.md` template, §5 "Locked decisions (each with rationale)" | `templates.md:148-166` | Already carries a **single** launch-prompt slot and a locked-decisions section; F-D6/F-D7 show the field precedent split this into a **separate GATE.md** (decisions+authorizations, three-part) plus a **separate SESSIONS.md with N launch prompts** (one per session, each with the 6 required elements) — v4's E3/E4 additions are genuinely new files, not edits to KICKOFF's existing shape, which per SHARED-CONTEXT.md "STAYS" with its one launch prompt. |
| `STATUS.md` template — legend + epic table | `templates.md:168-172` | Matches praxya's STATUS.md table shape almost exactly (Epic/Lane/Wave/State/Evidence vs template's EID/Epic/Squad/Wave/Status/Tests/Branch) — v4 should add the **Log** section (F-D9) to the template explicitly, since it's currently undocumented in templates.md but is where the real narrative and the corrected/retracted findings live in every field precedent read. |
| Closed status vocabulary (NOT-STARTED / IN-PROGRESS / IMPLEMENTED-NOT-VERIFIED / VERIFIED), enforced | `scripts/gate-check.mjs:843,856` (`VOCAB` set, "outside the 4-term vocabulary" failure) | This is the base vocabulary E8's disposition set must be **additive** to (hard constraint 1) — see §4 for the proposed additive set. |
| `[REAL]` case semantics (never green on a mock) | Referenced throughout formats.md's Test Contract section (`:49-76`) and confirmed live in every field precedent (`GATE.md:31`, `00-program-plan.md:63`, `W4-QA-REPORT.md` per-case verdicts) | Directly reusable — the field precedents show this rule holding under real pressure (QA correctly downgrades to IMPLEMENTED-NOT-VERIFIED / PARTIAL rather than fake-passing, repeatedly). No change needed; E8's disposition set must preserve it verbatim ("contract cases never move to backlog"). |

## 3. Gaps v4 must close (→ E1–E10)

1. **No GATE.md concept exists in v3 at all.** KICKOFF's "Locked decisions" section (`templates.md:159`) is prose, not a three-part answered/still-human/standing-rules structure, and has no authorization-vs-decision-vs-owner-action typing. → **E3**.
2. **No multi-session SESSIONS.md exists in v3.** KICKOFF.md's template has exactly one launch-prompt slot; there is no schema for N session names/roles/opens-when/per-session-prompt, and no orchestrator runbook template at all (00-program-plan.md's §3 6-step runbook is bespoke prose per program, not a reusable template section). → **E4**.
3. **No orchestrator ruling-classification rule is codified anywhere in v3.** "Which decisions can the orchestrator take vs must escalate" exists only as tacit practice across two field precedents (F-D2); v3 has no equivalent standing-rule text for this. → **E4** (belongs in the orchestrator runbook / GATE standing rules).
4. **No triage gate exists before planning starts.** v3's Phase 0 (`SKILL.md` intake, per SHARED-CONTEXT anchors L203) has no verdict-kind classification (Plan/Build-instead/Owner-decision/Skip), no measurement-block grammar, and no stale-fact/premise-false badge convention. → **E6**.
5. **No residual-disposition vocabulary at close.** v3's 4-term status vocabulary has nothing for "this remains open at close, and here is why that's OK" — praxya's STATUS legend and open-sessions-closeout's REMAINING.md both improvise this per-run rather than following a template. → **E8**.
6. **No show-don't-describe requirement anywhere in v3's authoring rules.** Nothing in templates.md/formats.md requires a mockup for a UI-shaped decision, a mermaid diagram for a flow-shaped one, or an honest-states enumeration for a rendered surface — the closest is the general Test Contract "UI (Chrome CDP)" column, which proves a UI *works*, not that a *decision about* a UI is legible before it's built. → **E5**.
7. **No rulings-carried-forward mechanism across report versions.** v3 has no concept of "v2 of a decisions report" — CONTRACT.md's own decision-log tags (`[DECIDED]/[CHANGED]`) partially cover amendment-tracking within one contract, but nothing covers a whole *report* being re-issued with a "what changed since v1" + a carried-forward rulings table + in-place-flagged corrections. → **E3**.
8. **No deadline field on any decision/authorization structure.** Confirmed absent in both field-precedent decision queues (F-D19) as well as in v3's own blocking-table (`formats.md:29-35`, columns are `#/Question/Owner/Blocks`, no `When`). → **E3** (design decision for synthesis: add optional `Deadline` column, default "none").
9. **No worktrees-only default for multi-session topology**, despite this being an explicit standing owner ruling naming plan-it/build-it (F-D3, P2-11). → **E4**.
10. **No incidental-finding channel** distinct from the binding Test Contract, despite two independent field precedents (F-D2's brain-agent log gap, F-D11's fleet Meta outage) surfacing real, unplanned findings mid-run that mattered. → **E4/E8** boundary (orchestrator runbook + STATUS log format).

## 4. Design proposal for this concern

### GATE.md schema (E3)

```
# GATE.md — <run/program name> autonomy contract

> Everything the run needs from a human, answered up front so the build runs
> unattended. Anything new discovered mid-run is appended here, not guessed.

## Answered (owner: <name> · <date>)
| # | Type | Decision / authorization | Answer | Deadline |
|---|------|---------------------------|--------|----------|
| G-1 | decision | ... | ... | none |
| G-3 | authorization | ... | ... | none |

## Still human, but NOT blocking the run
| # | Item | Owner | When |
|---|------|-------|------|

## Standing rules the orchestrator enforces
- A usage/session limit never parks the run: persist state → scheduled-wakeup
  chain → resume after reset.
- [REAL] test unreachable → IMPLEMENTED-NOT-VERIFIED with reason — never a
  fake green, never waking the owner for it.
- New genuinely-human decision discovered mid-run → append here + morning
  report; conservative reversible path if one exists, else park that epic only.
- <domain-specific boundary, e.g. "writes to a live third-party account only
  on self-created dummy objects">
```

`Type` is the classification from F-D19: `decision` (a choice among designs) / `authorization` (a permission grant, already-decided-elsewhere, just needs a yes) / `owner-action` (delegable to nobody — only the named owner's hands/credentials can do it; these should be flagged to also appear in a "morning queue"/owner-actions list at close, per `DECISIONS-pt2.md:25-32`'s "Owner actions (no deliberation — just you)" section, which is a distinct list from the ruled table). `Deadline` defaults to `none`; when present it should read as a date, and any item with a stated deadline auto-surfaces in the run's close-out report regardless of disposition (this is new — the field precedent shows exactly one deadline ever recorded and it wasn't specially surfaced, which is itself the gap).

**Escalation rule (from F-D2), to live in GATE.md's standing rules verbatim as a decision procedure**: an item may be ruled by the running session itself only if (a) it applies an *existing* Answered item to a new circumstance, (b) its blast radius is capped (a dollar limit / retry count / named single account / single epic), and (c) it is reversible, or irreversible-but-already-consented via an existing Answered item. Otherwise: escalate as a question with cheapest-first options, never guess. Anything touching data destruction, scope the owner previously reserved elsewhere, or an unnamed spend ceiling escalates unconditionally ("your word, not ours").

### SESSIONS.md schema (E4)

```
# SESSIONS.md — <run name> topology

| # | Session name | Role | Opens when |
|---|--------------|------|------------|
| 1 | <orchestrator-name> | Conductor: dispatch, verify-on-disk, merge, deploy, reap | First |
| 2 | <squad-name> | <lane, one line> | With #1 (W1) |

## Launch prompts

### N · `<session-name>` (open <when>)
```
<the single copy-paste block, containing, in this order:>
1. Command + package path (e.g. `/build-it <squad-id> of <program>. Your
   package: <prd path> + <epics path> (<N epics>, <M binding cases>).`)
2. Law: `<CONTRACT path> v<version> (never edit — contradictions go to
   <orchestrator-name> via SendMessage).`
3. Lane: `<repos/files this session owns>` — negatively scoped where two
   squads share a repo (`EXCEPT <files> (<other squad> owns those)`).
4. Branch pattern: `epic/<prefix>-*`
5. DoD: `100% of its Test Contract` (or named exception).
6. Register-with-orchestrator handshake: `SendMessage "<orchestrator-name>":
   "<squad> ready" and wait for its wave signal` (omit "wait" if opens=First).
7. Gotchas: <one concrete, specific trap — never generic advice>.
```

## Orchestrator runbook (standing template, per-run values filled in)
1. Dispatch: send each due session its wave-start signal; record in STATUS.md.
2. Verify on disk, not on "done": re-check branches/commits/files and the
   epic's local gate exist before advancing STATUS. Idle ≠ delivered.
3. Merge + deploy per lane, one batched rollout per lane where possible.
4. Usage-limit resilience: scheduled-wakeup chain, ≤3600s hops, resume from
   this file + STATUS.md. Never park waiting on the owner.
5. <domain external-side-effect boundary, if any — dummy-objects-only, a
   named account, a spend cap>.
6. Worktrees-only for any session editing a repo another session might touch
   (P2-11 standing convention).
7. Reap each session's subagents when its wave closes; final /conclude-it
   (or equivalent) writes the ledger card + report.
8. Incidental-finding channel: anything found but not asked for goes in
   STATUS.md's Log with its own bullet, tagged `[incidental]` — never folded
   silently into the Test Contract tally, never dropped.
```

Failure states + recovery, named because both were observed live in the field precedents: (a) a session opened in a fresh terminal is not `SendMessage`-reachable until it processes a first turn — the orchestrator must have Fernando paste a "registered, standing by" bootstrap line, or fall back to a headless `claude -p` session with a pre-generated session-id if the terminal stays unreachable >30 min (F-D3); (b) a headless/print-mode (`-p`) session must never be told to "wait for a notification" — it will end its turn and die silently; any protocol step in a launch prompt that says "wait for X" must instead say "poll for X" when the session might run headless.

### DECISIONS.md / .html schema (E3)

```
## Ruled / done
| ID | Ruling | Effect / where it executes |

## Open — read & answer when ready
### <ID> <one-line question>
File: <backing note path>
<2-4 sentence plain-language situation>
Why nobody should pick for you: <the hidden cost of the cheap/wrong default>
Options, cheapest first: (1) ... (2) ... (3) ...
Recommended: <option> (<effort size>)
Related same-family call: <other ID>, if any
Read more ▸ <embedded rendering of the source note, not a bare link>

## Wave/epic gates after this round
| Wave/epic | Status |
```

**v2-of-a-report addition (E3, from F-D20):**
```
## What changed since v1
- <2-5 bullets: a claim confirmed, a package closed, a new hole a question
  surfaced, and any fabricated/corrected finding flagged up front here too>

## Your rulings (carried forward)
| Item | Your call | State |

## The pattern you spotted (if a repeated failure shape emerges across
## ≥3 unrelated findings — name it, don't just list the instances)
| Layer/instance | Mechanism (the generic seam) | What stayed specific (the hardcode) |
```
Any corrected/fabricated finding gets an inline `⚠` banner at both the top-matter summary AND its exact location in the body, stating which numbers were independently re-verified and which were retracted — never a silent delete (F-D20).

### Triage gate + measurement grammar (E6)

Verdict kinds and exit artifacts, as a closed set:

| Verdict | Exit artifact |
|---|---|
| Plan now | Normal `/plan-it` run, own state file, feeds a batched G1 alongside any other same-round Plan verdicts |
| Build instead | Archive the seed "absorbed by `<package>`", pointer note, hand to `/build-it` directly — never re-planned |
| Owner decision | One-page decision memo (not a plan-it run), consumed at the *target* package's own G2 gate |
| Skip, with backlog card | One backlog card + seed folder archived with the measurement as its close-out note |

Measurement block: `Measured: <value> · where: <source, tenant named> · when: <date/window> · read-only: yes-verified\|assumed\|idempotent-writes-accepted · moved: <verdict before>→<verdict after>`.

Badges: `Stale fact` (claim was true when written, overtaken since) vs `Premise false` (claim never verifiably true) — both followed by the corrected number and its source, both attached inline at the exact paragraph making the claim.

### Residual disposition vocabulary (E8)

Additive to the existing closed 4-term status vocabulary (hard constraint: no rename/removal):

- `BACKLOG-WITH-REASON` — moved to the ordinary weekly/project backlog with one line of why and which future consumer picks it up.
- `OWNER-GATED` — blocked purely on the named owner's own action/credentials; appears both in the disposition table AND in a separate "owner actions" list at close (they are not delegable, so they should not blend into a ruled-decisions table).
- `IMPLEMENTED-NOT-VERIFIED` — reused verbatim from the existing vocabulary, never invented anew; **contract cases never move to `BACKLOG-WITH-REASON`** — a binding Test Contract case that fails or can't run stays `IMPLEMENTED-NOT-VERIFIED` with a reason, permanently attached to that case, until re-verified. Backlog is only for work discovered *beyond* the original case set.

Board/epic/program close criterion: archives only when every remaining row's disposition is one of the three above with a named owner where applicable — never while a binding case sits unresolved as anything else.

## 5. Test-contract seeds (≥8)

1. Given a fresh GATE.md, when every row in "Answered" is checked, then each has a non-empty `Type` value from {decision, authorization, owner-action} — a lint failure otherwise. How to run: static check over GATE.md's table.
2. Given a GATE.md, when an item's `Type` is `owner-action`, then it also appears verbatim (by ID) in the run's close-out "owner actions" list — cross-reference check. [REAL if run against a live GATE.md + a generated close-out report]
3. Given SESSIONS.md, when any launch prompt is parsed, then it contains all six required elements (package path, law, lane, branch pattern, DoD, register-handshake) plus a gotcha — a lint failure on any missing element.
4. Given SESSIONS.md, when two sessions' Lane entries reference the same repo, then at least one uses an `EXCEPT <files>` negative scope — otherwise flag a potential file-collision risk.
5. Given a STATUS.md close-out, when any epic/wave row remains non-`VERIFIED`, then its disposition is one of {BACKLOG-WITH-REASON, OWNER-GATED, IMPLEMENTED-NOT-VERIFIED-with-reason} — a lint failure if the row is any other unresolved state (e.g. bare "blocked" with no disposition).
6. Given a Test Contract case marked FAIL or unreachable at QA time, when the board closes, then that case's row is never rewritten to a backlog note — it stays IMPLEMENTED-NOT-VERIFIED with the reason attached. [REAL: run against a live QA report + STATUS.md diff]
7. Given a triage run over N seeds, when the verdict is not "Plan now", then a Plan-verdict never gets an "absorbed by" pointer and a Build-instead verdict never gets its own `.plan-it/<name>.state.json` — verdict-to-artifact mapping is exclusive.
8. Given a triage seed's verdict changed from its first draft, when the final triage doc is rendered, then a measurement block (value/where/when/read-only/moved) is present and cites the specific verdict transition.
9. Given a DECISIONS.md open card, when it lacks a stated Recommendation, then lint fails (an open card with no recommendation is an incomplete card per the field precedent's universal pattern).
10. Given a DECISIONS.md v2 (a report re-issued after a v1), when it is rendered, then a "Your rulings (carried forward)" table is present listing every prior-round item with a current State — a lint failure if any prior-round item silently disappears without a State update.
11. Given a report contains a corrected or retracted finding, when it renders, then the correction appears both in the top-matter summary AND at its original location in the body, each marked with a visible flag (⚠ or equivalent) — never a silent delete. [REAL: diff two versions of a generated report for a seeded fabricated-then-corrected finding]
12. Given a UI-shaped item in a DECISIONS/PLAN-REVIEW renderer, when it lacks a mockup slot built from ≥1 real measured row, then lint flags it; given a flow/mechanism-shaped item without a mermaid diagram slot, same. [REAL if run against the actual renderer once Stream A builds it — otherwise IMPLEMENTED-NOT-VERIFIED against a stub]
13. Given KICKOFF.md and SESSIONS.md coexist in a package, when both are present, then KICKOFF.md still carries exactly one launch prompt (its own, unchanged per the D4/E4 ruling that "KICKOFF.md + its single launch prompt STAY") and SESSIONS.md carries the rest — a structural check that the split didn't collapse into one file or duplicate prompts across both.

## 6. Contradictions / risks / open questions for synthesis

- **Glyph vocabulary collision.** Field precedents use `✅/⏸/🔴` prose glyphs for ruling status (F-D7, F-D17); v3's formats.md already has a typed tag vocabulary (`[DECIDED]/[CHANGED]/[CONFIRM: owner]`, §1). Synthesis needs to pick one — I'd recommend the typed tags for machine-lintability, with glyphs allowed only as a rendering-layer decoration Stream A's renderer adds on top, never as the source of truth a lint reads. Flagging for whichever stream owns the renderer/authoring-rule decision (not mine to make, per teammate boundaries below).
- **STATUS.md count-drift is a real, observed failure, not a hypothetical.** F-D9/F-D11 show the *same program*'s own final tally disagreeing with itself (92 vs 93) across two places in the field. This strengthens the case for the existing hard constraint 5 ("Counts computed, never typed") but also suggests v4 needs a **concrete mechanism** (a script that recomputes the tally from the contract + evidence files, referenced by both STATUS.md and any report), not just a prose rule — that's likely Stream B's (machine) or the gate-check tooling's job; flagging the evidence here since it's squarely this stream's finding.
- **Deadline field is evidence-thin.** Only one deadline was ever recorded across both decision queues read (F-D19), and it's a pure calendar fact. Whether E3's synthesis should add a `Deadline` column at all, given the field barely uses it, is a real open question — I lean "add it, optional, because its absence is exactly why the JWT-expiry item almost got lost in an undifferentiated 'staying open by design' bucket," but the case for it is thin evidence, not a slam dunk.
- **Orchestrator model tiering** ("Orchestrator model: Fable — coordinates and reviews only, never edits code", `README.md:39`) is a recurring standing rule across both field precedents' runbooks. Whether SESSIONS.md's orchestrator-runbook template should bake in a *recommended default tier* (not a model ID — a tier, consistent with hard constraint 4) for the conductor role is worth raising at synthesis; I did not see this ever violated in either precedent, so it reads as a strong convention, not just a one-off choice.
- **The "incidental finding" channel (gap 10) overlaps E4/E8 boundary** — it's partly an orchestrator-runbook concern (where does a squad log something unasked-for) and partly a disposition concern (how does it get closed out). I've proposed a STATUS.md Log tag (`[incidental]`) as the seam, but which stream owns codifying it should be confirmed at synthesis.
- **Worktrees-only (gap 9) is an unusually strong, already-ruled precedent** (P2-11 names plan-it/build-it explicitly) that arguably deserves more prominence in E4's synthesis than a single bullet in an orchestrator runbook — flagging it as a candidate for its own line item in whatever E4 design doc Stream B/the synthesis session produces.

## 7. Teammate boundaries

I did not design the DECISIONS/PLAN-REVIEW renderer itself, the manifest→HTML pipeline, or any rendering code — that's Stream A's (renderer). I did not touch `machine.json` states, guards, or the statechart/verb design (whether a new "triage" state gets inserted before `scopeGate`, whether GATE.md is machine-tracked) — that's Stream B's (machine). I did not rewrite any SKILL.md prose, phase descriptions, or the human-facing pipeline narrative — that's Stream C's (prose). Everything above is requirements-with-evidence for those three streams to build against, plus the schemas/grammars I judged concrete enough to specify directly since they're field-precedent artifacts already proven to work, not new inventions.
