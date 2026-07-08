#!/usr/bin/env node
/**
 * plan-it v2.0 Test Contract runner — the 20 binding cases from delivery/v2/PRD.md §7.
 * Zero deps. Exit 0 only when 100% pass.
 */
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { parseContractCases, mechanismGap } from "./v3/lib/contract-cases.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GC = join(ROOT, "scripts", "gate-check.mjs");
const FIX = join(ROOT, "tests", "fixtures");

const results = [];
function t(id, name, fn) {
  try {
    fn();
    results.push({ id, name, pass: true });
  } catch (e) {
    results.push({ id, name, pass: false, err: e.message });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function gc(args) {
  // returns {code, out}
  try {
    const out = execFileSync("node", [GC, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// ---------- E1: machine.json ----------
const machinePath = join(ROOT, "machine.json");
let machine;

t("T-E1-01", "machine.json parses as JSON", () => {
  machine = JSON.parse(readFileSync(machinePath, "utf8"));
});

const EXPECTED_STATES = [
  "intake", "dodLock", "scopeGate", "preGround", "discovery", "synthesis",
  "specAuthoring", "decisionGate", "coherencePass", "freezeGate",
  "backboneFreeze", "parallelPlanning", "verify", "handoff", "done",
];

t("T-E1-02", "all 15 pipeline states present; done is final", () => {
  const states = Object.keys(machine.states);
  for (const s of EXPECTED_STATES) assert(states.includes(s), `missing state ${s}`);
  assert(states.length === EXPECTED_STATES.length, `expected ${EXPECTED_STATES.length} states, got ${states.length}`);
  assert(machine.states.done.type === "final", "done is not final");
});

t("T-E1-03", "every guard maps to an existing gate-check subcommand", () => {
  const validChecks = new Set(["verify", "freeze", "handoff", "state"]);
  const guardsUsed = new Set();
  for (const node of Object.values(machine.states)) {
    for (const trans of Object.values(node.on ?? {})) {
      const tr = Array.isArray(trans) ? trans[0] : trans;
      if (tr.guard) guardsUsed.add(tr.guard);
    }
  }
  assert(guardsUsed.size > 0, "no guards found in machine");
  for (const g of guardsUsed) {
    const def = machine.meta?.guards?.[g];
    assert(def, `guard "${g}" has no meta.guards entry`);
    assert(validChecks.has(def.check), `guard "${g}" maps to unknown check "${def.check}"`);
  }
  // and the gate-check script actually implements each
  const src = readFileSync(GC, "utf8");
  for (const g of guardsUsed) {
    const check = machine.meta.guards[g].check;
    assert(new RegExp(`\\b${check}:\\s*cmd`, "i").test(src) || src.includes(`"${check}"`) || src.includes(`${check}: cmd`), `gate-check.mjs does not implement "${check}"`);
  }
});

t("T-E1-04", "no dangling transition targets; initial state exists", () => {
  const states = new Set(Object.keys(machine.states));
  assert(states.has(machine.initial), `initial "${machine.initial}" is not a state`);
  for (const [name, node] of Object.entries(machine.states)) {
    for (const [ev, trans] of Object.entries(node.on ?? {})) {
      const tr = Array.isArray(trans) ? trans[0] : trans;
      assert(states.has(tr.target), `state ${name} event ${ev} targets unknown "${tr.target}"`);
    }
  }
});

t("T-E1-05", "exactly 3 human gate states (G1, G2, G3)", () => {
  const gates = Object.values(machine.states)
    .filter((n) => n.meta?.gate)
    .map((n) => ({ gate: n.meta.gate, human: n.meta.human }));
  assert(gates.length === 3, `expected 3 gate states, got ${gates.length}`);
  const names = gates.map((g) => g.gate).sort();
  assert(JSON.stringify(names) === JSON.stringify(["G1", "G2", "G3"]), `gates are ${names}`);
  for (const g of gates) assert(g.human === true, `gate ${g.gate} not marked human`);
});

// ---------- E2: state subcommand ----------
t("T-E2-01", "valid state.json passes; prints state + next events", () => {
  const r = gc(["state", join(FIX, "state-valid.json"), machinePath]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  assert(r.out.includes("specAuthoring"), "did not print current state");
  assert(r.out.includes("SPECS_DRAFTED"), "did not print next event SPECS_DRAFTED");
});

t("T-E2-02", "unknown state value fails and is named", () => {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const bad = JSON.parse(readFileSync(join(FIX, "state-valid.json"), "utf8"));
  bad.state = "notAState";
  const p = join(dir, "state.json");
  writeFileSync(p, JSON.stringify(bad));
  const r = gc(["state", p, machinePath]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("notAState"), "error does not name the invalid state");
});

t("T-E2-03", "missing required key (gates) fails and is named", () => {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const bad = JSON.parse(readFileSync(join(FIX, "state-valid.json"), "utf8"));
  delete bad.gates;
  const p = join(dir, "state.json");
  writeFileSync(p, JSON.stringify(bad));
  const r = gc(["state", p, machinePath]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/gates/.test(r.out), "error does not name the missing key");
});

// ---------- E3: verify ----------
t("T-E3-01", "verify passes on existing non-empty files", () => {
  const r = gc(["verify", machinePath, GC]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-E3-02", "verify fails on a missing path and names it", () => {
  const r = gc(["verify", machinePath, join(ROOT, "does-not-exist.md")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("does-not-exist.md"), "missing path not named");
});

t("T-E3-03", "verify fails on an empty file and names it", () => {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const p = join(dir, "empty.md");
  writeFileSync(p, "   \n");
  const r = gc(["verify", p]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("empty.md"), "empty path not named");
});

// ---------- E3: freeze ----------
t("T-E3-04", "freeze passes on a well-formed frozen CONTRACT", () => {
  const r = gc(["freeze", join(FIX, "contract-good.md")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-E3-05", "freeze fails when the vN.N version header is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const text = readFileSync(join(FIX, "contract-good.md"), "utf8").replaceAll(/v\d+\.\d+/g, "");
  const p = join(dir, "contract.md");
  writeFileSync(p, text);
  const r = gc(["freeze", p]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/version/i.test(r.out), "error does not mention version");
});

t("T-E3-06", "freeze fails on a TBD placeholder and names it", () => {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const text = readFileSync(join(FIX, "contract-good.md"), "utf8") + "\n\n## 5. Hosting\n\nTBD after the infra decision.\n";
  const p = join(dir, "contract.md");
  writeFileSync(p, text);
  const r = gc(["freeze", p]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/TBD/.test(r.out), "error does not name the placeholder");
});

// ---------- E3: handoff ----------
t("T-E3-07", "handoff passes on a coherent delivery fixture", () => {
  const r = gc(["handoff", join(FIX, "handoff-good")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-E3-08", "handoff catches declared-vs-counted case mismatch", () => {
  const r = gc(["handoff", join(FIX, "handoff-bad-count")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/declares?\s+Count:\s*2|Count:\s*2.*3|declared|counted/i.test(r.out) && /2/.test(r.out) && /3/.test(r.out),
    `error does not report declared vs counted: ${r.out}`);
});

t("T-E3-09", "handoff catches an epic with no Test Contract block", () => {
  const r = gc(["handoff", join(FIX, "handoff-bad-noepic")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/E1/.test(r.out) && /no Test Contract/i.test(r.out), `error does not name the contract-less epic: ${r.out}`);
});

t("T-E3-11", "gate-check.mjs imports node: builtins only (zero npm deps)", () => {
  const src = readFileSync(GC, "utf8");
  for (const m of src.matchAll(/from\s+"([^"]+)"|import\("([^"]+)"\)|require\("([^"]+)"\)/g)) {
    const spec = m[1] ?? m[2] ?? m[3];
    assert(spec.startsWith("node:"), `non-builtin import: ${spec}`);
  }
});

// ---------- E6 (v2.1): planit-guard hook ----------
const GUARD = join(ROOT, "scripts", "hooks", "planit-guard.mjs");

function runGuard(hookInput) {
  const out = execFileSync("node", [GUARD], { encoding: "utf8", input: JSON.stringify(hookInput) });
  return out.trim();
}

function guardCwd(contractVersion) {
  const dir = mkdtempSync(join(tmpdir(), "planit-"));
  const state = JSON.parse(readFileSync(join(FIX, "state-valid.json"), "utf8"));
  state.contract.version = contractVersion;
  execSync(`mkdir -p "${join(dir, ".plan-it")}"`);
  writeFileSync(join(dir, ".plan-it", "state.json"), JSON.stringify(state));
  return dir;
}

t("T-E6-01", "guard denies PRD write while contract unfrozen, reason names freeze", () => {
  const cwd = guardCwd(null);
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "delivery/prds/prd-1-core.md") } });
  assert(out.includes('"permissionDecision":"deny"') || out.includes('"permissionDecision": "deny"'), `expected deny, got: ${out || "(allow)"}`);
  assert(/freeze/i.test(out), "reason does not mention freezing the contract");
});

t("T-E6-02", "guard allows PRD write once contract is frozen (v1.0)", () => {
  const cwd = guardCwd("1.0");
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "delivery/prds/prd-1-core.md") } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

t("T-E6-03", "guard allows non-deliverable writes with contract unfrozen", () => {
  const cwd = guardCwd(null);
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "docs/02-vision.md") } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

t("T-E6-04", "guard fails open when no .plan-it/state.json exists", () => {
  const cwd = mkdtempSync(join(tmpdir(), "planit-"));
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "prds/prd-1.md") } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

t("T-E6-05", "guard fails open on malformed state.json", () => {
  const cwd = mkdtempSync(join(tmpdir(), "planit-"));
  execSync(`mkdir -p "${join(cwd, ".plan-it")}"`);
  writeFileSync(join(cwd, ".plan-it", "state.json"), "{not json");
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "prds/prd-1.md") } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

// ---------- E4: doc checks ----------
t("T-E4-01", "SKILL.md wires the deterministic core + keeps attribution", () => {
  const text = readFileSync(join(ROOT, "SKILL.md"), "utf8");
  for (const needle of ["machine.json", ".plan-it/state.json", "gate-check", "model the confusing parts", "author: DevOtts"]) {
    assert(text.toLowerCase().includes(needle.toLowerCase()), `SKILL.md missing "${needle}"`);
  }
  assert(text.includes("_Authored by [DevOtts](https://github.com/DevOtts)._"), "footer attribution missing");
});

// ---------- E5: packaging ----------
t("T-E5-01", "plugin.json version is 2.1.0 and hooks.json is valid", () => {
  const pj = JSON.parse(readFileSync(join(ROOT, "plugins/plan-it/.claude-plugin/plugin.json"), "utf8"));
  assert(pj.version === "2.1.0", `version is ${pj.version}`);
  const hooks = JSON.parse(readFileSync(join(ROOT, "plugins/plan-it/hooks/hooks.json"), "utf8"));
  const pre = hooks.hooks?.PreToolUse;
  assert(Array.isArray(pre) && pre.length > 0, "no PreToolUse hooks declared");
  assert(pre[0].hooks[0].command.includes("${CLAUDE_PLUGIN_ROOT}"), "hook command not plugin-root-relative");
});

t("T-E5-02", "root and plugin copies are byte-identical", () => {
  const pairs = [
    ["SKILL.md", "plugins/plan-it/skills/plan-it/SKILL.md"],
    ["machine.json", "plugins/plan-it/skills/plan-it/machine.json"],
    ["scripts/gate-check.mjs", "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs"],
    ["references/formats.md", "plugins/plan-it/skills/plan-it/references/formats.md"],
    ["references/templates.md", "plugins/plan-it/skills/plan-it/references/templates.md"],
    ["references/playbooks.md", "plugins/plan-it/skills/plan-it/references/playbooks.md"],
    ["references/machine.md", "plugins/plan-it/skills/plan-it/references/machine.md"],
    ["scripts/hooks/planit-guard.mjs", "plugins/plan-it/scripts/hooks/planit-guard.mjs"],
  ];
  for (const [a, b] of pairs) {
    assert(existsSync(join(ROOT, b)), `missing plugin copy: ${b}`);
    const ba = readFileSync(join(ROOT, a));
    const bb = readFileSync(join(ROOT, b));
    assert(ba.equals(bb), `differs: ${a} vs ${b}`);
  }
});

// ---------- v3 (Wave 0+) ----------
// Binding cases are discovered from delivery/v3/CONTRACT.md's own "## Cases"
// table (COMPUTED, W5 — never a hand-copied list of the 26 enforcement rows)
// via the shared parser in tests/v3/lib/contract-cases.mjs — the same module
// tests/v3/fail-closed-sweep.mjs (C-META-01) uses, so there is exactly one
// parsing mechanism, not two. A row whose Wave-1 mechanism (fixture/script/
// verb/--dir support) doesn't exist yet is reported PENDING — never silently
// passed, and never counted as a v2-regression FAIL either. Once a squad's
// epic lands the missing piece, the very same row starts executing for real
// here with zero further edits to this file.
const v3Pending = [];
const v3Results = [];
for (const row of parseContractCases()) {
  if (row.id === "C-META-01") continue; // self — verified directly via `node tests/v3/fail-closed-sweep.mjs`
  const gap = mechanismGap(row);
  if (gap) {
    v3Pending.push({ id: row.id, reason: gap });
    continue;
  }
  try {
    const [bin, ...cmdArgs] = row.run.split(/\s+/);
    execFileSync(bin, cmdArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    // Mechanism exists but exited 0 against what should be a VIOLATING fixture.
    v3Results.push({ id: row.id, pass: false, err: `exited 0 against its violating fixture — fail-closed broken (run: ${row.run})` });
  } catch {
    v3Results.push({ id: row.id, pass: true });
  }
}

// ---------- report ----------
let passCount = 0;
for (const r of results) {
  if (r.pass) {
    passCount++;
    console.log(`PASS  ${r.id}  ${r.name}`);
  } else {
    console.log(`FAIL  ${r.id}  ${r.name}\n      ${r.err}`);
  }
}
console.log(`\n${passCount}/${results.length} passed`);

let v3FailCount = 0;
if (v3Pending.length > 0 || v3Results.length > 0) {
  console.log(`\n-- v3 (Wave 0+, from delivery/v3/CONTRACT.md's Cases table) --`);
  for (const p of v3Pending) console.log(`PEND  ${p.id}  ${p.reason}`);
  for (const r of v3Results) {
    if (r.pass) {
      console.log(`PASS  ${r.id}  fail-closed against its violating fixture`);
    } else {
      v3FailCount++;
      console.log(`FAIL  ${r.id}  ${r.err}`);
    }
  }
  const v3PassCount = v3Results.filter((r) => r.pass).length;
  console.log(`${v3PassCount}/${v3Results.length} v3 mechanism-ready cases fail-closed; ${v3Pending.length} pending Wave 1 mechanism(s) (not silently passed)`);
}

// v3 pending rows never block this harness's exit code (that is
// tests/v3/fail-closed-sweep.mjs's job, C-META-01) — only an actual
// regression (a landed mechanism that stops being fail-closed) does, same as
// any v2 T-E* failure.
process.exit(passCount === results.length && v3FailCount === 0 ? 0 : 1);
