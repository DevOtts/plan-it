# fixture project — CONTRACT (delivery/v4/ only)

Version: **v1.0-draft — FROZEN FOR SQUADS 2026-09-07**
Tally: 5

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| run | one execution of this fixture project |

## 2 · Package layout

Everything lives under `delivery/v4/`; `delivery/v3/` is present and empty
(proves the pre-D-B6 hardcoded `delivery/v3/` lookup false-greened here).

## RUN-POLICY

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | fixture work | escalate-on-struggle-one-tier-up | build-it:iteration-impl#slice=fixture |

- reap-on-merge: builders are stopped as soon as their output is merged and captured in durable files.
- delivery rule: subagents write results to disk at exact absolute paths AND send a content-bearing final message.

## Cases

| ID | @tag | Case | run: |
|---|---|---|---|
| C-X1-01 | @case-machine | one case | `node tests/v4/core/x.mjs` |
| C-X1-02 | @case-machine | two case | `node tests/v4/core/y.mjs` |

## Changelog

- v1.0-draft — 2026-09-07 — FROZEN FOR SQUADS.
