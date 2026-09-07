# plan-it

Claude Code plugin: deterministic multi-squad planning pipeline (statechart core + gate-check + PreToolUse hard gate). Plugin source: `plugins/plan-it/`. Current: v3.0.1.

## Documentation

Docs home: docs/   <!-- session-debrief writes here -->
Conventions: brain-docs schema (type/title/description/status/verified/repos/tags frontmatter); legacy files gain frontmatter when next edited.

## Research

The raw v3 field-study package (spec seed, FD-1/FD-2 mandates, brief, 8 findings reports, launch prompt) lives at the repo root but is **git-ignored and local-only** — it carries personal/project-identifying material and is deliberately not published. The public synthesis and its index live under `docs/research/v3/` (`docs/research/v3/index.md`).

<!-- plan-it:test-conventions -->
Runner: node tests/run-contract.mjs (zero deps; exit 0 only at 100% pass). Binding cases are discovered from the frozen CONTRACT's '## Cases' table (| ID | @tag | Case | run: |) — every row carries a run: command; enforcement rows must FAIL CLOSED against a violating fixture under tests/fixtures/<version>/. Per-case scripts live in tests/<version>/*.mjs; shared helpers in tests/<version>/lib/. gate-check verbs are exercised positionally and via --dir. Release gates: run-contract 100%, fail-closed-sweep, mirror-check 8/8, machine-diff additive vs pinned baseline, version-triple-match, changelog-shape. v4 adds tests/v4/ + tests/fixtures/v4/ in the same shape.
<!-- /plan-it:test-conventions -->
