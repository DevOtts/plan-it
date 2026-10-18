#!/usr/bin/env node
// review-checkpoints: decide how many review-it checkpoints an implementation
// gets, and where each one sits, from its size, complexity and importance.
// Policy text: do-it docs/implementation/do-it-next/CHECKPOINT-POLICY.md (v1).
// plan-it runs it at G4 and writes the result into plan/READINESS.json under
// `review_checkpoints`; build-it reads it back (build-it scripts/checkpoints/).
// Zero dependencies.
//
// Usage:
//   review-checkpoints.mjs decide --inputs <inputs.json> [--status <status.json>]
//                                 [--evidence-dir <dir>] [--write <READINESS.json>]
//   review-checkpoints.mjs check <READINESS.json>
// Exit: 0 ok · 1 invalid input or block · 2 file missing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "review-checkpoints/1";
export const POLICY = "CHECKPOINT-POLICY v1";
export const COMPLEXITY_FLAGS = ["cross_cutting", "owner_gated", "new_surface"];
export const IMPORTANCE_FLAGS = ["data", "money", "security", "prod_facing"];
export const KINDS = ["phase", "wave", "adversarial", "pre-merge", "pre-release"];
// What a checkpoint holds until its verdict is PASS. "dependents": the start of
// any slice that depends (through depends_on) on covered work. "promotion":
// promoting covered work beyond the integration environment. "merge": merge to
// main. "release": tag, publish or deploy. Nothing else waits on a checkpoint.
export const GATES = ["dependents", "promotion", "merge", "release"];
const ALL_FLAGS = [...COMPLEXITY_FLAGS, ...IMPORTANCE_FLAGS];

export class InputError extends Error {}

// Size points from the task count, +1 for a wide plan (4+ epics), capped at 3.
export function sizePoints(tasks, epics) {
  let p = tasks <= 3 ? 0 : tasks <= 10 ? 1 : tasks <= 25 ? 2 : 3;
  if (epics >= 4) p += 1;
  return Math.min(p, 3);
}

export function levelOf(tasks, score) {
  if (tasks === 0) return "none";
  if (score <= 1) return "light";
  if (score <= 3) return "standard";
  if (score <= 5) return "heightened";
  return "full";
}

function normWaves(waves, tasks) {
  // waves: integer count, or [{id, tasks:[ids]}]. A plan with tasks but no
  // declared waves is one wave.
  if (Array.isArray(waves)) {
    return waves.map((w, i) => ({
      id: String(w && w.id ? w.id : `W${i + 1}`),
      tasks: Array.isArray(w && w.tasks) ? w.tasks.map((t) => String(typeof t === "object" && t ? t.id : t)) : [],
    }));
  }
  let n = Number.isInteger(waves) && waves > 0 ? waves : 0;
  if (n === 0 && tasks > 0) n = 1;
  return Array.from({ length: n }, (_, i) => ({ id: `W${i + 1}`, tasks: [] }));
}

