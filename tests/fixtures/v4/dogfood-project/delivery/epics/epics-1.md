## Epic D1 — dogfood happy path (covers R1)

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | dogfood fixture work | escalate-on-struggle-one-tier-up | build-it:iteration-impl#slice=dogfood |

Cascade map: partial-failure — N/A: linear happy-path fixture, nothing
partially applies (waiver: `partial-failure: N/A — single linear walk`);
rollback/compensation — N/A: nothing is undone (waiver:
`rollback/compensation: N/A — no rollback path in this fixture`);
failed-recovery→escalation — N/A (waiver:
`failed-recovery→escalation: N/A — asserted elsewhere in the SQ-B lane`);
recovery/resume — T-D1-01 (state --run resumes at every recorded step);
adversarial-verify — T-D1-01 (mirror re-hashes every twin from bytes).

### Test Contract

| ID | @tag | Case | run: |
|---|---|---|---|
| T-D1-01 | @case-machine | dogfood run resumes at every recorded step and reaches handoff | `node tests/v4/core/dogfood-run.mjs` |
