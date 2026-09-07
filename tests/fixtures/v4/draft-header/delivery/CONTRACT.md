# fixture project — CONTRACT

Version: **v1.0-draft — FROZEN FOR SQUADS 2026-09-07** (autonomous-draft mode; ratification at plan review bumps to v1.0).

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| run | one execution of this fixture project |

## 2 · Package layout

Everything lives under `delivery/`.

## RUN-POLICY (frozen into the package)

Tier table — tiers resolve to concrete models at execution time:

| slice class | tier | notes |
|---|---|---|
| coordinator | top | owns gates and freeze |
| mechanical | low | deterministic, fully spec'd byte-work |

- reap-on-merge: builders are stopped as soon as their output is merged and captured in durable files.
- delivery rule: subagents write results to disk at exact absolute paths AND send a content-bearing final message.

## Changelog

- v1.0-draft — 2026-09-07 — FROZEN FOR SQUADS.
