# Stream A: pxpipe (context-imaging proxy) — mechanisms transferable to plan-it v3

## What I examined
Repo cloned at `/tmp/planit-v3-ext/pxpipe` (source: https://github.com/teamchong/pxpipe), a local reverse proxy that rewrites bulky Anthropic `/v1/messages` content into PNG images to cut token cost.

- `README.md` (244 lines) — top-level pitch, default model scope (`claude-fable-5`, `gpt-5.6`), claims ~59–70% end-to-end bill reduction.
- `FINDINGS.md` (605 lines) — dated, append-only research log with self-corrections (e.g. a marketing claim "16× vs text" walked back to "true legible rate ~5× vs text"), root-cause writeups, and external prior-art comparisons (file:line citations against opencode/codex).
- `docs/`: `HISTORY_CACHE_MODEL.md` (239 lines), `ADAPTIVE_CPT_PLAN.md` (222 lines), `CACHING_AND_SAVINGS.md` (213 lines), `NOT-OCR.md` (127 lines), `LEGIBILITY-AUDIT-2026-07-01.md` (111 lines), `RENDER_SIZING.md` (158 lines) — all read in full.
- `eval/README.md` (271 lines) + `eval/EXPERIMENT_LOG.md` (partial, lines 1–64 of ~3.2K) — L0/L1/L2 eval harness documentation and a real experiment log with revert history.
- `eval/results/` and `eval/results-opus/` — confirmed present on disk and not gitignored (`l1-report.md`, `l2-report.md`, `l1-results.json`, `l2-results.json`, `summary.md`), i.e. these are checked-in run artifacts, not just narrative claims.
- `bench/run.sh` (113 lines) and `bench/score.mjs` (156 lines) — both read in full: a real, dependency-light A/B bench harness that spins up the actual proxy and a real headless Claude Code session.
- Directory listings only (not line-read) for `eval/{ab,gist-recall,glyph-matrix,gsm8k,needle-haystack,opus-density,swe-bench,swe-bench-pro,verbatim-15}/` and `tests/` (34 entries) — noted for completeness, not needed for the adopt/out-of-scope conclusions below.

**Caveat on rigor**: I read the harness code and its checked-in outputs; I did not re-execute `bench/run.sh` or the eval scripts myself in this session, so I cannot independently reproduce the headline 59–70% savings or 614/614-test claims. What I can verify directly: the harnesses are real, runnable (no mocked network calls, real proxy process, real JSONL event logging), and their claimed thresholds/methodology are concretely specified, not hand-waved.

## Findings

**1. The core mechanism is a profitability-gated render, not blind compression.** Text is wrapped/reflowed and packed into fixed-width, variable-height PNG pages; a per-request gate compares predicted image tokens vs. text tokens *before* compressing, so it only fires when it's actually cheaper.

**2. Cache-boundary discipline is the single most load-bearing design decision.** Anthropic's prompt cache is prefix-keyed; pxpipe's history-imaging boundary is **quantized to a fixed grid** (`collapseChunk=50`) instead of a moving window, and the `cache_control` marker is *relocated* (never freshly added) onto the last stable image — specifically to avoid re-keying the cache every turn. This is the fix for a named historical regression ("bug #28") that produced **−250%** savings from continuous `cache_create` churn. This is the clearest evidence in the repo that the team measured a real regression and shipped a structural fix, not a parameter tweak.

**3. Savings accounting is neutral by construction, not by promise.** Both the real (imaged) request and its text counterfactual (via `/count_tokens`) are priced under the *same observed cache warmth* — pxpipe does not credit itself for Anthropic's own cache discount, and negative-savings rows are shown, not hidden or floored (`docs/CACHING_AND_SAVINGS.md`).

**4. There is a real, three-tier (L0/L1/L2) eval harness with named shipping thresholds, and it has actually blocked a change.** L0 = vitest unit invariants (no API key, CI-safe). L1 = OCR-fidelity eval with published per-item USD cost estimates (~$0.50–$1.00/20 blocks) and an explicit macro-accuracy target (≥95%). L2 = task-level A/B session replay with a model-judge rubric and a three-tier ship/investigate/reject gate:

   | Mean judge score | ≥ 0.80 | ✅ Ship | 0.65–0.79 | ⚠️ Investigate | < 0.65 | ❌ Do not ship |

   `eval/EXPERIMENT_LOG.md` shows this gate in action: a row-break rendering fix ("Attempt #1") passed all 315 unit tests and *improved* OCR accuracy (90.91% → 94.93%) but was still reverted from the working tree with the explicit verdict "improvement is real but not shippable" — tests-green was not treated as sufficient. A second attempt ("Attempt #2," co-rendering the OCR instruction inside the image) *was* shipped, beating baseline on 17/20 blocks. `RENDER_SIZING.md` independently corroborates the same revert-discipline pattern for an unrelated width-shrink experiment (built 2026-05-23, reverted 2026-05-25 after measurement showed no gain).

**5. Failure-triggered, blinded root-cause audits are a repeated pattern, not a one-off.** `docs/LEGIBILITY-AUDIT-2026-07-01.md` is a full audit template that, in the course of measuring text-recovery failures, discovered the Anthropic API silently downscales oversized images before billing (a 0.555× resample bug), fixed by clamping to 1568×728. Same audit self-corrects a prior public marketing number.

**6. The team is explicit about what is aspirational vs. shipped.** `docs/ADAPTIVE_CPT_PLAN.md` is headed as a locked *plan*, not an implementation — a full design (6-bucket content taxonomy, OLS regression, phased rollout) for learned chars-per-token, motivated by a measured ~40% undercount in the current hardcoded constants, but explicitly not yet built. Separately, `RENDER_SIZING.md`/the render gate admits the `TOKENS_PER_IMAGE` billing constant it uses is ~3× off from a fresh production-log regression (~907 px/token actual vs. ~312 px/tok implied by the stale constant) — an open, unresolved discrepancy, stated plainly rather than smoothed over.

**7. Not-OCR framing is a genuine capability boundary, not just a caveat.** `docs/NOT-OCR.md` argues VLMs have no discrete-glyph decode stage, so there's no per-glyph confidence signal to fail loudly on — producing *silent, plausible* confabulation on exact strings (hashes, IDs) while gist-level prose stays high-fidelity. The audit's response is a **sparsity-based split**: sparse precision-critical tokens get a verbatim "factsheet" side-channel (proven, covers 7/9 measured misses); dense precision content needs a re-fetch/"rehydrate" tool built on a `RecoverableBlock` provenance mechanism that is explicitly flagged as scaffolded but **not yet wired to a model-callable tool**.

**8. The bench harness is real infrastructure, not vaporware.** `bench/run.sh` builds the project, launches the actual proxy process, drives a real multi-turn headless Claude Code session through it, and deliberately churns the volatile `<env>` block between turns to simulate cache-flip conditions. `bench/score.mjs` computes `cost_units` (cache-create rate 1.25×, cache-read rate 0.1×, cross-checked in-code against `src/core/baseline.ts`), `prefix_flips`, `cold_restarts`, and `flip_waste_tokens`, with a built-in A/B diff mode. This is a small, focused, working example of a cost/regression harness — worth noting as a *pattern*, separate from its specific (out-of-scope) implementation.

## Mechanisms plan-it v3 could adopt (≤8)

1. **Threshold-gated ship/no-ship discipline for plan changes** → enforces that a plan-it self-improvement (prompt tweak, phase reorder, gate rule change) can't be called "done" on green tests alone; requires a named quantitative bar plus an explicit verdict → belongs in plan-it's own CONTRACT-amendment / meta-improvement process (the loop plan-it uses to revise itself, not the user's plan) → **cost: low** (a written threshold table + a verdict line per change, no new tooling).

2. **Build → measure → revert-if-no-gain change log** → enforces that speculative plan-it improvements are tried in a branch/experiment, measured, and explicitly reverted with a written reason if they don't pay off, rather than silently kept or silently dropped → belongs in the plan-it meta/dev process around AMENDMENT self-loop iterations → **cost: low** (discipline + a log file, e.g. `EXPERIMENT_LOG.md` equivalent).

3. **Neutral/counterfactual-honest claims about any plan-it efficiency feature** → enforces that if plan-it ever claims a phase saves time/tokens/rework, the baseline it's compared against must be apples-to-apples and negative results must be shown, not floored → belongs in whatever phase or doc makes efficiency claims about plan-it itself (e.g. governor sizing, S/M/L cost estimates) → **cost: low** (a stated accounting rule, checked at doc-review time).

4. **Gist-vs-verbatim tiered classification for planning-time context** → enforces that when the planning conductor summarizes/compacts prior research or discovery output, it explicitly tags what's safe to gist-summarize (narrative, rationale) vs. what must survive verbatim (exact paths, IDs, schema names, env var names) → belongs in the discovery/spec phases and in any inter-phase handoff/compaction step → **cost: medium** (needs a tagging convention and a check that verbatim-tagged content actually round-trips into downstream docs).

5. **Small-n / caveat-flagging discipline on any measured or benchmarked plan-it claim** → enforces that when plan-it's own docs cite a metric (e.g., "N% of Test Contracts pass on first try"), sample size and conditions are stated inline, not implied as universal → belongs in retrospective/lessons-learned artifacts → **cost: low**.

6. **Root-cause audit template triggered by a real observed failure** → enforces that when a plan → execution handoff fails (a Test Contract case turns out untestable, or a late discovery in EXECUTION contradicts the plan), the fix is preceded by a written, dated audit that states what was measured, what was found, and what changed — not just a silent patch → belongs in the AMENDMENT self-loop and in any human-gate rejection path → **cost: medium** (a template file + the practice of using it before amending).

7. **External-prior-art comparison discipline in design docs** → enforces that when plan-it's design docs justify a mechanism (e.g. a new gate, a new phase), they cite comparable prior art (other planning tools, other agent frameworks) with concrete references rather than asserting novelty → belongs in the spec-authoring phase, specifically wherever design rationale is written → **cost: low**.

8. **Dated, append-only research/decision log with explicit correction entries** → enforces that plan-it's own research and design decisions accumulate in one chronological file where earlier claims can be walked back in writing (rather than silently edited or lost) → belongs alongside the CONTRACT/AMENDMENT artifacts, as the log of *why* the contract changed → **cost: low** (a single markdown file + a habit).

## Out-of-scope but valuable (fable-it backlog candidates)

These are builder/execution-side and belong to fable-it, not plan-it's planning phase:

- The image-render/packing/atlas pipeline itself (text → wrap/reflow → PNG pages).
- The quantized cache-boundary + `cache_control`-relocation implementation (the "bug #28" fix) — a general pattern for any fable-it feature that needs to minimize cache-key churn across turns.
- The profitability/burn-vs-savings gate that decides whether to compress a given request.
- `ADAPTIVE_CPT_PLAN.md`'s learned per-content-type token-cost regression system — currently plan-locked, not built; a candidate once/if fable-it needs accurate cost prediction for a similar compression feature.
- The `RecoverableBlock` provenance + rehydrate-tool wiring — currently half-built (scaffolded, not model-callable); relevant to any fable-it feature that needs to recover exact content after a lossy transform.
- The dashboard/structured JSONL event-log architecture used by both the running proxy and `bench/run.sh`.
- Reconciling the billing-constant-vs-production-log discrepancy (`TOKENS_PER_IMAGE`, ~3× off) — an open bug, not a mechanism, but worth tracking if fable-it ever imports pxpipe-style cost estimation.
- `bench/run.sh` + `bench/score.mjs` as a reusable pattern for a lightweight, real (non-mocked) A/B cost/regression harness for any fable-it feature that touches prompt caching or token cost.

## TL;DR (≤8 bullets)

- pxpipe's core mechanism is a profitability-gated text→image render for prompt-caching cost reduction; the design most worth borrowing is *process*, not the imaging tech itself.
- The single best-evidenced engineering practice: cache-boundary quantization + marker relocation, shipped specifically to fix a measured −250% regression ("bug #28") — a real regression-driven fix, not a hypothetical.
- The L0/L1/L2 eval harness has concrete, named ship/no-ship thresholds and has actually blocked a change that passed all unit tests but failed the quality bar ("improvement is real but not shippable").
- `eval/results/` and `eval/results-opus/` contain real, checked-in run artifacts (not gitignored), and `bench/run.sh`/`score.mjs` are real, dependency-light, non-mocked harnesses — but I did not re-run them myself, so headline savings/test-pass numbers are cited, not independently reproduced.
- The team is unusually explicit about what's aspirational vs. shipped: `ADAPTIVE_CPT_PLAN.md` is marked "plan locked, not implemented," and a ~3× billing-constant discrepancy is stated as an open, unresolved bug rather than smoothed over.
- Recommended plan-it v3 adoptions (8, all process/discipline patterns, all low-to-medium cost): threshold-gated ship discipline, build-measure-revert logging, counterfactual-honest efficiency claims, gist-vs-verbatim context tiering, small-n caveat flagging, failure-triggered root-cause audits, external-prior-art citation discipline, and a dated append-only decision log.
- Everything image-rendering, cache-mechanics-implementation, and rehydrate-tooling related is out-of-scope for plan-it's planning phase and is logged as fable-it backlog candidates instead.
- Bottom line: pxpipe's savings claims are plausible and its infrastructure is genuinely runnable, but the transferable value for plan-it v3 is its measurement/revert/audit discipline, not its compression technology.
