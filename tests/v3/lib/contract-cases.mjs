/**
 * Shared parser: reads delivery/v3/CONTRACT.md's own "## Cases" table and
 * turns each row into { id, tag, desc, run }. This is the ONE mechanism for
 * turning the frozen CONTRACT into runnable cases — used by both
 * tests/run-contract.mjs's v3 section and tests/v3/fail-closed-sweep.mjs
 * (C-META-01), so there is a single computed source of truth (W5): never a
 * hand-copied list of the 26 enforcement rows in two places.
 *
 * Also exposes small introspection helpers used to decide, for a given row,
 * whether its Wave-1 mechanism (fixture path / test script / gate-check verb
 * / --dir flag support) already exists on disk — a "mechanism gap" is
 * expected and reportable pre-Wave-1, never a silent pass.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const CONTRACT_PATH = join(ROOT, "delivery/v3/CONTRACT.md");
export const GATECHECK_PATH = join(ROOT, "scripts/gate-check.mjs");

/** Parse every `| ID | @tag | desc | \`run:\` |` row out of CONTRACT.md's "## Cases" table. */
export function parseContractCases(contractText) {
  const text = contractText ?? readFileSync(CONTRACT_PATH, "utf8");
  const casesStart = text.indexOf("\n## Cases");
  if (casesStart === -1) return [];
  const rest = text.slice(casesStart + 1);
  const nextHead = rest.slice(3).search(/\n##\s/);
  const block = nextHead === -1 ? rest : rest.slice(0, nextHead + 3);
  const rowRe = /^\|\s*([A-Z][A-Z0-9-]*)\s*\|\s*(@[\w-]+)\s*\|\s*(.+?)\s*\|\s*`([^`]+)`\s*\|\s*$/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(block)) !== null) {
    rows.push({ id: m[1], tag: m[2], desc: m[3], run: m[4] });
  }
  return rows;
}

/** Verb names currently registered in scripts/gate-check.mjs's `commands` map. */
export function registeredVerbs(gcSrc) {
  const src = gcSrc ?? (existsSync(GATECHECK_PATH) ? readFileSync(GATECHECK_PATH, "utf8") : "");
  const m = src.match(/const\s+commands\s*=\s*\{([^}]*)\}/);
  return new Set(m ? [...m[1].matchAll(/([A-Za-z-]+)\s*:/g)].map((x) => x[1]) : []);
}

/** Whether gate-check.mjs currently parses a --dir flag at all. */
export function supportsDirFlag(gcSrc) {
  const src = gcSrc ?? (existsSync(GATECHECK_PATH) ? readFileSync(GATECHECK_PATH, "utf8") : "");
  return /--dir\b/.test(src);
}

/** Every tests/fixtures/... , tests/v3/... , or scripts/gate-check.mjs path literal referenced by a run: cell. */
export function refPaths(cmd) {
  return [...cmd.matchAll(/(tests\/fixtures\/[^\s`]+|tests\/v3\/[^\s`]+|scripts\/gate-check\.mjs)/g)].map((x) => x[1]);
}

/**
 * Returns a human-readable gap reason if this row's Wave-1 mechanism is not
 * yet present on disk, or null if the row looks ready to actually execute.
 * "Ready" means: every referenced fixture/script path exists AND, for a
 * `scripts/gate-check.mjs <verb>` invocation, the verb is registered AND (if
 * the row uses --dir) gate-check.mjs already parses --dir.
 */
export function mechanismGap(row, opts = {}) {
  if (row.run.startsWith("manual:")) return `manual case, not machine-runnable: ${row.run}`;
  const gcSrc = opts.gcSrc ?? (existsSync(GATECHECK_PATH) ? readFileSync(GATECHECK_PATH, "utf8") : "");
  const missing = refPaths(row.run).filter((p) => !existsSync(join(ROOT, p)));
  if (missing.length > 0) return `missing on disk: ${missing.join(", ")}`;
  const gcMatch = row.run.match(/scripts\/gate-check\.mjs\s+(\S+)/);
  if (gcMatch) {
    const verb = gcMatch[1];
    const verbs = registeredVerbs(gcSrc);
    if (!verbs.has(verb)) return `verb "${verb}" not yet registered in scripts/gate-check.mjs`;
    if (/--dir\b/.test(row.run) && !supportsDirFlag(gcSrc)) return `verb "${verb}" exists but --dir flag is not yet supported`;
  }
  return null;
}
