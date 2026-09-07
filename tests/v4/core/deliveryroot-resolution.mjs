#!/usr/bin/env node
/**
 * T-V4B3-04 — `reconcile --dir <fx> --run v4` scans `delivery/v4/epics`, not
 * an empty `delivery/v3/` (fixes F-B14): fails naming C-W5-03 and the v4
 * epic file.
 * T-V4B3-05 — `contract --dir <fx> --run v4` reads `delivery/v4/CONTRACT.md`
 * (not delivery/v3/): fails naming C-W5-01.
 * T-V4B3-06 — `adversary --dir <fx> --run v4` reads the deliveryRoot-resolved
 * CONTRACT and reports D-B3 cascade gaps; the positional equivalent
 * (`adversary <fx>/delivery/v4`) agrees.
 * T-V4B3-07 — `freeze --dir <fx> --run v4 --draft` resolves and checks
 * `delivery/v4/CONTRACT.md` (named in output); the positional form
 * (`freeze <fx>/delivery/v4/CONTRACT.md --draft`) resolves the same run via
 * resolveRunRoot's deliveryRoot scan and applies the same rules.
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
const V4_ONLY = join(ROOT, "tests/fixtures/v4/deliveryroot-v4-only");
const THIN = join(ROOT, "tests/fixtures/v4/deliveryroot-thin");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8", cwd: ROOT }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// T-V4B3-04
{
  const r = run(["reconcile", "--dir", V4_ONLY, "--run", "v4"]);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("C-W5-03") && r.out.includes("epics-x.md"), `expected C-W5-03 naming the v4 epic file:\n${r.out}`);
}

// T-V4B3-05
{
  const r = run(["contract", "--dir", V4_ONLY, "--run", "v4"]);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("C-W5-01"), `expected C-W5-01:\n${r.out}`);
}

// T-V4B3-06
{
  const viaDir = run(["adversary", "--dir", THIN, "--run", "v4"]);
  assert(viaDir.code !== 0, `expected non-zero exit for --dir mode, got 0:\n${viaDir.out}`);
  assert(viaDir.out.includes("D-B3"), `expected D-B3 cascade gaps named:\n${viaDir.out}`);

  const positional = run(["adversary", join(THIN, "delivery", "v4")]);
  assert(positional.code !== 0, `expected non-zero exit for positional mode, got 0:\n${positional.out}`);
  assert(positional.out.includes("D-B3"), `expected D-B3 cascade gaps named (positional):\n${positional.out}`);
}

// T-V4B3-07
{
  const viaDir = run(["freeze", "--dir", V4_ONLY, "--run", "v4", "--draft"]);
  assert(viaDir.code === 0, `expected exit 0 for freeze --dir --run --draft, got ${viaDir.code}:\n${viaDir.out}`);
  assert(viaDir.out.includes(join("delivery", "v4", "CONTRACT.md")), `expected delivery/v4/CONTRACT.md named in output:\n${viaDir.out}`);

  const positional = run(["freeze", join(V4_ONLY, "delivery", "v4", "CONTRACT.md"), "--draft"]);
  assert(positional.code === 0, `expected exit 0 for the positional equivalent, got ${positional.code}:\n${positional.out}`);
}

if (failed) {
  console.error("FAIL — deliveryroot-resolution.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — deliveryroot-resolution.mjs: T-V4B3-04, 05, 06, 07 pass");
process.exit(0);
