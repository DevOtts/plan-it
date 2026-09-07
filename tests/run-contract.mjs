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
import { parseContractCases, parseAllContractCases, mechanismGap } from "./v3/lib/contract-cases.mjs";

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

// AMD-1 (2026-07-08, approved Fernando Ott — delivery/decisions.md:44,
// CONTRACT.md:45): the LIVE machine.json is an additive-only structural
// superset of the byte-pinned v2 regression copy
// tests/fixtures/v2/machine.v2.fc6abc8.json, verified by `gate-check
// machine-diff`. The exact-15 enumeration therefore binds against the
// byte-pinned baseline; the live machine must still carry every v2 state
// (additions only — no rename/removal).
const V2_BASELINE = join(ROOT, "tests", "fixtures", "v2", "machine.v2.fc6abc8.json");

t("T-E1-02", "all 15 pipeline states present; done is final (exact on the byte-pinned v2 baseline; live machine.json an additive superset per AMD-1)", () => {
  const base = JSON.parse(readFileSync(V2_BASELINE, "utf8"));
  const baseStates = Object.keys(base.states);
  for (const s of EXPECTED_STATES) assert(baseStates.includes(s), `missing state ${s} in v2 baseline`);
  assert(baseStates.length === EXPECTED_STATES.length, `expected ${EXPECTED_STATES.length} baseline states, got ${baseStates.length}`);
  assert(base.states.done.type === "final", "baseline done is not final");
  const states = Object.keys(machine.states);
  for (const s of EXPECTED_STATES) assert(states.includes(s), `live machine.json dropped v2 state ${s} — AMD-1 allows additions only`);
  assert(machine.states.done.type === "final", "done is not final");
});

