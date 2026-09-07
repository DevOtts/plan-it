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
| `portfolio/` | V4B3 | T-V4B3-08, 09, 11 |
| `portfolio-archived/` | V4B3 | T-V4B3-10, 12 |
| `portfolio-broken/` | V4B3 | T-V4B3-12 |
| `deliveryroot-v4-only/` | V4B3 | T-V4B3-04, 05, 07 |
| `deliveryroot-thin/` | V4B3 | T-V4B3-06 |
| `testconv-named/` | V4B3 | T-V4B3-02, 03 |
| `guard-two-runs/` | V4B3 | T-V4B3-13 |
| `guard-unfrozen-named/`, `guard-unfrozen-named-frozen/` | V4B3 | T-V4B3-14 |
| `guard-legacy-docs/`, `guard-broken-named/` | V4B3 | T-V4B3-15 |
| `epic-heading-v4/` | V4B3 | T-V4B3-17 |
| `defaults-not-orphans/` | V4B4 | T-V4B4-17 (AMD-7) |
| `mirror/` | V4B4 | stamp helper, not a case fixture |
| `mirror-fresh/` | V4B4 | T-V4B4-01 |
| `mirror-stale/` | V4B4 | T-V4B4-02 |
| `mirror-unstamped/` | V4B4 | T-V4B4-03 |
| `mirror-malformed/`, `mirror-md-missing/` | V4B4 | T-V4B4-04 |
| `mirror-embed-changed/`, `mirror-brand-repo/` | V4B4 | T-V4B4-05 |
| `mirror-missing-twin/` | V4B4 | T-V4B4-06 |
| `mirror-escalated/` | V4B4 | T-V4B4-07 |
| `glossary-unknown-id/` | V4B4 | T-V4B4-08, 10 |
| `glossary-good/`, `glossary-missing/` | V4B4 | T-V4B4-09 |
| `disposition-missing/` | V4B4 | T-V4B4-11 |
| `disposition-contract-case/` | V4B4 | T-V4B4-12 |
| `disposition-tally-drift/` | V4B4 | T-V4B4-13 |
| `disposition-good/`, `disposition-bad-path/`, `disposition-malformed/` | V4B4 | T-V4B4-14 |
| `envfacts-tool-only/`, `envfacts-tool-only-no-column/` | V4B4 | T-V4B4-15, 16 |

Further V4B5 fixtures (`dogfood-project/`) land as that epic builds, each
with its own `README.md`.
