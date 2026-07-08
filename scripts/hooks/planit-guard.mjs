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
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DELIVERABLE_RE = /(^|[\\/])(prds?|epics?)[\\/]|(^|[\\/])(prd|epics?)-[^\\/]*\.md$/i;

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

  const cwd = input.cwd ?? process.cwd();
  const statePath = join(cwd, ".plan-it", "state.json");
  if (!existsSync(statePath)) allow();

  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const version = state?.contract?.version ?? null;
  if (version !== null && version !== "") allow();

  deny(
    `plan-it Rule 1 (hard-enforced): "${filePath}" looks like a PRD/epic deliverable, ` +
      `but this run's CONTRACT is not frozen (.plan-it/state.json contract.version is null, ` +
      `current state: ${state?.state ?? "unknown"}). Freeze the contract first — write ` +
      `delivery/CONTRACT.md, run \`node scripts/gate-check.mjs freeze <CONTRACT.md>\`, record ` +
      `contract.version in .plan-it/state.json — then retry. No frozen contract → no parallel planning.`
  );
} catch {
  allow(); // fail-open, always
}
