# tests/fixtures/v4/ — index

Fixture corpus for plan-it v4 (`delivery/v4/CONTRACT.md`), same convention as
`tests/fixtures/v3/README.md`: every directory/file here is referenced by a
Binding Test Contract table in `delivery/v4/epics/epics-{a,b,c}-*.md` and/or a
`run:` cell in `delivery/v4/CONTRACT.md`'s `## Cases` table. Each fixture
carries its own `README.md` naming exactly which case ID(s) it feeds.

Ownership (CONTRACT §2): SQ-B owns everything here except `report/` (SQ-A).

## SQ-B (deterministic core — `epics-b-core.md`)

| fixture | epic | case(s) |
|---|---|---|
| `machine/` | V4B1 | T-V4B1-05…12 (see `machine/README.md`) |
| `triage-bad-verdict/` | V4B2 | T-V4B2-01 |
| `triage-no-memo/` | V4B2 | T-V4B2-02 |
| `triage-closed/` | V4B2 | T-V4B2-03 |
| `defaults-empty/` | V4B2 | T-V4B2-04 |
| `defaults-bad-source/` | V4B2 | T-V4B2-05 |
| `planreview-no-file/` | V4B2 | T-V4B2-06 |
| `planreview-no-ack/` | V4B2 | T-V4B2-07 |
| `planreview-good/`, `planreview-unmatched-contradiction/` | V4B2 | T-V4B2-08 |
| `draft-at-handoff/` | V4B2 | T-V4B2-09 |
| `mode-mixed/` | V4B2 | T-V4B2-10 |
| `contradiction-recovery/`, `contradiction-twice/` | V4B2 | T-V4B2-11 |
| `state-run/` | V4B2 | T-V4B2-12, 15 |
| `draft-header/` | V4B2 | T-V4B2-13, 14 |
| `draft-no-defaults/`, `draft-no-reap/` | V4B2 | T-V4B2-14 |

Further V4B3–V4B5 fixtures (`portfolio*`, `deliveryroot-*`, `guard-*`,
`mirror-*`, `glossary-*`, `disposition-*`, `envfacts-*`, `dogfood-project/`,
`epic-heading-v4/`, `testconv-named/`) land as those epics build, each with
its own `README.md`.