function normFlags(flags) {
  const out = {};
  for (const k of Object.keys(flags || {})) {
    if (!ALL_FLAGS.includes(k)) throw new InputError(`unknown flag "${k}" (known: ${ALL_FLAGS.join(", ")})`);
  }
  for (const k of ALL_FLAGS) {
    const v = flags ? flags[k] : undefined;
    if (v === undefined || v === null || v === false) { out[k] = null; continue; }
    if (v === true) throw new InputError(`flag "${k}" is set without a reason; give a one-line reason string`);
    if (typeof v !== "string" || v.trim() === "") throw new InputError(`flag "${k}" must be a non-empty reason string, false or null`);
    out[k] = v.trim();
  }
  return out;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Pure: the whole policy. input = { tasks, epics, waves, flags,
// interface_lock_after?, evidence_dir? }. tasks is a count or an id list.
export function decideCheckpoints(input) {
  if (!input || typeof input !== "object") throw new InputError("inputs must be an object");
  const taskIds = Array.isArray(input.tasks) ? input.tasks.map(String) : null;
  const tasks = taskIds ? taskIds.length : input.tasks;
  if (!Number.isInteger(tasks) || tasks < 0) throw new InputError("tasks must be a non-negative integer or a list of task ids");
  const epics = input.epics === undefined ? 1 : input.epics;
  if (!Number.isInteger(epics) || epics < 0) throw new InputError("epics must be a non-negative integer");
  const flags = normFlags(input.flags);
  const waves = normWaves(input.waves, tasks);
  const evidenceDir = (input.evidence_dir || "plan/reviews").replace(/\/+$/, "");

  const size = sizePoints(tasks, epics);
  const complexity = COMPLEXITY_FLAGS.filter((k) => flags[k]).length;
  const importance = IMPORTANCE_FLAGS.filter((k) => flags[k]).length;
  const total = size + complexity + importance;
  const level = levelOf(tasks, total);

  const cps = [];
  // Run order: wave-boundary checkpoints by wave, then the closing reviews.
  const order = (c) => {
    if (c.kind === "pre-merge") return 2e6;
    if (c.kind === "pre-release") return 3e6;
    const i = c.ref ? waves.findIndex((w) => w.id === c.ref) : -1;
    if (i >= 0) return i;
    return c.kind === "phase" ? 0.5 : 1e6;
  };
  const add = (kind, at, review, blocks, ref, gates, covers) => cps.push({ kind, at, review, blocks, ref, gates, covers });
  const allWaves = waves.map((w) => w.id);
  const waveHold = (id) => `slices that depend on ${id} work, and promotion of ${id} work`;

  if (tasks > 0) {
    // Mid-build checkpoints.
    const everyWave = total >= 4 || size === 3;
    const someMid = total >= 2 || size === 3;
    if (someMid && waves.length >= 2) {
      const upto = everyWave ? waves.length - 1 : 1;
      for (let i = 0; i < upto; i++) {
        add("wave", `after ${waves[i].id}`, "contract cases of the finished waves, on the merged tree", waveHold(waves[i].id), waves[i].id, ["dependents", "promotion"], [waves[i].id]);
      }
    } else if (someMid && waves.length === 1 && tasks >= 4) {
      const ids = taskIds || waves[0].tasks;
      let after = input.interface_lock_after ? String(input.interface_lock_after) : null;
      if (!after) {
        const half = Math.ceil(tasks / 2);
        after = ids.length >= half ? ids[half - 1] : `task ${half} of ${tasks}`;
      }
      // Covered: the tasks up to the lock. With only a count there are no ids to
      // name, so covers is left out and build-it's gate says it cannot tell.
      const at = ids.indexOf(after);
      const covers = at >= 0 ? ids.slice(0, at + 1) : input.interface_lock_after ? [after] : undefined;
      add("phase", `after ${after}`, "contract cases of the finished tasks, plus the interface the rest builds on", `tasks that depend on the work up to ${after}, and promotion of that work`, after, ["dependents", "promotion"], covers);
    }
    // Adversarial pass (the ST-08 convention): try to get a fake pass through.
    // When the plan already has an adversarial wave, its boundary is the
    // adversarial checkpoint (one review, not two).
    if (flags.security || flags.money || (flags.data && flags.cross_cutting) || total >= 6) {
      const advReview = "adversarial: try to get a false pass through every gate and writer";
      const aw = input.adversarial_wave ? String(input.adversarial_wave) : null;
      const awIdx = aw ? waves.findIndex((w) => w.id === aw) : -1;
      if (aw && awIdx < 0) throw new InputError(`adversarial_wave "${aw}" is not one of the waves`);
      const existing = awIdx >= 0 ? cps.find((c) => c.kind === "wave" && c.ref === aw) : null;
      const advHold = `slices that depend on ${aw} work`;
      if (existing) Object.assign(existing, { kind: "adversarial", review: advReview, blocks: advHold, gates: ["dependents"] });
      else if (awIdx >= 0 && awIdx < waves.length - 1) add("adversarial", `after ${aw}`, advReview, advHold, aw, ["dependents"], [aw]);
      else add("adversarial", aw ? `after ${aw}, before pre-merge` : "after the last wave, before pre-merge", advReview, "merge to main", null, ["merge"], allWaves);
      cps.sort((a, b) => order(a) - order(b));
    }
    add("pre-merge", "before merge to main", "the whole Test Contract on the integrated branch", "merge to main", null, ["merge"], allWaves);
    if (flags.prod_facing) {
      add("pre-release", "after merge, before tag, publish or deploy", "deploy-verify plus the [REAL] cases on the released artifact", "tag, publish or deploy", null, ["release"], allWaves);
    }
  }

  const checkpoints = cps.map((c, i) => {
    const id = `CP-${String(i + 1).padStart(2, "0")}`;
    const name = c.ref ? `${id}-${c.kind}-${slug(c.ref)}` : `${id}-${c.kind}`;
    const cp = { id, kind: c.kind, at: c.at, review: c.review, blocks: c.blocks, gates: c.gates };
    if (c.covers) cp.covers = c.covers;
    cp.evidence = `${evidenceDir}/${name}.md`;
    return cp;
  });

  return {
    schema: SCHEMA,
    policy: POLICY,
    inputs: { tasks, epics, waves: waves.map((w) => w.id), flags },
    score: { size, complexity, importance, total },
    level,
    count: checkpoints.length,
    checkpoints,
  };
}

// Structural check of an emitted block (also used by build-it's reader).
export function checkBlock(block) {
  const errs = [];
  if (!block || typeof block !== "object") return ["review_checkpoints must be an object"];
  if (block.schema !== SCHEMA) errs.push(`schema must be "${SCHEMA}", got ${JSON.stringify(block.schema)}`);
  if (!Array.isArray(block.checkpoints)) return [...errs, "checkpoints must be an array"];
  if (block.count !== block.checkpoints.length) errs.push(`count ${JSON.stringify(block.count)} does not match ${block.checkpoints.length} checkpoint(s)`);
  block.checkpoints.forEach((c, i) => {
    const want = `CP-${String(i + 1).padStart(2, "0")}`;
    if (!c || c.id !== want) errs.push(`checkpoints[${i}].id must be ${want}`);
    if (!c || !KINDS.includes(c.kind)) errs.push(`checkpoints[${i}].kind must be one of ${KINDS.join(", ")}`);
    if (!c || typeof c.evidence !== "string" || c.evidence.trim() === "") errs.push(`checkpoints[${i}].evidence must be a path`);
    // gates and covers are optional (plans before they existed have neither).
    if (c && c.gates !== undefined && (!Array.isArray(c.gates) || !c.gates.length || c.gates.some((g) => !GATES.includes(g)))) errs.push(`checkpoints[${i}].gates must be a non-empty subset of ${GATES.join(", ")}`);
    if (c && c.covers !== undefined && (!Array.isArray(c.covers) || c.covers.some((x) => typeof x !== "string" || !x.trim()))) errs.push(`checkpoints[${i}].covers must be a list of slice or wave ids`);
  });
  const tasks = block.inputs && block.inputs.tasks;
  if (tasks > 0 && !block.checkpoints.some((c) => c && c.kind === "pre-merge")) errs.push("a plan with tasks must have a pre-merge checkpoint");
  return errs;
}

// Tag each READINESS slice with the wave whose task list names it, so build-it's
// gate can resolve a wave id in `covers`. Returns the ids left without a wave.
export function tagSliceWaves(doc, waves) {
  if (!Array.isArray(doc.slices)) return [];
  const waveOf = new Map();
  for (const w of Array.isArray(waves) ? waves : []) {
    for (const t of Array.isArray(w && w.tasks) ? w.tasks : []) waveOf.set(String(typeof t === "object" && t ? t.id : t), String(w.id));
  }
  const untagged = [];
  for (const s of doc.slices) {
    if (!s || s.id === undefined) continue;
    const w = waveOf.get(String(s.id));
    if (w) s.wave = w;
    else if (typeof s.wave !== "string") untagged.push(String(s.id));
  }
  return untagged;
}

// Derive tasks and waves from a status.json (schema 1) when one exists.
export function inputsFromStatus(status) {
  const waves = Array.isArray(status && status.waves) ? status.waves : [];
  const ids = waves.flatMap((w) => (Array.isArray(w.tasks) ? w.tasks.map((t) => String(t.id)) : []));
  return { tasks: ids, waves: waves.map((w) => ({ id: w.id, tasks: (w.tasks || []).map((t) => t.id) })) };
}

function writeAtomic(file, text) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

function arg(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

export function main(argv) {
  const [cmd, ...args] = argv;
  const out = (s) => process.stdout.write(s + "\n");
  const err = (s) => process.stderr.write(s + "\n");
  try {
    if (cmd === "decide") {
      const inputsFile = arg(args, "--inputs");
      if (!inputsFile) { err("decide: --inputs <file> is required"); return 1; }
      if (!fs.existsSync(inputsFile)) { err(`decide: ${inputsFile} not found`); return 2; }
      const input = JSON.parse(fs.readFileSync(inputsFile, "utf8"));
      const statusFile = arg(args, "--status");
      if (statusFile) {
        if (!fs.existsSync(statusFile)) { err(`decide: ${statusFile} not found`); return 2; }
        Object.assign(input, inputsFromStatus(JSON.parse(fs.readFileSync(statusFile, "utf8"))));
      }
      if (arg(args, "--evidence-dir")) input.evidence_dir = arg(args, "--evidence-dir");
      const block = decideCheckpoints(input);
      const target = arg(args, "--write");
      if (target) {
        if (!fs.existsSync(target)) { err(`decide: ${target} not found; write READINESS.json first (G4)`); return 2; }
        const doc = JSON.parse(fs.readFileSync(target, "utf8"));
        doc.review_checkpoints = block;
        const untagged = tagSliceWaves(doc, input.waves);
        if (untagged.length) err(`warning: ${untagged.length} slice(s) carry no wave (no wave task list names them); build-it's gate cannot resolve a wave id in covers for slices that depend on them: ${untagged.join(", ")}`);
        writeAtomic(target, JSON.stringify(doc, null, 2) + "\n");
        err(`wrote review_checkpoints (${block.count}, level ${block.level}) into ${target}`);
      }
      out(JSON.stringify(block, null, 2));
      return 0;
    }
    if (cmd === "check") {
      const file = args[0];
      if (!file) { err("check: usage: check <READINESS.json>"); return 1; }
      if (!fs.existsSync(file)) { err(`check: ${file} not found`); return 2; }
      const doc = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!doc.review_checkpoints) { err(`check: ${file} has no review_checkpoints block`); return 1; }
      const errs = checkBlock(doc.review_checkpoints);
      for (const e of errs) err(`check: ${e}`);
      if (errs.length) return 1;
      out(`PASS review_checkpoints: ${doc.review_checkpoints.count} checkpoint(s), level ${doc.review_checkpoints.level}`);
      return 0;
    }
    err("usage: review-checkpoints.mjs <decide|check> ...");
    return 1;
  } catch (e) {
    if (e instanceof InputError || e instanceof SyntaxError) { err(`${cmd}: ${e.message}`); return 1; }
    throw e;
  }
}

function isMain() {
  if (!process.argv[1]) return false;
  try { return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
}
if (isMain()) process.exit(main(process.argv.slice(2)));
