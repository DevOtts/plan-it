#!/usr/bin/env node
/**
 * C-W1-02 — conventions-block write is idempotent (Epic A3 / FD-1).
 * Script-managed temp dir (mkdtempSync), no static fixture — runs the
 * testconv registration path twice against the same CLAUDE.md and asserts
 * exactly one fenced block results.
 *
 * EXIT-CODE CONVENTION (deliberately inverted): this script's run: cell is an
 * enforcement row in delivery/v3/CONTRACT.md's Cases table, and C-META-01
 * ("every enforcement case above exits non-zero against its violating
 * fixture") plus tests/run-contract.mjs's v3 loop execute it expecting a
 * NON-ZERO exit when the enforcement holds. So:
 *   exit 1 = idempotency held (two registrations, exactly one fenced block —
 *            the enforcement is demonstrated working);
 *   exit 0 = enforcement BROKEN (duplicate block, or registration crashed).
 * See AMD-3 (delivery/decisions.md 2026-07-08) for the exit-code vocabulary.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GC = join(ROOT, "scripts", "gate-check.mjs");

const dir = mkdtempSync(join(tmpdir(), "planit-idem-"));
writeFileSync(join(dir, "CLAUDE.md"), "# Fixture target repo\n");

function register() {
  execFileSync("node", [GC, "testconv", "--dir", dir, "--register", "Run npm test."], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

try {
  register();
  register();
} catch (e) {
  console.log(`BROKEN — registration invocation exited ${e.status}: ${e.stdout ?? ""}${e.stderr ?? ""}`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}

const text = readFileSync(join(dir, "CLAUDE.md"), "utf8");
const count = text.split("<!-- plan-it:test-conventions -->").length - 1;
if (count === 1) {
  console.log("OK — two registrations, exactly one fenced block (idempotent). Exiting 1 per the C-META-01 fail-closed sweep convention.");
  process.exit(1);
}
console.log(`BROKEN — expected exactly 1 fenced block after two registrations, found ${count}`);
process.exit(0);
