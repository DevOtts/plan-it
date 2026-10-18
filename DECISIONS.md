# Decisions: created history and plan gate (do-it 1.0.1)

- [DEFAULTED] Creation entry shape: `from: 'not-started', to: 'not-started', by: 'plan-it', note: 'created'`. Recommendation: keep. `validate` chains `from` against a default previous state of `not-started` and requires string `from`, so `null` is rejected and no validate rule was weakened.
- [DEFAULTED] `init --merge` records `created` only for tasks it adds (including tasks of a new wave); existing tasks get no second entry. Recommendation: keep.
- [DEFAULTED] Gate lives in `status-from-plan.mjs` (`gateCheck`, `--gate`); it does not require `created` entries, so boards made before 1.0.1 still pass. Recommendation: keep; add that check only if old boards are retired.
- [DEFAULTED] Existing build-it tests that counted history entries now exclude `created` entries; one hand-built migration fixture clears history first because a `migration` entry may not follow writer entries. Recommendation: keep.
- [DEFAULTED] plan-it tests locate the writer through DOIT_STATUS_WRITE; they need the build-it `feat/created-history` writer until it merges.