t("T-E1-03", "every guard maps to an existing gate-check subcommand", () => {
  const validChecks = new Set(["verify", "freeze", "handoff", "state", "adversary"]);
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

// AMD-4 (delivery/decisions.md, ratified at PLAN-REVIEW, R11; executed here
// in V4B5): the "exactly 3 gate states" assertion binds to the byte-pinned
// v2 baseline, not the live 4.0.0 machine — v4 additively inserts G0
// (anamnesis) and G4 (planReview) alongside the original G1/G2/G3, so a
// live-machine exact-3 count would be a false regression. The live machine
// is instead checked for CONTAINING G1/G2/G3 and for every meta.gate state
// (5 in 4.0.0) carrying meta.human:true — the property AMD-4 actually cares
// about (every gate is a human gate) survives verbatim.
t("T-E1-05", "exactly 3 human gate states on the v2 baseline (G1, G2, G3); every live meta.gate state is human (AMD-4)", () => {
  const base = JSON.parse(readFileSync(V2_BASELINE, "utf8"));
  const baseGates = Object.values(base.states)
    .filter((n) => n.meta?.gate)
    .map((n) => ({ gate: n.meta.gate, human: n.meta.human }));
  assert(baseGates.length === 3, `expected 3 gate states on the v2 baseline, got ${baseGates.length}`);
  const baseNames = baseGates.map((g) => g.gate).sort();
  assert(JSON.stringify(baseNames) === JSON.stringify(["G1", "G2", "G3"]), `v2 baseline gates are ${baseNames}`);
  for (const g of baseGates) assert(g.human === true, `v2 baseline gate ${g.gate} not marked human`);

  const liveGates = Object.values(machine.states)
    .filter((n) => n.meta?.gate)
    .map((n) => ({ gate: n.meta.gate, human: n.meta.human }));
  const liveNames = new Set(liveGates.map((g) => g.gate));
  for (const g of ["G1", "G2", "G3"]) assert(liveNames.has(g), `live machine dropped baseline gate ${g}`);
  for (const g of liveGates) assert(g.human === true, `live gate ${g.gate} not marked human`);
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
t("T-E5-01", "plugin.json version is 3.0.1 and hooks.json is valid", () => {
  const pj = JSON.parse(readFileSync(join(ROOT, "plugins/plan-it/.claude-plugin/plugin.json"), "utf8"));
  assert(pj.version === "3.0.1", `version is ${pj.version}`);
  const hooks = JSON.parse(readFileSync(join(ROOT, "plugins/plan-it/hooks/hooks.json"), "utf8"));
  const pre = hooks.hooks?.PreToolUse;
  assert(Array.isArray(pre) && pre.length > 0, "no PreToolUse hooks declared");
  assert(pre[0].hooks[0].command.includes("${CLAUDE_PLUGIN_ROOT}"), "hook command not plugin-root-relative");
});

// AMD-5 (delivery/decisions.md; executed here in V4B5): 8 -> 11 pairs
// (SQ-A's renderer). COMPUTED from gate-check.mjs's own MIRROR_PAIRS source
// (adversarial-verify, T-V4B5-03) — never a second hand-typed list that can
// drift from the one gate-check mirror-check actually enforces.
export function parseMirrorPairsFromSource(gcSrc) {
  const m = gcSrc.match(/const MIRROR_PAIRS\s*=\s*\[([\s\S]*?)\n\];/);
  if (!m) return [];
  const pairs = [];
  for (const pm of m[1].matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)) pairs.push([pm[1], pm[2]]);
  return pairs;
}

t("T-E5-02", "root and plugin copies are byte-identical (11 pairs, AMD-5)", () => {
  const pairs = parseMirrorPairsFromSource(readFileSync(GC, "utf8"));
  assert(pairs.length === 11, `expected 11 mirror pairs (AMD-5), computed ${pairs.length}`);
  for (const [a, b] of pairs) {
    assert(existsSync(join(ROOT, b)), `missing plugin copy: ${b}`);
    const ba = readFileSync(join(ROOT, a));
    const bb = readFileSync(join(ROOT, b));
    assert(ba.equals(bb), `differs: ${a} vs ${b}`);
  }
});

// ---------- v3 Squad A (Epics A2-A4) — binding-table cases from
// delivery/v3/epics/epics-1-gatecheck-fd.md that are not enforcement rows in
// the frozen CONTRACT Cases table (positives + message-precision negatives).
const FIX3 = join(FIX, "v3");

t("T-V3-A2-01", "contract passes on the real frozen CONTRACT.md (positional form; W5 computed-tally smoke)", () => {
  const r = gc(["contract", join(ROOT, "delivery", "v3", "CONTRACT.md")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-V3-A2-02", "contract names C-W1-05 + the row ID on a missing run: cell", () => {
  const r = gc(["contract", "--dir", join(FIX3, "no-run-col")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/C-W1-05/.test(r.out) && /F-CASE-02/.test(r.out), `does not name C-W1-05 + F-CASE-02: ${r.out}`);
});

t("T-V3-A2-03", "contract --override-manual accepts a >30% manual share deliberately", () => {
  const r = gc(["contract", "--dir", join(FIX3, "manual-heavy"), "--override-manual"]);
  assert(r.code === 0, `expected exit 0 with override, got ${r.code}: ${r.out}`);
});

t("T-V3-A2-04", "contract tally-drift failure names both numbers (hand-typed 5 vs computed 2)", () => {
  const r = gc(["contract", "--dir", join(FIX3, "tally-drift")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(/C-W5-01/.test(r.out) && /\b5\b/.test(r.out) && /\b2\b/.test(r.out), `does not name both numbers: ${r.out}`);
});

t("T-A3-A1", "testconv exits 0 on a repo whose CLAUDE.md already has the block (receipt in state.json)", () => {
  const r = gc(["testconv", "--dir", join(FIX3, "conventions-present")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-A3-A2", "testconv exits 2 (needs-human-input) with the research→ask→REGISTER instruction when no block exists", () => {
  const r = gc(["testconv", "--dir", join(FIX3, "no-conventions")]);
  assert(r.code === 2, `expected exit 2, got ${r.code}: ${r.out}`);
  assert(/REGISTER/.test(r.out) && /research/i.test(r.out), `instruction does not name research→ask→REGISTER: ${r.out}`);
});

t("T-A3-A3", "state flags a stale test-conventions receipt (registered:true but block deleted)", () => {
  const r = gc(["state", join(FIX3, "conventions-stale", ".plan-it", "state.json")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/stale/i.test(r.out) && /re-verify, not silent pass/.test(r.out), `does not flag the stale receipt: ${r.out}`);
});

t("T-A3-A4", "testconv exits 0 on a declined-by-user receipt (FD-1 registers either way)", () => {
  const r = gc(["testconv", "--dir", join(FIX3, "conventions-declined")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-A4-01", "freeze --dir fails while casesReviewed !== true (C-W1-03)", () => {
  const r = gc(["freeze", "--dir", join(FIX3, "unreviewed")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/C-W1-03/.test(r.out) && /casesReviewed/.test(r.out), `does not name C-W1-03/casesReviewed: ${r.out}`);
});

t("T-A4-02", "reconcile flags an orphan PRD requirement and only the orphan (C-W5-02)", () => {
  const r = gc(["reconcile", "--dir", join(FIX3, "orphan-req")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/C-W5-02: requirement R-1\b/.test(r.out), `does not flag R-1: ${r.out}`);
  assert(!/C-W5-02: requirement R-2\b/.test(r.out), `covered R-2 falsely flagged: ${r.out}`);
});

t("T-A4-03", "reconcile flags an epic with zero contract cases (C-W5-03)", () => {
  const r = gc(["reconcile", "--dir", join(FIX3, "epic-no-cases")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/C-W5-03/.test(r.out) && /\bY1\b/.test(r.out), `does not name the zero-case epic Y1: ${r.out}`);
});

t("T-A4-B1", "state rejects G2 approved without TEST-CONTRACT-REVIEW.md on disk", () => {
  const r = gc(["state", join(FIX3, "no-review-file", ".plan-it", "state.json")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/B1 \(FD-2\)/.test(r.out), `does not name case B1: ${r.out}`);
});

t("T-A4-B2", "state rejects a review file lacking the Reviewed-by user-ack line", () => {
  const r = gc(["state", join(FIX3, "review-no-ack", ".plan-it", "state.json")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/B2 \(FD-2\)/.test(r.out) && /Reviewed-by/.test(r.out), `does not name case B2 / the ack grammar: ${r.out}`);
});

t("T-A4-B3", "reconcile flags a draft case bound nowhere and not dropped (B3), not the bound ones", () => {
  const r = gc(["reconcile", "--dir", join(FIX3, "draft-case-orphan")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/B3 \(FD-2\)/.test(r.out) && /\bZ9\b/.test(r.out), `does not flag orphan draft case Z9: ${r.out}`);
  assert(!/draft case A1\b/.test(r.out), `bound draft case A1 falsely flagged: ${r.out}`);
});

t("T-A4-04", "reconcile passes on a repo with nothing to flag (positive path)", () => {
  const r = gc(["reconcile", "--dir", join(FIX3, "conventions-present")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

// ---------- v3.1 enhancement wave (E1/E2 reach + strip fixes) ----------

t("T-W31-1a", "freeze strips a line-wrapped inline code span (E2) — wrapped <id> no longer false-fails", () => {
  const r = gc(["freeze", join(FIX3, "contract-wrapped-span.md")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-W31-1b", "freeze still catches a bare-prose placeholder (E2 fail-closed preserved)", () => {
  const r = gc(["freeze", join(FIX3, "contract-bare-placeholder.md")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/placeholder token "<id>"/.test(r.out), `does not name the bare <id> placeholder: ${r.out}`);
});

t("T-W31-2a", "positional freeze of a real-project delivery/CONTRACT.md now reaches the RUN-POLICY check (E1)", () => {
  const r = gc(["freeze", join(FIX3, "real-project-nopolicy", "delivery", "CONTRACT.md")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/RUN-POLICY/.test(r.out), `did not require RUN-POLICY on a v3-backed positional freeze: ${r.out}`);
});

t("T-W31-2b", "freeze --dir finds delivery/CONTRACT.md (not just the delivery/v3/ dogfood path)", () => {
  const r = gc(["freeze", "--dir", join(FIX3, "real-project-nopolicy")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(/RUN-POLICY/.test(r.out), `--dir did not resolve delivery/CONTRACT.md + apply the v3 check: ${r.out}`);
});

t("T-W31-2c", "positional freeze does NOT over-block a valid real-project contract (RUN-POLICY + casesReviewed)", () => {
  const r = gc(["freeze", join(FIX3, "real-project-good", "delivery", "CONTRACT.md")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

t("T-W31-2d", "v2 byte-identical: a freestanding contract with no run-state is never held to v3 RUN-POLICY", () => {
  // contract-good.md lives outside any delivery/ run root → resolveRunRoot === null → v2 mode.
  const r = gc(["freeze", join(FIX, "contract-good.md")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  assert(!/RUN-POLICY/.test(r.out) || /no placeholders/.test(r.out), `v2 contract wrongly held to RUN-POLICY: ${r.out}`);
});

// ---------- v3.2 adversarial-depth gate (D4 crown-jewel lever) ----------
// The `adversary` verb makes failure-mode DEPTH an exit code. It is conditional
// on a declared state machine: a linear/CRUD contract declares none and the
// gate is N/A (no over-reach). When a machine IS declared, every declared
// failure state must be an asserted case outcome, and each of the five cascade
// classes must be covered-or-waived — silent absence fails closed. These four
// fixtures pin the four outcomes: deep→PASS, thin→FAIL(names the gaps),
// linear→PASS(N/A), waived→PASS(escape hatch, waivers in decisions.md).
const ADV = (name) => join(FIX3, name);

t("T-ADV-01", "adversary PASSES a deep machine: every failure state asserted, all 5 cascade classes covered", () => {
  const r = gc(["adversary", ADV("adversary-deep")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  assert(/failure-mode depth/.test(r.out), `no success line: ${r.out}`);
  for (const c of ["partial-failure", "rollback/compensation", "failed-recovery→escalation", "recovery/resume", "adversarial-verify"]) {
    assert(new RegExp(`cascade "${c.replace(/[/()[\]]/g, "\\$&")}": COVERED`).test(r.out), `class ${c} not reported COVERED: ${r.out}`);
  }
});

t("T-ADV-02", "adversary FAILS a thin v3-arm-like machine, naming exactly the three missing cascade classes", () => {
  const r = gc(["adversary", ADV("adversary-thin")]);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  for (const gap of ["partial-failure", "rollback/compensation", "failed-recovery→escalation"]) {
    assert(new RegExp(`D-B3: cascade class "${gap.replace(/[/()[\]]/g, "\\$&")}"`).test(r.out), `did not flag missing class ${gap}: ${r.out}`);
  }
  // the two honest classes it DOES cover must not be flagged as gaps
  assert(!/D-B3: cascade class "recovery\/resume"/.test(r.out), `falsely flagged recovery/resume: ${r.out}`);
  assert(!/D-B3: cascade class "adversarial-verify"/.test(r.out), `falsely flagged adversarial-verify: ${r.out}`);
});

t("T-ADV-03", "adversary is N/A (PASS) on a genuinely linear/CRUD contract — no over-reach", () => {
  const r = gc(["adversary", ADV("adversary-linear")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  assert(/N\/A/.test(r.out) && /linear\/CRUD/.test(r.out), `did not report N/A for a machine-less contract: ${r.out}`);
});

t("T-ADV-04", "adversary PASSES via explicit waivers (v2 CB-1 pattern) recorded in decisions.md", () => {
  const r = gc(["adversary", ADV("adversary-waived")]);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  for (const w of ["partial-failure", "rollback/compensation", "failed-recovery→escalation"]) {
    assert(new RegExp(`cascade "${w.replace(/[/()[\]]/g, "\\$&")}": WAIVED`).test(r.out), `class ${w} not reported WAIVED: ${r.out}`);
  }
});

// ---------- v3/v4 sections (D-B13, C-E9-10) ----------
// Binding cases are discovered from each CONTRACT's own "## Cases" table
// (COMPUTED, W5 — never a hand-copied list) via parseAllContractCases(), the
// same shared parser tests/v3/fail-closed-sweep.mjs (C-META-01) uses for its
// v3-only default (parseContractCases()) — one parsing mechanism, not two.
//
// POLARITY (AMD-5): a `run:` cell is POSITIVE (a harness script proving its
// own mechanism — exit 0 = PASS, non-zero = FAIL) when it starts with
// `node tests/` or its case description contains "(positive)"; every other
// `gate-check.mjs <verb> …` row is NEGATIVE (v3-style: it must exit non-zero
// against its named violating fixture — exit 0 = FAIL, "fail-closed
// broken"). `manual:` rows are skipped and listed separately. A row whose
// Wave-1 mechanism (fixture/script/verb/--dir support) doesn't exist yet is
// PENDING — never silently passed, never counted as a regression FAIL.
// Polarity is source-aware, not just shape-aware: EVERY v3 row is negative
// by 3.0.1 design (all 26 rows name a violating fixture), even the ones
// whose run: happens to be a `node tests/v3/*.mjs` wrapper script (e.g. the
// inverted-exit-convention checks like machine-shape.mjs) — those scripts
// are still testing a violating condition, not asserting a positive truth.
// v4 rows are different: several reuse existing v3-authored validators as
// genuinely POSITIVE checks (C-E11-01 -> tests/v3/version-triple-match.mjs,
// C-E11-02 -> tests/v3/changelog-shape.mjs, C-E9-09 ->
// tests/v3/mirror-wired-into-release.mjs — corrections item 5, prd-b-core.md
// §9), alongside the new `node tests/v4/core/*.mjs` harness scripts. A row
// tagged "(positive)" in its description is always positive, in either CONTRACT.
export function isPositiveRow(row) {
  if (/\(positive\)/i.test(row.desc ?? "")) return true;
  if (row.source && /\bdelivery\/v3\/CONTRACT\.md$/.test(row.source)) return false;
  return /^node\s+tests\//.test(row.run);
}

export function runContractSection(rows, { skipIds = new Set(), cwd = ROOT } = {}) {
  const pending = [];
  const manual = [];
  const outcomes = [];
  for (const row of rows) {
    if (skipIds.has(row.id)) continue;
    if (row.run.startsWith("manual:")) {
      manual.push(row);
      continue;
    }
    const gap = mechanismGap(row);
    if (gap) {
      pending.push({ id: row.id, reason: gap });
      continue;
    }
    const positive = isPositiveRow(row);
    const [bin, ...cmdArgs] = row.run.split(/\s+/);
    let exitedZero = true;
    let out = "";
    try {
      out = execFileSync(bin, cmdArgs, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      exitedZero = false;
      out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    }
    if (positive) {
      outcomes.push(
        exitedZero
          ? { id: row.id, pass: true }
          : { id: row.id, pass: false, err: `positive harness script exited non-zero (run: ${row.run}):\n      ${out}` }
      );
    } else {
      outcomes.push(
        exitedZero
          ? { id: row.id, pass: false, err: `exited 0 against its violating fixture — fail-closed broken (run: ${row.run})` }
          : { id: row.id, pass: true }
      );
    }
  }
  return { pending, manual, outcomes };
}

function printSection(label, { pending, manual, outcomes }) {
  if (pending.length === 0 && manual.length === 0 && outcomes.length === 0) return { failCount: 0, printed: false };
  console.log(`\n-- ${label} --`);
  for (const p of pending) console.log(`PEND    ${p.id}  ${p.reason}`);
  for (const m of manual) console.log(`MANUAL  ${m.id}  ${m.run}`);
  let failCount = 0;
  for (const o of outcomes) {
    if (o.pass) {
      console.log(`PASS    ${o.id}`);
    } else {
      failCount++;
      console.log(`FAIL    ${o.id}  ${o.err}`);
    }
  }
  const passCount = outcomes.filter((o) => o.pass).length;
  console.log(
    `${passCount}/${outcomes.length} mechanism-ready cases correct; ${pending.length} pending mechanism(s); ${manual.length} manual (not silently passed)`
  );
  return { failCount, printed: true };
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

const V3_CONTRACT_PATH = join(ROOT, "delivery", "v3", "CONTRACT.md");
const V4_CONTRACT_PATH = join(ROOT, "delivery", "v4", "CONTRACT.md");
const allRows = parseAllContractCases();

const v3Section = runContractSection(
  allRows.filter((r) => r.source === V3_CONTRACT_PATH),
  { skipIds: new Set(["C-META-01"]) } // self — verified directly via `node tests/v3/fail-closed-sweep.mjs`
);
const v4Section = runContractSection(
  allRows.filter((r) => r.source === V4_CONTRACT_PATH),
  // C-E9-10's own run: (tests/v4/core/contract-cases-v4.mjs) shells out to
  // THIS file to assert the "-- v4 --" section header — executing it from
  // inside this file's own v4 section would recurse (each nested run
  // re-executes the v4 section, which re-invokes contract-cases-v4.mjs,
  // ad infinitum). Same self-reference class as C-META-01 above — skipped
  // here, verified directly via `node tests/v4/core/contract-cases-v4.mjs`.
  { skipIds: new Set(["C-E9-10"]) }
);

const v3Report = printSection("v3 (Wave 0+, from delivery/v3/CONTRACT.md's Cases table)", v3Section);
const v4Report = printSection("v4 (from delivery/v4/CONTRACT.md's Cases table)", v4Section);
const v3FailCount = v3Report.failCount;
const v4FailCount = v4Report.failCount;

// Pending rows never block this harness's exit code (that is
// tests/v3/fail-closed-sweep.mjs's job for v3, C-META-01) — only an actual
// regression (a landed mechanism that fails its polarity check) does, same
// as any v2 T-E* failure. D-B13: the v4 section is fully wired now — a v4
// FAIL blocks exit 0 exactly like a v3 one.
process.exit(passCount === results.length && v3FailCount === 0 && v4FailCount === 0 ? 0 : 1);
