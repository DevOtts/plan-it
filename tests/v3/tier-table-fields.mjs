#!/usr/bin/env node
/**
 * C-W3-03 — an epic's Tier Table parses with all four fields (tier | effort
 * | escalation | scaffold-pointer), and the scaffold-pointer must be a real
 * pointer (`fable-it:<preset>` or `.claude/agents/<file>.md`), never inline
 * prompt prose. The mechanism is the exported `checkEpicTierTable(epicText)`
 * function (scripts/gate-check.mjs ~line 341, `TIER_HEADER_RE`/`POINTER_RE`)
 * — imported directly (import-safe: CLI dispatch is guarded by `isMain`, so
 * importing has no side effects).
 *
 * Fixtures (existing on disk, already named for this case in their own
 * READMEs — T-B2-02):
 *   - tests/fixtures/v3/tier-table-good/delivery/v3/epics/epics-sample.md
 *     — valid 4-field row, fable-it:iteration-impl pointer.
 *   - tests/fixtures/v3/tier-table-bad-pointer/.../epics-sample.md — same
 *     shape, but the pointer cell is inline prompt prose with whitespace.
 * Plus one in-script text (no fixture dir needed — checkEpicTierTable takes
 * raw text) covering the "missing field" half of the case: a 3-cell row
 * (scaffold-pointer column entirely absent).
 *
 * EXIT-CODE CONVENTION (deliberately inverted — same as
 * tests/v3/conventions-idempotent.mjs, see its header for the full
 * rationale): exit 1 = enforcement held; exit 0 = enforcement BROKEN.
 * Per C-META-01's fail-closed sweep and AMD-3 (delivery/decisions.md
 * 2026-07-08).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkEpicTierTable } from "../../scripts/gate-check.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GOOD = join(ROOT, "tests", "fixtures", "v3", "tier-table-good", "delivery", "v3", "epics", "epics-sample.md");
const BAD_POINTER = join(ROOT, "tests", "fixtures", "v3", "tier-table-bad-pointer", "delivery", "v3", "epics", "epics-sample.md");

const MISSING_FIELD_TEXT = `# Epics-Sample (fixture, in-script)

## Epic Sample2

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | spec'd-implementation | escalate-on-struggle-one-tier-up |

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-S2-01 | @case-machine | [REAL] sample | \`node tests/v3/sample.mjs\` | n/a | draft-S2 |
`;

const goodFindings = checkEpicTierTable(readFileSync(GOOD, "utf8"));
const badPointerFindings = checkEpicTierTable(readFileSync(BAD_POINTER, "utf8"));
const missingFieldFindings = checkEpicTierTable(MISSING_FIELD_TEXT);

let broken = null;
if (goodFindings.length > 0) {
  broken = `valid 4-field table with a fable-it pointer was flagged: ${JSON.stringify(goodFindings)}`;
} else if (badPointerFindings.length === 0) {
  broken = "inline-prose scaffold-pointer (whitespace, not a pointer grammar) was NOT flagged";
} else if (!badPointerFindings.some((f) => /whitespace|pointer grammar/.test(f))) {
  broken = `bad-pointer fixture flagged, but not for the pointer/whitespace reason: ${JSON.stringify(badPointerFindings)}`;
} else if (missingFieldFindings.length === 0) {
  broken = "a Tier Table row missing the scaffold-pointer field entirely was NOT flagged";
} else if (!missingFieldFindings.some((f) => /missing scaffold-pointer|all 4 fields required/.test(f))) {
  broken = `missing-field row flagged, but not for a missing-field reason: ${JSON.stringify(missingFieldFindings)}`;
}

if (broken) {
  console.log(`BROKEN — ${broken}`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}
console.log(`OK — checkEpicTierTable accepts the valid 4-field/fable-it-pointer table with zero complaints, and rejects both an inline-prose pointer (${JSON.stringify(badPointerFindings)}) and a row missing the scaffold-pointer field (${JSON.stringify(missingFieldFindings)}). Exiting 1 per the C-META-01 fail-closed sweep convention.`);
process.exit(1);
