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

Further V4B2–V4B5 fixtures (`triage-*`, `planreview-*`, `draft-*`,
`defaults-*`, `portfolio*`, `deliveryroot-*`, `guard-*`, `mirror-*`,
`glossary-*`, `disposition-*`, `envfacts-*`, `dogfood-project/`) land as
those epics build, each with its own `README.md`.
