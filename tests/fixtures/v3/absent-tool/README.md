# Fixture: absent-tool (C-W2-03)

Real fixture (was a stub). Exercises the cross-squad seam: Squad B's preflight
writes `ENV-FACTS.md` marking a tool ABSENT; Squad A's `contract` verb must fail
any Test Contract case whose `run:` cell *invokes* that tool.

- `ENV-FACTS.md` marks `frobnicate` ABSENT (and `node` PRESENT, a control).
- `delivery/v3/CONTRACT.md` has C-AT-01 (control: names frobnicate only as an
  argument to `node`, still runnable) and C-AT-02 (invokes `frobnicate` directly,
  NOT runnable).

Frozen run: `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/absent-tool`
Expected: FAIL, citing C-W2-03 on C-AT-02 only.
