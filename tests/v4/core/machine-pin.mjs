#!/usr/bin/env node
/**
 * T-V4B1-04 — adversarial-verify: the byte-pinned 3.0.1 baseline is re-read
 * from disk and re-hashed against `git show 7fcff27:…machine.json`, never
 * trusted. A byte-flipped copy in a temp dir must fail the same check,
 * naming both hashes.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PIN = join(ROOT, "tests/fixtures/v3/machine.v3.7fcff27.json");
const EXPECTED_SHA = "05d2147be8c2503a72e781da5bd1fdfe280c77dde1c2f7408ecc18e1e1d074eb";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Re-read from disk and re-hash — never trust a cached/typed value. */
function verifyPin(pinPath, gitRef) {
  const pinBytes = readFileSync(pinPath);
  const pinHash = sha256(pinBytes);
  const gitBytes = execFileSync("git", ["show", gitRef], { cwd: ROOT, maxBuffer: 1024 * 1024 * 16 });
  const gitHash = sha256(gitBytes);
  return { pinHash, gitHash, match: pinHash === gitHash };
}

let failed = false;

// Part 1 — the real pin matches git history, and both equal the frozen hash.
{
  const { pinHash, gitHash, match } = verifyPin(PIN, "7fcff27:plugins/plan-it/skills/plan-it/machine.json");
  if (!match) {
    console.error(`FAIL — pin SHA-256 (${pinHash}) != git show 7fcff27 SHA-256 (${gitHash})`);
    failed = true;
  }
  if (pinHash !== EXPECTED_SHA) {
    console.error(`FAIL — pin SHA-256 is ${pinHash}, expected ${EXPECTED_SHA}`);
    failed = true;
  }
  if (gitHash !== EXPECTED_SHA) {
    console.error(`FAIL — git show 7fcff27 SHA-256 is ${gitHash}, expected ${EXPECTED_SHA}`);
    failed = true;
  }
  if (!failed) console.log(`  ok — pin re-hashed from bytes and matched git show 7fcff27 (${EXPECTED_SHA})`);
}

// Part 2 — a byte-flipped copy in a temp dir must fail, naming both hashes.
{
  const tmp = mkdtempSync(join(tmpdir(), "plan-it-machine-pin-"));
  try {
    const original = readFileSync(PIN);
    const tampered = Buffer.from(original);
    // Flip one byte (safe: pick a byte that is a printable char so the file
    // stays a plausible "JSON-shaped" tamper, not just noise).
    tampered[10] = tampered[10] ^ 0xff;
    const tamperedPath = join(tmp, "machine.v3.7fcff27.json");
    writeFileSync(tamperedPath, tampered);

    const { pinHash, gitHash, match } = verifyPin(tamperedPath, "7fcff27:plugins/plan-it/skills/plan-it/machine.json");
    if (match) {
      console.error(`FAIL — a byte-flipped copy wrongly matched git show 7fcff27 (both hashed ${pinHash})`);
      failed = true;
    } else if (!pinHash || !gitHash) {
      console.error("FAIL — tamper check did not produce both hashes to name");
      failed = true;
    } else {
      console.log(`  ok — byte-flipped copy correctly failed: tampered=${pinHash} vs git=${gitHash}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (failed) {
  console.error("FAIL — machine-pin.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — machine-pin.mjs: T-V4B1-04 passes");
process.exit(0);
