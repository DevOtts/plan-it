# Fixture: contract-no-runpolicy.md

Consumed by: **T-B2-04** (`freeze` verb's new RUN-POLICY check).
Violates: "CONTRACT.md missing `## RUN-POLICY` → `freeze` FAILS."

This is a bare file (not a directory) because the binding case invokes
`gate-check freeze tests/fixtures/v3/contract-no-runpolicy.md` directly —
same convention as the existing v2 fixture `tests/fixtures/contract-good.md`.
It already passes the CURRENT `freeze` verb's checks (version header, ≥3 "##"
sections, changelog, no placeholders); only the RUN-POLICY-heading check that
Epic B2 adds is missing.
