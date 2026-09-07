# Fixture: dogfood-project

Consumed by: **T-V4B5-08, T-V4B5-09** (`tests/v4/core/dogfood-run.mjs`).

A complete autonomous-draft delivery package (`delivery/`) plus 22 recorded
`.plan-it/steps/NN-<state>.state.json` snapshots — one per transition of the
autonomous-draft path from `intake` through `done` — and the primary
`.plan-it/dogfood.state.json` positioned at `handoff` (one step short of
`done`, so `freeze`/`handoff` can still be exercised against it). Every
family-kind markdown doc (`CONTRACT.md`, `DECISIONS.md`, `GLOSSARY.md`,
`KICKOFF.md`, `PLAN-REVIEW.md`, `SCOPE-BRIEF.md`) carries a real stamped
`.html` twin (`planit-source` sha256 recomputed from the md's actual bytes,
never hand-typed); `render.outputs[].sha256` in every post-`adversaryGate`
step file is the twin's own real on-disk hash. `CONTRACT.draft.md` is a
separate file carrying the `-draft` header, for `freeze --draft`.

Positive: every one of the 22 steps resumes correctly via
`state --dir <tmp> --run dogfood`; `freeze --draft` accepts the draft
header, plain `freeze` accepts the final one; `handoff` (embedded glossary +
mirror `--require-html`) and standalone `mirror --dir --require-html` /
`glossary` all exit 0 against the real twins; `archive dogfood` moves the
`done` run to `.plan-it/done/`; `runs` shows it archived.

Negative: deleting `GLOSSARY.md` fails `handoff` (C-E10-02); flipping one
byte of `KICKOFF.md` fails `handoff` ESCALATED (C-E2-07) rather than plain
MIRROR_STALE, because `render.outputs[].sha256` already equals the twin's
real on-disk hash — re-rendering would reproduce the same stale bytes, so
the failed-recovery path escalates instead of looping; setting
`contract.version` to `"1.0-draft"` at the `handoff` step fails `state`
with "draft contract cannot hand off" (C-E7-04, G-13).
