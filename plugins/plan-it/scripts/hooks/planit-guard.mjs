#!/usr/bin/env node
/**
 * planit-guard — v2.1 hard enforcement of Rule 1 (Claude Code PreToolUse hook).
 *
 * Blocks Write/Edit calls that create or modify PRD/epic deliverables while the
 * active plan-it run's CONTRACT is not frozen (.plan-it/state.json has
 * contract.version == null). This turns "no frozen CONTRACT → no parallel
 * planning" from a skill instruction into something the harness refuses.
 *
 * Protocol: hook JSON on stdin; deny = JSON on stdout with permissionDecision
 * "deny" (the model sees the reason); allow = no output, exit 0.
 *
 * FAIL-OPEN BY DESIGN: any error, missing state file, or non-plan-it project
 * → allow. This hook must never break unrelated work.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DELIVERABLE_RE = /(^|[\\/])(prds?|epics?)[\\/]|(^|[\\/])(prd|epics?)-[^\\/]*\.md$/i;
// A bare filename match for either shape: "state.json" (generic) or
// "<slug>.state.json" (named). NOTE: "state.json".endsWith(".state.json") is
// FALSE (the generic name is one character shorter than the suffix) — a
// naive endsWith(".state.json") filter silently drops the generic file.
const STATE_FILE_NAME_RE = /^(?:[a-z0-9][a-z0-9-]*\.)?state\.json$/;

function allow() {
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const toolName = input.tool_name ?? "";
  if (!/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(toolName)) allow();

  const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? "";
  if (!filePath || !DELIVERABLE_RE.test(filePath)) allow();

  // v3 W4 (C-W4-01) — status-vocabulary hard guard, additive to the freeze
  // check below. A deliverable write claiming "done"/"complete"/"✅" without a
  // VERIFIED token + case reference on the same or an adjacent line is denied.
  // Only recognized tool_input content shapes are scanned; anything else falls
  // through untouched (and the enclosing try/catch keeps the hook fail-open).
  const VOCAB = "NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED";
  const ti = input.tool_input ?? {};
  const contents = [];
  if (typeof ti.content === "string") contents.push(ti.content); // Write
  if (typeof ti.new_string === "string") contents.push(ti.new_string); // Edit
  if (typeof ti.new_str === "string") contents.push(ti.new_str); // Edit (alt key)
  if (typeof ti.new_source === "string") contents.push(ti.new_source); // NotebookEdit
  if (Array.isArray(ti.edits)) {
    for (const e of ti.edits) if (e && typeof e.new_string === "string") contents.push(e.new_string); // MultiEdit
  }
  for (const raw of contents) {
    // Mention vs use: fenced blocks (blanked line-preservingly) and inline
    // code spans are being *described*, not claimed — same rationale as
    // gate-check.mjs's stripCode, ported here (separate file/process).
    const noFences = raw.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "));
    const rawLines = noFences.split("\n");
    const scanLines = rawLines.map((l) => l.replace(/`[^`\n]*`/g, " "));
    for (let i = 0; i < scanLines.length; i++) {
      const hit = scanLines[i].match(/\b(done|complete)\b|✅/i);
      if (!hit) continue;
      const window = rawLines.slice(Math.max(0, i - 1), i + 2).join("\n");
      if (/\bVERIFIED\b/.test(window) && /\b[A-Z][A-Z0-9-]*-\d+\b/.test(window)) continue;
      deny(
        `plan-it W4 (hard-enforced): "${filePath}" is a delivery artifact and this write claims ` +
          `"${hit[0]}" (content line ${i + 1}) without a VERIFIED token + case reference (e.g. T-E1-01) ` +
          `on the same or an adjacent line. The status vocabulary is closed: ${VOCAB}. ` +
          `Claim VERIFIED only next to a case ID and its run output; otherwise write IMPLEMENTED-NOT-VERIFIED.`
      );
    }
  }

  // v3 W3 (C-W3-02) — no hardcoded model IDs in plan artifacts. Tiers resolve
  // to concrete models at execution time; a literal `claude-<...>` model ID
  // baked into a deliverable is a guard violation. Mentions inside fenced
  // blocks / inline code are being described, not baked in — same mention-vs-use
  // treatment as W4 above (regex verbatim from CONTRACT.md C-W3-02).
  const MODEL_ID_RE = /claude-[a-z0-9-]+/;
  for (const raw of contents) {
    const noFences = raw.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "));
    const scanLines = noFences.split("\n").map((l) => l.replace(/`[^`\n]*`/g, " "));
    for (let i = 0; i < scanLines.length; i++) {
      const hit = scanLines[i].match(MODEL_ID_RE);
      if (!hit) continue;
      deny(
        `plan-it W3 (hard-enforced): "${filePath}" is a delivery artifact and this write ` +
          `hardcodes model ID "${hit[0]}" (content line ${i + 1}). Tiers resolve to concrete ` +
          `models at execution time — reference a tier (top/mid/low) or a build-it scaffold ` +
          `pointer, never a literal claude-* model ID.`
      );
    }
  }

  const cwd = input.cwd ?? process.cwd();

  // v4 D-B7: resolve the GOVERNING run by longest run.deliveryRoot path-prefix
  // across every named state file in .plan-it/ (excluding archived
  // .plan-it/done/, a plain non-recursive readdir never descends there
  // anyway); falls back to the legacy docs/implementation/<name>/ match, then
  // the generic file, then allow. Fixes: a write under a named run's
  // deliveryRoot was denied by an unrelated unfrozen run's generic file
  // (docs/implementation/open-sessions-closeout/backlog/
  // plan-it-guard-hook-wrong-state-file-on-named-runs.md) — the resolution is
  // asserted identical in BOTH shipped copies of this file (adversarial-verify).
  function resolveGoverningStateFile() {
    const planItDir = join(cwd, ".plan-it");
    const absFile = resolve(cwd, filePath);
    let best = null;
    let bestLen = -1;
    let entries;
    try {
      entries = readdirSync(planItDir).filter((e) => STATE_FILE_NAME_RE.test(e));
    } catch {
      entries = [];
    }
    for (const e of entries) {
      const p = join(planItDir, e);
      let st;
      try {
        st = JSON.parse(readFileSync(p, "utf8"));
      } catch {
        continue; // unparseable named file — skip it, never crash the resolution
      }
      const dr = st?.run?.deliveryRoot;
      if (!dr) continue;
      const prefix = resolve(cwd, dr);
      const prefixWithSlash = prefix.endsWith("/") ? prefix : `${prefix}/`;
      if ((absFile === prefix || absFile.startsWith(prefixWithSlash)) && prefix.length > bestLen) {
        best = p;
        bestLen = prefix.length;
      }
    }
    if (best) return best;

    const programMatch = filePath.match(/(^|[\\/])docs[\\/]implementation[\\/]([^\\/]+)[\\/]/i);
    if (programMatch) {
      const namedStatePath = join(cwd, ".plan-it", `${programMatch[2]}.state.json`);
      if (existsSync(namedStatePath)) return namedStatePath;
    }

    const genericPath = join(cwd, ".plan-it", "state.json");
    return existsSync(genericPath) ? genericPath : null;
  }

  const statePath = resolveGoverningStateFile();
  if (!statePath) allow();

  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const version = state?.contract?.version ?? null;
  if (version !== null && version !== "") allow();

  deny(
    `plan-it Rule 1 (hard-enforced): "${filePath}" looks like a PRD/epic deliverable, ` +
      `but the governing run's CONTRACT is not frozen (${statePath} contract.version is null, ` +
      `current state: ${state?.state ?? "unknown"}). Freeze the contract first — write ` +
      `delivery/CONTRACT.md, run \`node scripts/gate-check.mjs freeze <CONTRACT.md>\`, record ` +
      `contract.version in the state file — then retry. No frozen contract → no parallel planning.`
  );
} catch {
  allow(); // fail-open, always
}
