#!/usr/bin/env node
/**
 * T-V4B4-01 — `mirror-fresh/` exits 0, stdout `MIRROR_FRESH` with the
 * 12-hex hash prefix.
 * T-V4B4-04 — `mirror-malformed/` (40-hex hash) and `mirror-md-missing/`
 * (relpath points nowhere) each exit 1 with the structural reason named,
 * never exit 2.
 * T-V4B4-05 — `mirror-embed-changed/` (source fresh, embed stale) exits 2
 * naming the embed relpath; `mirror-brand-repo/` fresh variant exits 0,
 * stale variant exits 2 naming "brand" — relpaths resolved against the
 * twin's directory (CONTRACT §4.3).
 *
 * (T-V4B4-02 and T-V4B4-03 are the CONTRACT's own direct gate-check
 * invocations against mirror-stale/ and mirror-unstamped/ — verified by
 * hand, no wrapper needed.)
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
const FIX = join(ROOT, "tests/fixtures/v4");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(md, html) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, "mirror", md, html], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// T-V4B4-01
{
  const r = run(join(FIX, "mirror-fresh/X.md"), join(FIX, "mirror-fresh/X.html"));
  assert(r.code === 0, `expected exit 0, got ${r.code}:\n${r.out}`);
  assert(/MIRROR_FRESH/.test(r.out), `expected MIRROR_FRESH:\n${r.out}`);
  assert(/[0-9a-f]{12}/.test(r.out), `expected a 12-hex hash prefix:\n${r.out}`);
}

// T-V4B4-04
{
  const r1 = run(join(FIX, "mirror-malformed/X.md"), join(FIX, "mirror-malformed/X.html"));
  assert(r1.code === 1, `mirror-malformed: expected exit 1, got ${r1.code}:\n${r1.out}`);
  assert(/malformed stamp/.test(r1.out), `mirror-malformed: expected "malformed stamp" named:\n${r1.out}`);

  const r2 = run(join(FIX, "mirror-md-missing/nonexistent.md"), join(FIX, "mirror-md-missing/X.html"));
  assert(r2.code === 1, `mirror-md-missing: expected exit 1, got ${r2.code}:\n${r2.out}`);
  assert(/source not found/.test(r2.out), `mirror-md-missing: expected "source not found" named:\n${r2.out}`);
}

// T-V4B4-05
{
  const embed = run(join(FIX, "mirror-embed-changed/X.md"), join(FIX, "mirror-embed-changed/X.html"));
  assert(embed.code === 2, `mirror-embed-changed: expected exit 2, got ${embed.code}:\n${embed.out}`);
  assert(embed.out.includes("embed.md"), `mirror-embed-changed: expected the embed relpath named:\n${embed.out}`);

  const brandFresh = run(join(FIX, "mirror-brand-repo/X-fresh.md"), join(FIX, "mirror-brand-repo/X-fresh.html"));
  assert(brandFresh.code === 0, `mirror-brand-repo (fresh): expected exit 0, got ${brandFresh.code}:\n${brandFresh.out}`);

  const brandStale = run(join(FIX, "mirror-brand-repo/X-stale.md"), join(FIX, "mirror-brand-repo/X-stale.html"));
  assert(brandStale.code === 2, `mirror-brand-repo (stale): expected exit 2, got ${brandStale.code}:\n${brandStale.out}`);
  assert(/\(brand\)/.test(brandStale.out), `mirror-brand-repo (stale): expected "(brand)" named:\n${brandStale.out}`);
}

if (failed) {
  console.error("FAIL — mirror-stale.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — mirror-stale.mjs: T-V4B4-01, 04, 05 pass");
process.exit(0);
