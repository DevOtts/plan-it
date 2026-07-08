#!/usr/bin/env node
/**
 * gate-check — plan-it's deterministic guards, as exit codes instead of prose.
 *
 * Subcommands (exit 0 = pass, exit 1 = fail with named reasons):
 *   verify  <path...>                 every path exists and is non-empty (Rule 3: idle ≠ delivered)
 *   freeze  <CONTRACT.md>             frozen-CONTRACT structural check (Rule 1: no contract → no squads)
 *   handoff <delivery-dir>            mechanizable half of the pre-handoff lint (playbooks §F)
 *   state   <state.json> [machine.json]  validate the run state; print current state + allowed events
 *
 * Zero npm dependencies — node: builtins only. Portable across macOS/Linux/Windows.
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);

function finish(label) {
  if (failures.length === 0) {
    console.log(`PASS — ${label}`);
    process.exit(0);
  }
  console.error(`FAIL — ${label}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

// ---------------------------------------------------------------- verify
function cmdVerify(paths) {
  if (paths.length === 0) fail("verify: no paths given");
  for (const p of paths) {
    let st;
    try {
      st = statSync(p);
    } catch {
      fail(`missing: ${p}`);
      continue;
    }
    if (st.isDirectory()) {
      const entries = readdirSync(p).filter((e) => !e.startsWith("."));
      if (entries.length === 0) fail(`empty directory: ${p}`);
      else ok(`${p} (dir, ${entries.length} entries)`);
      continue;
    }
    const content = readFileSync(p, "utf8");
    if (content.trim().length === 0) fail(`empty file: ${p}`);
    else ok(`${p} (${st.size} bytes)`);
  }
  finish("artifacts on disk (idle ≠ delivered)");
}

// ---------------------------------------------------------------- freeze
const PLACEHOLDER_RE = /\bTBD\b|\bTODO\b|<[a-z][a-z0-9 _-]*>/i;

// Mention vs use: a token inside backticks (`TBD`) or a fenced block is being
// *described*, not left as a placeholder. Strip code spans before scanning.
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}

function cmdFreeze([path]) {
  if (!path) {
    fail("freeze: usage: gate-check freeze <CONTRACT.md>");
    return finish("contract frozen");
  }
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`missing: ${path}`);
    return finish("contract frozen");
  }
  if (text.trim().length === 0) fail(`empty: ${path}`);
  if (!/\bv\d+\.\d+\b/.test(text)) fail(`no version header (vN.N) found in ${path}`);
  const sections = (text.match(/^##\s+/gm) || []).length;
  if (sections < 3) fail(`only ${sections} "##" sections — a frozen CONTRACT needs ≥3 (vocabulary, schema/interface, definition of shipped)`);
  if (!/changelog/i.test(text)) fail(`no changelog line — amendments need somewhere to land (v1.0 → v1.1 …)`);
  const ph = stripCode(text).match(PLACEHOLDER_RE);
  if (ph) fail(`placeholder token "${ph[0]}" inside a frozen contract`);
  if (failures.length === 0) ok(`${path}: version header, ${sections} sections, changelog, no placeholders`);
  finish("contract frozen");
}

// ---------------------------------------------------------------- handoff
function collectMdFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collectMdFiles(p, out);
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function cmdHandoff([dir]) {
  if (!dir || !existsSync(dir)) {
    fail(`handoff: delivery dir not found: ${dir ?? "(none given)"}`);
    return finish("pre-handoff lint");
  }
  const files = collectMdFiles(dir);
  if (files.length === 0) fail(`no .md files under ${dir}`);

  // Pass 1 — collect every test-case ID across the whole package, so the
  // per-epic check below can accept small-shape packages that centralize the
  // Test Contract (one ~20-case table for all epics) instead of per-epic blocks.
  const allCaseIds = new Map(); // id -> file
  const texts = new Map();
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    texts.set(f, text);
    for (const m of text.matchAll(/\bT-E\d+[A-Za-z0-9.]*-\d{2}\b/g)) {
      if (allCaseIds.has(m[0]) && allCaseIds.get(m[0]) !== f) continue; // same id across files is allowed (cross-refs)
      allCaseIds.set(m[0], f);
    }
  }
  const epicsWithCases = new Set(
    [...allCaseIds.keys()].map((id) => id.match(/^T-(E\d+)/)[1])
  );

  // Pass 2 — the checks.
  for (const f of files) {
    const text = texts.get(f);

    // 1. Test-ID grammar: flag drifted grammars like T1-01.
    for (const m of text.matchAll(/\|\s*(T\d+-\d{2})\s*\|/g)) {
      fail(`${f}: drifted test-ID grammar "${m[1]}" — use T-<EID>-NN`);
    }

    // 2. Header count == counted case rows, per Test Contract block.
    const headerRe = /Count:\s*(\d+)/g;
    let hm;
    while ((hm = headerRe.exec(text)) !== null) {
      const declared = Number(hm[1]);
      const rest = text.slice(hm.index);
      const blockEnd = rest.search(/\n#{1,2}\s(?!#)/); // next h1/h2
      const block = blockEnd === -1 ? rest : rest.slice(0, blockEnd);
      const counted = (block.match(/\|\s*T-E\d+[A-Za-z0-9.]*-\d{2}\s*\|/g) || []).length;
      if (counted > 0 && counted !== declared) {
        fail(`${f}: contract header declares Count: ${declared} but ${counted} case rows counted — count tags, don't hand-type`);
      } else if (counted > 0) {
        ok(`${f}: declared ${declared} == counted ${counted}`);
      }
    }

    // 3. [REAL] + non-REAL == total (when a REAL summary is declared).
    const realDecl = text.match(/(\d+)\s*\[REAL\]\s*(?:cases?|of)/i);
    if (realDecl) {
      const declaredReal = Number(realDecl[1]);
      const countedReal = (text.match(/\|\s*\[REAL\]|\[REAL\]\s*\|/g) || []).length;
      if (countedReal !== declaredReal) {
        fail(`${f}: declares ${declaredReal} [REAL] cases but ${countedReal} tagged rows counted`);
      }
    }

    // 4. Every epic has a Test Contract — either a block in its own section, or
    //    (small shapes) its T-E<N>-NN cases in the package's central contract.
    const epicHeads = [...text.matchAll(/^#{2,3}\s+(E\d+[^\n]*epic[^\n]*|epic\s+E\d+[^\n]*|E\d+\s+—[^\n]*)/gim)];
    for (const eh of epicHeads) {
      const eid = eh[1].match(/E\d+/)[0];
      const from = eh.index;
      const rest2 = text.slice(from + eh[0].length);
      const nextHead = rest2.search(new RegExp(`^#{1,${eh[0].match(/^#+/)[0].length}}\\s`, "m"));
      const section = nextHead === -1 ? rest2 : rest2.slice(0, nextHead);
      const coveredInSection = /test contract/i.test(section) || /\|\s*T-E\d+/i.test(section);
      const coveredCentrally = epicsWithCases.has(eid);
      if (!coveredInSection && !coveredCentrally) {
        fail(`${f}: epic "${eh[1].trim().slice(0, 60)}" has no Test Contract — no block in its section and no T-${eid}-NN cases anywhere in the package. The contract is the heart of the epic, not a footnote`);
      }
    }

    // 5. Token lint: digits embedded in words; placeholders in FROZEN files.
    const prose = stripCode(text);
    for (const m of prose.matchAll(/\b[a-z]+\d+[a-z]+[a-z0-9]*\b/g)) {
      const word = m[0];
      // allow known technical tokens (ids, hashes, base64-ish, common words)
      if (/^(utf8|sha\d+|md5|s3|ec2|i18n|l10n|a11y|k8s|oauth2|http2|ipv[46]|es\d+|vitest2?|b2b|b2c|p2p|web3|f\d+ai)$/i.test(word)) continue;
      if (/^[a-f0-9]+$/i.test(word)) continue; // hex
      if (word.length > 20) continue; // hashes/slugs
      fail(`${f}: suspicious digits-in-word token "${word}" (unparseable-merge smell)`);
    }
    if (/\bFROZEN\b/.test(prose)) {
      const ph = prose.match(PLACEHOLDER_RE);
      if (ph) fail(`${f}: placeholder "${ph[0]}" inside a FROZEN artifact`);
    }
  }
  if (files.length > 0 && allCaseIds.size === 0) {
    fail(`no T-<EID>-NN test cases found anywhere under ${dir} — a delivery package without a Test Contract cannot hand off`);
  } else if (allCaseIds.size > 0) {
    ok(`${allCaseIds.size} distinct test-case IDs found across ${files.length} files`);
  }
  finish("pre-handoff lint (mechanizable half — the judgment half stays with the model)");
}

// ---------------------------------------------------------------- state
const STATE_REQUIRED_KEYS = ["schemaVersion", "machineVersion", "run", "state", "gates", "history"];

function findMachine(explicit) {
  if (explicit) return explicit;
  const here = dirname(fileURLToPath(import.meta.url));
  for (const c of [join(here, "..", "machine.json"), join(process.cwd(), "machine.json")]) {
    if (existsSync(c)) return c;
  }
  return null;
}

function cmdState([statePath, machinePath]) {
  if (!statePath) {
    fail("state: usage: gate-check state <state.json> [machine.json]");
    return finish("run state valid");
  }
  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (e) {
    fail(`cannot read/parse ${statePath}: ${e.message}`);
    return finish("run state valid");
  }
  for (const k of STATE_REQUIRED_KEYS) {
    if (!(k in state)) fail(`missing required key "${k}" in ${statePath}`);
  }
  const mp = findMachine(machinePath);
  if (!mp) {
    fail("machine.json not found (pass its path as the second argument)");
    return finish("run state valid");
  }
  const machine = JSON.parse(readFileSync(mp, "utf8"));
  const states = machine.states ?? {};
  if (state.state && !(state.state in states)) {
    fail(`invalid state "${state.state}" — not a state in ${mp}. Valid: ${Object.keys(states).join(", ")}`);
  }
  // Gates that the machine has already passed must carry owner + date.
  const visited = new Set((state.history ?? []).map((h) => h.state));
  for (const [name, node] of Object.entries(states)) {
    const gate = node.meta?.gate;
    if (gate && visited.has(name)) {
      const rec = state.gates?.[gate];
      if (!rec?.approved || !rec?.owner || !rec?.date) {
        fail(`gate ${gate} (${name}) appears in history but is not recorded with approved+owner+date`);
      }
    }
  }
  if (failures.length === 0 && state.state) {
    const node = states[state.state];
    const events = Object.keys(node?.on ?? {});
    console.log(`state: ${state.state}${node?.meta?.title ? ` — ${node.meta.title}` : ""}`);
    console.log(`next events: ${events.length ? events.join(", ") : "(final state)"}`);
    for (const ev of events) {
      const t = node.on[ev];
      const guard = (Array.isArray(t) ? t[0] : t)?.guard;
      if (guard) {
        const g = machine.meta?.guards?.[guard];
        console.log(`  ${ev} → guarded by "${guard}"${g ? ` (${g.usage})` : ""}`);
      }
    }
  }
  finish("run state valid");
}

// ------------------------------------------------- v3 shared helpers (D2)
// --dir <path>: additive calling convention for the v3 verbs and the
// freeze/state extensions (PRD prd-1-gatecheck-fd §2 D2). Positional-file
// callers keep their existing behavior untouched.
function parseDirFlag(args) {
  if (args[0] !== "--dir") return { dir: null, rest: args };
  if (!args[1]) return { dir: null, rest: args.slice(1), dirErr: "--dir requires a path" };
  return { dir: resolve(args[1]), rest: args.slice(2) };
}

function readState(root) {
  try {
    return JSON.parse(readFileSync(join(root, ".plan-it", "state.json"), "utf8"));
  } catch {
    return null;
  }
}

const CONVENTIONS_OPEN = "<!-- plan-it:test-conventions -->";
const CONVENTIONS_CLOSE = "<!-- /plan-it:test-conventions -->";

// Loose case-row parse: any |-row whose 2nd cell is an @tag. Unlike the
// strict rowRe in tests/v3/lib/contract-cases.mjs (which requires a
// backticked run cell), this keeps rows with a MISSING run cell visible so
// C-W1-05 can name them instead of silently skipping them.
function looseCaseRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cells.length < 2 || !/^@[\w-]+$/.test(cells[1])) continue;
    if (!/^[A-Z][A-Z0-9-]*$/.test(cells[0]) || cells[0] === "ID") continue; // skip header row
    rows.push({ id: cells[0], tag: cells[1], desc: cells[2] ?? "", run: (cells[3] ?? "").replace(/^`|`$/g, "").trim() });
  }
  return rows;
}

// ---------------------------------------------------------------- contract
// Epic A2 — W1 structural hygiene + W5 computed tally (cases C-W1-01/04/05/06,
// C-W5-01). Repo-level checks (CLAUDE.md conventions block, DIFF-MANIFEST
// packaging coverage) need a repo root and therefore run in --dir mode only;
// file-level checks run for both calling forms.
function cmdContract(rawArgs) {
  const label = "contract hygiene (W1) + computed tally (W5)";
  const { dir, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`contract: ${dirErr}`);
    return finish(label);
  }
  const contractPath = dir ? join(dir, "delivery", "v3", "CONTRACT.md") : rest[0];
  if (!contractPath) {
    fail("contract: usage: gate-check contract --dir <repo-root> [--override-manual] | gate-check contract <CONTRACT.md>");
    return finish(label);
  }
  let text;
  try {
    text = readFileSync(contractPath, "utf8");
  } catch {
    fail(`missing: ${contractPath}`);
    return finish(label);
  }
  const rows = looseCaseRows(text);

  if (dir) {
    // C-W1-01 — repo has tests but CLAUDE.md lacks the conventions block (W1/FD-1).
    let hasTests = ["tests", "test", "__tests__"].some((d) => existsSync(join(dir, d)));
    if (!hasTests) {
      try {
        hasTests = Boolean(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).scripts?.test);
      } catch { /* no package.json — fine */ }
    }
    if (hasTests) {
      const claudePath = join(dir, "CLAUDE.md");
      const claude = existsSync(claudePath) ? stripCode(readFileSync(claudePath, "utf8")) : "";
      if (!claude.includes(CONVENTIONS_OPEN)) {
        fail(`C-W1-01: repo has tests but ${claudePath} lacks the ${CONVENTIONS_OPEN} block — run gate-check testconv --dir ${dir}`);
      } else {
        ok(`test-conventions block present in ${claudePath}`);
      }
    }
    // C-W1-04 — packaging-touching diff with zero @case-packaging rows.
    const manifestPath = join(dir, "DIFF-MANIFEST.txt");
    if (existsSync(manifestPath)) {
      const manifest = readFileSync(manifestPath, "utf8");
      const touches = manifest.match(/\b(plugin\.json|SKILL\.md|marketplace\.json)\b/g);
      if (touches && !rows.some((r) => r.tag === "@case-packaging")) {
        fail(`C-W1-04: diff manifest names packaging file(s) ${[...new Set(touches)].join(", ")} but the case table has zero @case-packaging rows`);
      }
    }
  }

  // C-W1-05 — every case row carries a run: cell.
  for (const r of rows) {
    if (!r.run) fail(`C-W1-05: case row ${r.id} is missing its run: cell`);
  }

  // C-W1-06 — manual: share ceiling (≤30%), overridable explicitly only.
  const manual = rows.filter((r) => r.run.startsWith("manual:"));
  if (rows.length > 0 && manual.length / rows.length > 0.3) {
    const pct = Math.round((manual.length / rows.length) * 100);
    if (rest.includes("--override-manual")) {
      ok(`manual: share ${manual.length}/${rows.length} (${pct}%) over the 30% ceiling — accepted via --override-manual`);
    } else {
      console.error(`  ! warning: manual: run cells are ${manual.length}/${rows.length} (${pct}%) — over the 30% ceiling`);
      fail(`C-W1-06: manual: share ${manual.length}/${rows.length} (${pct}%) exceeds the 30% ceiling — pass --override-manual to accept deliberately`);
    }
  }

  // C-W5-01 — the tally is COMPUTED; any hand-typed digit tally must agree.
  const computed = rows.filter((r) => r.tag.startsWith("@case-")).length;
  const tally = stripCode(text).match(/^Tally:\s*(\d+)\s*(?:\/\s*\d+)?/m);
  if (tally && Number(tally[1]) !== computed) {
    fail(`C-W5-01: hand-typed tally ${tally[1]} disagrees with computed @case- row count ${computed} — tallies are COMPUTED (W5), never hand-edited`);
  } else if (failures.length === 0) {
    ok(`${contractPath}: ${rows.length} case rows, computed @case- tally ${computed}, manual share ${manual.length}/${rows.length}`);
  }
  finish(label);
}

// ---------------------------------------------------------------- main
const [, , cmd, ...args] = process.argv;
const commands = { verify: cmdVerify, freeze: cmdFreeze, handoff: cmdHandoff, state: cmdState, contract: cmdContract };
if (!cmd || !(cmd in commands)) {
  console.error("usage: gate-check <verify|freeze|handoff|state|contract> [args...]");
  console.error("  verify  <path...>                    files/dirs exist and are non-empty");
  console.error("  freeze  <CONTRACT.md>                frozen-contract structural check");
  console.error("  handoff <delivery-dir>               pre-handoff consistency lint");
  console.error("  state   <state.json> [machine.json]  validate run state, print next events");
  console.error("  contract <--dir repo-root|CONTRACT.md>  W1 hygiene lint + computed tally (W5)");
  process.exit(1);
}
commands[cmd](args);
