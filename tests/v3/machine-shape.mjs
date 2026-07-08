#!/usr/bin/env node
/**
 * C-W2-01 — machine.json carries a `preflight` state on the edge chain
 * discovery→preflight→contract (Epic E2 / W2). No v2 state is literally
 * named `contract`; per the squad's documented interpretation
 * (delivery/v3/prds/prd-2-statechart-tiering.md §"Interpretation flag on
 * 'contract'", confirmed in delivery/v3/epics/epics-2-statechart-tiering.md's
 * own machine-shape.mjs checklist line), "→contract" reads as shorthand for
 * the contract-authoring track downstream of discovery: this check asserts
 * (a) a `preflight` state exists, (b) `discovery` has an edge targeting it,
 * and (c) `preflight` can reach `backboneFreeze` (where CONTRACT.md is
 * authored/frozen) via the state graph — not a literal edge to a node named
 * "contract".
 *
 * Runs the same shape-check against the live machine.json AND a violating
 * fixture (tests/fixtures/v3/machine-no-preflight/machine.json — a copy of
 * the v2 baseline with no preflight state at all) to prove the check
 * actually discriminates rather than passing unconditionally.
 *
 * EXIT-CODE CONVENTION (deliberately inverted — same as
 * tests/v3/conventions-idempotent.mjs, see its header for the full
 * rationale): exit 1 = enforcement held; exit 0 = enforcement BROKEN.
 * Per C-META-01's fail-closed sweep and AMD-3 (delivery/decisions.md
 * 2026-07-08).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REAL_MACHINE = join(ROOT, "machine.json");
const FIXTURE_MACHINE = join(ROOT, "tests", "fixtures", "v3", "machine-no-preflight", "machine.json");

function loadMachine(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function edgeTargets(node) {
  return Object.values(node?.on ?? {}).map((t) => (Array.isArray(t) ? t[0] : t)?.target).filter(Boolean);
}

/**
 * Shape-check: { hasPreflight, hasDiscoveryEdge, reachesBackboneFreeze }.
 * reachesBackboneFreeze is computed via BFS over .on edges (guard-agnostic —
 * reachability, not gated traversal) starting at "preflight".
 */
function checkShape(machine) {
  const states = machine.states ?? {};
  const hasPreflight = "preflight" in states;
  const hasDiscoveryEdge = edgeTargets(states.discovery).includes("preflight");
  let reachesBackboneFreeze = false;
  if (hasPreflight) {
    const seen = new Set(["preflight"]);
    const queue = ["preflight"];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === "backboneFreeze") {
        reachesBackboneFreeze = true;
        break;
      }
      for (const t of edgeTargets(states[cur])) {
        if (!seen.has(t)) {
          seen.add(t);
          queue.push(t);
        }
      }
    }
  }
  return { hasPreflight, hasDiscoveryEdge, reachesBackboneFreeze };
}

const shapeOk = (s) => s.hasPreflight && s.hasDiscoveryEdge && s.reachesBackboneFreeze;

const real = checkShape(loadMachine(REAL_MACHINE));
const fixture = checkShape(loadMachine(FIXTURE_MACHINE));

let broken = null;
if (!shapeOk(real)) {
  broken = `live ${REAL_MACHINE} does not have the preflight shape: ${JSON.stringify(real)}`;
} else if (shapeOk(fixture)) {
  broken = `violating fixture ${FIXTURE_MACHINE} (v2-baseline copy, no preflight state) wrongly PASSED the shape-check: ${JSON.stringify(fixture)}`;
}

if (broken) {
  console.log(`BROKEN — ${broken}`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}
console.log(`OK — live machine.json has preflight + discovery→preflight edge + reaches backboneFreeze (${JSON.stringify(real)}); violating fixture correctly rejected (${JSON.stringify(fixture)}). Exiting 1 per the C-META-01 fail-closed sweep convention.`);
process.exit(1);
