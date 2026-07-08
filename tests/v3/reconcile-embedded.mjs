#!/usr/bin/env node
/**
 * C-W5-04 — reconcile runs standalone AND is invoked automatically inside
 * handoff (Epic A4). Runs both invocations against the same violating fixture
 * and asserts handoff surfaces the identical reconcile-sourced messages —
 * proving the embedding is the same internal function, not a lookalike.
 *
 * EXIT-CODE CONVENTION (deliberately inverted — same as
 * tests/v3/conventions-idempotent.mjs, see its header for the full rationale):
 *   exit 1 = enforcement held; exit 0 = enforcement BROKEN.
 * Per C-META-01's fail-closed sweep and AMD-3 (delivery/decisions.md
 * 2026-07-08).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GC = join(ROOT, "scripts", "gate-check.mjs");
const FIX = join(ROOT, "tests", "fixtures", "v3", "reconcile-embed-check");

function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GC, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const standalone = run(["reconcile", "--dir", FIX]);
const embedded = run(["handoff", "--dir", FIX]);
const msgs = [...standalone.out.matchAll(/✗ (C-W5-0[23][^\n]*)/g)].map((m) => m[1]);

let broken = null;
if (standalone.code === 0) broken = "standalone reconcile passed on the violating fixture";
else if (msgs.length === 0) broken = `standalone reconcile failed without C-W5-02/03 messages: ${standalone.out}`;
else if (embedded.code === 0) broken = "handoff passed on the violating fixture — the embedded reconcile did not run";
else {
  const missing = msgs.filter((m) => !embedded.out.includes(m));
  if (missing.length > 0) broken = `handoff output is missing reconcile-sourced message(s): ${missing.join(" | ")}`;
}

if (broken) {
  console.log(`BROKEN — ${broken}`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}
console.log(`OK — reconcile fails standalone AND inside handoff with the same ${msgs.length} reconcile-sourced message(s). Exiting 1 per the C-META-01 sweep convention.`);
process.exit(1);
