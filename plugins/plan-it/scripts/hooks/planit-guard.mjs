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
