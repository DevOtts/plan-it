# dogfood-project — CONTRACT

Version: **v1.0-draft — FROZEN FOR SQUADS 2026-09-07** (autonomous-draft mode; ratification at plan review bumps to v1.0).

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| run | the dogfood run itself, slug `dogfood` |

## 2 · Package layout

Everything lives under `delivery/`.

## Cases

| ID | @tag | Case | run: |
|---|---|---|---|
| C-D1-01 | @case-machine | dogfood happy path reaches DONE | `node tests/v4/core/dogfood-run.mjs` |

## RUN-POLICY (frozen into the package)

Tier table — tiers resolve to concrete models at execution time:

| slice class | tier | notes |
|---|---|---|
| dogfood fixture work | mid | escalate-on-struggle-one-tier-up; build-it:iteration-impl#slice=dogfood |

- reap-on-merge: builders are stopped as soon as their output is merged and captured in durable files.
- delivery rule: subagents write results to disk at exact absolute paths AND send a content-bearing final message.

## Changelog

- v1.0-draft — 2026-09-07 — FROZEN FOR SQUADS.
