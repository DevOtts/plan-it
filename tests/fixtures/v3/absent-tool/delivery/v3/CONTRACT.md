# absent-tool fixture — CONTRACT (violates C-W2-03)

Fixture for `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/absent-tool`.
The `frobnicate` tool is marked ABSENT in this fixture's ENV-FACTS.md, so any case
whose `run:` command *invokes* it is not runnable here and must fail the contract.

## Cases

| ID | @tag | Case | run: |
|---|---|---|---|
| C-AT-01 | @case-machine | control: names frobnicate only as an argument (still runnable — node is present) | `node scripts/gate-check.mjs verify frobnicate-report.txt` |
| C-AT-02 | @case-machine | invokes the frobnicate tool directly (NOT runnable — ENV-FACTS: ABSENT) | `frobnicate --scan delivery/v3` |
