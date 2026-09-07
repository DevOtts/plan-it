#!/usr/bin/env node
/**
 * T-V4B4-09 — `glossary-good/delivery/` (a family pattern over a numeric
 * range, a literal ID that looks like a range but isn't, `·` lists,
 * families, and a code-span mention of an otherwise-unknown token) exits 0
 * with the computed resolved-count in the ok-line; `glossary-missing/`
 * exits 1 naming GLOSSARY.md.
 *
 * AMD-11 regression: a GLOSSARY with the literal row `P2-11` and a document
 * mentioning `P2-11` resolves it as that literal ID — never as the range
 * `P2…P11` (there is no range expansion at all; CONTRACT §5).
 *
 * (T-V4B4-08 is the CONTRACT's own direct gate-check invocation against
 * glossary-unknown-id/ — verified by hand, no wrapper needed.)
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(dir) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, "glossary", dir], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

{
  const r = run(join(ROOT, "tests/fixtures/v4/glossary-good/delivery"));
  assert(r.code === 0, `expected exit 0, got ${r.code}:\n${r.out}`);
  assert(/PASS — glossary: \d+ ID mention\(s\) resolved/.test(r.out), `expected the computed resolved-count ok-line:\n${r.out}`);
  assert(!r.out.includes("Z9-99"), `expected the code-span-only token Z9-99 to never be scanned:\n${r.out}`);
  assert(!r.out.includes("P2-11"), `expected the literal ID P2-11 to resolve, never reported unknown (AMD-11 — no range expansion):\n${r.out}`);
}

{
  const r = run(join(ROOT, "tests/fixtures/v4/glossary-missing/delivery"));
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("GLOSSARY.md"), `expected GLOSSARY.md named:\n${r.out}`);
}

if (failed) {
  console.error("FAIL — glossary-lint.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — glossary-lint.mjs: T-V4B4-09 passes");
process.exit(0);
