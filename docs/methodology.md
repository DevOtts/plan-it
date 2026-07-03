# Methodology

Why the pipeline is shaped the way it is. Every rule below was
reverse-engineered from real multi-squad planning runs — including the failure
each one exists to prevent.

## The four non-negotiable rules

### 1. Freeze a shared CONTRACT before any parallel planning

`delivery/CONTRACT.md` is the law: canonical entities, schema, API/interface,
enums, repo/branch map, and the definition of "shipped." Squads write *to* it;
any cross-cutting discovery folds *back* into it as a dated amendment
(v1.0 → v1.1 → …), applied centrally so no squad drifts.

**Failure it prevents:** two parallel teams each "locally deciding" the same
schema — a renderer built for shape A while the connector saves shape B.
Nothing crashes until integration, hours of work later.

### 2. Batch every human-only decision into ONE gate

Nothing irreversible is pre-decided: repo topology, hosting, product name,
architectural mode, build-vs-buy. All of it is surfaced together, numbered,
each with a recommendation attached — and the human answers by number. This
gate is also where the human injects **vision**, not just picks options; new
concepts introduced here get threaded through the docs with a coherence pass.
Each answer is locked with owner + date.

**Failure it prevents:** decision-by-drip — the agent making twelve small
irreversible calls across a run, none individually worth interrupting for,
collectively unreviewable.

### 3. Idle ≠ delivered — verify every agent's output on disk

A fan-out team going idle does **not** mean it wrote files. After every
fan-out, check the actual paths exist and are non-empty before proceeding; a
team that held its output as a message gets directed to write to the exact
absolute path; a team that did zero work gets re-dispatched.

**Failure it prevents:** the pipeline proceeding on phantom research — caught
live during this skill's own development, where a "finished" team had written
nothing.

### 4. Ground the plan against the LIVE system, not the repo

For any plan touching a running system, the repo is a *hypothesis*; the
deployed reality is the truth, and they drift. Before the contract freezes:

- **Config reachability, not presence** — *hit* every URL/flag the plan depends
  on; a value can be set to a dead host and pass a "does it exist" check.
- **Live canonical identifiers** — dump the actual slugs/IDs/enums the running
  system uses; manifests drift from the deployed catalog.
- **Deployed vs installed vs in-use** — "build X" is often "redeploy X."
- **Credential validity, not existence** — a found token ≠ a working token;
  verify with a live call.
- **Dependency sets from actual usage** — `code-grep ∪ declared requirements`,
  intersected with the live registry; the gaps become explicit work items.

**Failure it prevents:** in one program, *every* mid-flight correction traced
to a repo-inferred assumption reality contradicted.

## The Test Contract

The quality differentiator. The **last** step of writing every epic is
generating its test contract: up to ~20 concrete use-cases/scenarios with
**expected outputs registered at planning time**. The feature is not "done"
until 100% pass — the build agent iterates until green or reports honestly why
not.

Grounding in named practice:

- **Specification by Example** (Gojko Adzic) / **ATDD/BDD** — concrete examples
  become executable acceptance tests and living documentation.
- **Eval-Driven Development** — for skills/prompts/LLM features: goldens with
  expected outputs, iterate until they pass.

Rules: authored at planning time, never mid-build · quality over quantity
(~20 sharp cases beat thousands of shallow ones) · test types selected by
implementation kind (unit / e2e / use-case / stress / property-based /
golden-value) · **binding** — no partial ship, and no VERIFIED-on-a-mock: a
case whose real target is unreachable is IMPLEMENTED-NOT-VERIFIED, never a
fake green.

## The shape governor

One pipeline, several output shapes — chosen at gate G1 by use-case, because a
mis-shaped package is its own failure mode ("don't give a feature a 4-squad
org; don't give a brownfield refactor a greenfield vision doc"):

| Use-case | Shape |
|----------|-------|
| From-scratch multi-subsystem program | Multi-doc set + `delivery/` (the baseline) |
| Greenfield single app | Single-file PRD-as-everything, contract inlined |
| Feature on a large existing repo | Research → locked architecture → master + phase PRDs |
| Multi-app platform | `implementation/<name>/` with numbered PRD-NN |
| Refactor / migration / debt | Workstream catalog with verdict tables |
| Research spike, executable board, reverse-doc | Dedicated modes |

Full definitions live in the skill's `references/templates.md` (PART D).

## Autonomy posture

Guided, with autonomous bursts: research and authoring run unattended at high
reasoning effort; the pipeline stops only at G1 (scope), G2 (decisions), G3
(delivery approval). This is the inverse of
[`fable-it`](https://github.com/DevOtts/fable-it), which runs fully unattended
— because planning is where the human's judgment is *the* input, and building
is where it mostly isn't.

## Roadmap

- Wired examples: a public sample run (fuzzy demand → full package) as a fixture.
- A packaged consistency-lint script (today the lint is a checklist the skill executes).
- Tighter `plan-it` → `fable-it` state handoff (shared `.taskstate/` conventions).

---

_Built by [DevOtts](https://github.com/DevOtts)._
