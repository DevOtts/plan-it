# TEST-CONTRACT-REVIEW — plan-it v4 (FD-2 pre-freeze case review)

Reviewed-by: coordinator (autonomous-draft mode per ruling D1; owner ratification by Fernando Ott at PLAN-REVIEW G4) 2026-09-07
Scope: the 60 enforcement cases (count computed by `gate-check contract`) in `delivery/v4/CONTRACT.md` `## Cases` (C-E1-01 … C-E11-07), reviewed against the four stream seed lists before freeze. Per-epic Test Contracts (`T-<EID>-NN`) are authored by the squads against this CONTRACT and reviewed at PLAN-REVIEW together with this file.
Legend: `C-E<n>-NN` enforcement case for enhancement n · `F-<stream><n>` research finding · INV = IMPLEMENTED-NOT-VERIFIED.

## Review method

Every case was checked for: (1) a fixture or positive input it can run against; (2) a `run:` command (only one `manual:` row, C-E11-07, share 1/60 ≈ 2%, under the 30% ceiling); (3) a named failure state from CONTRACT §3 where the case asserts a failure outcome; (4) traceability to a stream seed or a governance rule. Cases that failed a check were rewritten before freeze; none were dropped silently.

## Draft → binding map (which stream seed each case came from)

| Case group | Source seeds | Notes from review |
|---|---|---|
| C-E1-01…04 (prose: sections, description budget, local-HTML rule, templates) | Stream C seeds 1, 2, 4, 8 | description budget bound to the documented 1,024 cap, not the unconfirmed 1,536 (LG-10) |
| C-E2-01…14 (renderer, mirror) | Stream A seeds 1–3, 4–9, 11–15, 19; Stream B §4.5 | XSS case widened from Stream A's list to include attribute-quote breakout (F-A3) |
| C-E3-01…03 (decision cards, rulings-forward, copy-rulings) | Stream D seeds 9, 10; Stream A block table | rulings-forward failure made explicit (dropped prior item → exit 2) |
| C-E4-01…02 (GATE shape, SESSIONS prompts) | Stream D seeds 1, 3, 4, 13; LG-16, LG-17 | worktrees-only and poll-never-wait folded into the prompt lint |
| C-E5-01…03 (mockup provenance, measurement read-only, states) | Stream A seeds 16, 18; Stream D seed 12 | Stream D's "UI-shaped decision without a mockup slot" is authoring guidance in SKILL, not a mechanizable lint — left to the PLAN-REVIEW reader, recorded here as a waiver of automation |
| C-E6-01…03 (triage, ENV-FACTS tool-only) | Stream B seed 5; Stream D seeds 7, 8; LG-7 | LG-7 fix added as a case (was a finding only) |
| C-E7-01…07 (machine additivity, plan review, draft, mode) | Stream B seeds 1–4, 14, 15, 18 | escalation on a second contradiction added (adversary cascade class) |
| C-E8-01…03 (dispositions) | Stream B seed 9; Stream D seeds 5, 6 | |
| C-E9-01…10 (named runs, guard, archive, runs, mirror pairs, harness) | Stream B seeds 6, 7, 10, 11, 13, 17; Stream A seed 20 | guard case asserts BOTH copies (adversarial-verify) |
| C-E10-01…04 (glossary) | Stream B seed 8; Stream A seeds 9, 10; Stream C seeds 3, 10 | |
| C-E11-01…07 (release, dogfood, owner action) | Stream C seeds 5–7, 9–11; Stream B seed 2, 18 | dogfood run added as the end-to-end proof |

## Cascade-class coverage (adversary gate)

partial-failure → C-E2-02 · rollback/compensation → C-E7-06, C-E9-05 · failed-recovery→escalation → C-E2-07, C-E7-06 · recovery/resume → C-E9-01, C-E2-06, C-E9-08 · adversarial-verify → C-E2-06, C-E9-07, C-E5-01. Every declared failure state in CONTRACT §3 (CLOSED_WITHOUT_PLAN, REVIEW_CONTRADICTED, RENDERED_PARTIAL, RENDER_FAILED, MIRROR_STALE, MIRROR_REJECTED, HTML_UNSTAMPED, ESCALATED, WRITE_DENIED, ARCHIVE_REFUSED, REJECTED) is an asserted outcome of at least one case above.

## Waivers (explicit)

- WAIVED: automated detection of "a UI-shaped decision has no mockup" — judgment, enforced by the reviewer at PLAN-REVIEW and by the SKILL authoring rule, not by a lint.
- WAIVED: network fetch of mermaid or fonts in tests — asserted by the pinned URL's presence, never by fetching (offline-safe harness).

## What the owner should look at first at PLAN-REVIEW

1. R1 (draft-contract mechanics) — the one default that changes how the pipeline feels.
2. C-E9-07 / C-E9-08 (guard behaviour on named runs) — the fix that was never installed.
3. C-E2-12 (escaping) — the security case for the renderer.
