#!/usr/bin/env node
/**
 * T-V4B5-08, T-V4B5-09 — the plugin dogfoods its own autonomous-draft
 * package (`tests/fixtures/v4/dogfood-project/`): every recorded step
 * resumes via `state --run dogfood`, `freeze --draft`/`freeze` accept the
 * draft and final CONTRACT headers, `handoff` (embedded glossary + mirror
 * `--require-html`) and standalone `mirror --dir --require-html` /
 * `glossary` all exit 0 against the real stamped twins, `archive dogfood`
 * moves the done run to `.plan-it/done/`, and `runs` shows it archived.
 *
 * Negative half: deleting GLOSSARY.md fails handoff (C-E10-02); flipping one
 * byte of KICKOFF.md fails handoff ESCALATED (C-E2-07) — not plain
 * MIRROR_STALE, because this fixture's `render.outputs[].sha256` is the
 * REAL on-disk hash of the twin (D-B9 failed-recovery escalation: a
 * re-render whose own output is already what's on disk, yet still stale
 * against the (byte-flipped) source, escalates rather than looping); and
 * setting `contract.version` to "1.0-draft" at the handoff step fails
 * `state` with "draft contract cannot hand off" (C-E7-04, G-13).
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const FIXTURE = join(ROOT, "tests/fixtures/v4/dogfood-project");
const STEPS_DIR = join(FIXTURE, ".plan-it/steps");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(args, opts = {}) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8", ...opts }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}
function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), "planit-dogfood-run-"));
  cpSync(join(FIXTURE, "delivery"), join(dir, "delivery"), { recursive: true });
  cpSync(join(FIXTURE, ".plan-it/steps"), join(dir, ".plan-it/steps"), { recursive: true });
  return dir;
}
function setStep(dir, name) {
  cpSync(join(STEPS_DIR, name), join(dir, ".plan-it/dogfood.state.json"));
}

// ---- positive: every recorded step resumes -------------------------------
const dir = freshCopy();
const stepFiles = readdirSync(STEPS_DIR).sort();
assert(stepFiles.length === 22, `expected 22 step files, found ${stepFiles.length}`);
for (const f of stepFiles) {
  setStep(dir, f);
  const expectedState = f.replace(/^\d+-/, "").replace(/\.state\.json$/, "");
  const r = run(["state", "--dir", dir, "--run", "dogfood"]);
  assert(r.code === 0, `expected exit 0 resuming ${f}, got ${r.code}:\n${r.out}`);
  assert(r.out.includes(`state: ${expectedState}`), `expected "state: ${expectedState}" resuming ${f}:\n${r.out}`);
}

// ---- positive: freeze --draft on the draft header, freeze on the final ---
{
  const r = run(["freeze", join(dir, "delivery/CONTRACT.draft.md"), "--draft", "--dir", dir, "--run", "dogfood"]);
  assert(r.code === 0, `expected exit 0 for freeze --draft on the draft header, got ${r.code}:\n${r.out}`);
}
{
  const r = run(["freeze", "--dir", dir, "--run", "dogfood"]);
  assert(r.code === 0, `expected exit 0 for freeze on the final header, got ${r.code}:\n${r.out}`);
}

// ---- positive: handoff (embedded glossary + mirror --require-html) -------
setStep(dir, "20-handoff.state.json");
{
  const r = run(["handoff", "--dir", dir, "--run", "dogfood"]);
  assert(r.code === 0, `expected exit 0 for handoff, got ${r.code}:\n${r.out}`);
}

// ---- positive: standalone mirror --dir --require-html, glossary ----------
{
  const r = run(["mirror", "--dir", join(dir, "delivery"), "--require-html"]);
  assert(r.code === 0, `expected exit 0 for mirror --dir --require-html, got ${r.code}:\n${r.out}`);
}
{
  const r = run(["glossary", join(dir, "delivery")]);
  assert(r.code === 0, `expected exit 0 for glossary, got ${r.code}:\n${r.out}`);
}

// ---- positive: archive dogfood -> .plan-it/done/, runs shows it ----------
setStep(dir, "21-done.state.json");
{
  const r = run(["archive", "dogfood", "--dir", dir]);
  assert(r.code === 0, `expected exit 0 for archive dogfood, got ${r.code}:\n${r.out}`);
  assert(existsSync(join(dir, ".plan-it/done/dogfood.state.json")), "expected .plan-it/done/dogfood.state.json to exist after archive");
  assert(!existsSync(join(dir, ".plan-it/dogfood.state.json")), "expected the source .plan-it/dogfood.state.json to be gone after archive");
}
{
  const r = run(["runs", "--dir", dir]);
  assert(r.code === 0, `expected exit 0 for runs, got ${r.code}:\n${r.out}`);
  assert(/dogfood \|.*\| yes/.test(r.out), `expected runs to show dogfood archived:\n${r.out}`);
  assert(r.out.includes("1 run(s) (1 archived)"), `expected the tally "1 run(s) (1 archived)":\n${r.out}`);
}

// ---- negative: GLOSSARY.md deleted -> handoff fails C-E10-02 -------------
{
  const neg = freshCopy();
  rmSync(join(neg, "delivery/GLOSSARY.md"));
  rmSync(join(neg, "delivery/GLOSSARY.html"));
  setStep(neg, "20-handoff.state.json");
  const r = run(["handoff", "--dir", neg, "--run", "dogfood"]);
  assert(r.code !== 0, `expected non-zero exit for handoff with GLOSSARY.md deleted, got 0:\n${r.out}`);
  assert(r.out.includes("C-E10-02"), `expected C-E10-02 named:\n${r.out}`);
  rmSync(neg, { recursive: true, force: true });
}

// ---- negative: one byte flipped in KICKOFF.md -> handoff fails ESCALATED -
{
  const neg = freshCopy();
  const kickoffPath = join(neg, "delivery/KICKOFF.md");
  const bytes = readFileSync(kickoffPath);
  bytes[0] = (bytes[0] + 1) % 256;
  writeFileSync(kickoffPath, bytes);
  setStep(neg, "20-handoff.state.json");
  const r = run(["handoff", "--dir", neg, "--run", "dogfood"]);
  assert(r.code !== 0, `expected non-zero exit for handoff with KICKOFF.md byte-flipped, got 0:\n${r.out}`);
  assert(r.out.includes("ESCALATED"), `expected ESCALATED (C-E2-07) — render.outputs[].sha256 is this fixture's real twin hash, so a still-stale twin after "re-render" escalates rather than reporting plain MIRROR_STALE:\n${r.out}`);
  rmSync(neg, { recursive: true, force: true });
}

// ---- negative: contract.version "1.0-draft" at handoff -> state refuses --
{
  const neg = freshCopy();
  const st = JSON.parse(readFileSync(join(STEPS_DIR, "20-handoff.state.json"), "utf8"));
  st.contract.version = "1.0-draft";
  writeFileSync(join(neg, ".plan-it/dogfood.state.json"), JSON.stringify(st, null, 2));
  const r = run(["state", "--dir", neg, "--run", "dogfood"]);
  assert(r.code !== 0, `expected non-zero exit for state with a draft contract at handoff, got 0:\n${r.out}`);
  assert(r.out.includes("draft contract cannot hand off"), `expected "draft contract cannot hand off":\n${r.out}`);
  rmSync(neg, { recursive: true, force: true });
}

rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error("FAIL — dogfood-run.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log(`OK — dogfood-run.mjs: T-V4B5-08, 09 pass (${stepFiles.length} steps resumed, freeze/handoff/mirror/glossary/archive/runs all exercised)`);
process.exit(0);
