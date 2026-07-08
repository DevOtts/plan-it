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
import { readFileSync, statSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
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

function cmdFreeze(rawArgs) {
  const { dir, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`freeze: ${dirErr}`);
    return finish("contract frozen");
  }
  const path = dir ? join(dir, "delivery", "v3", "CONTRACT.md") : rest[0];
  if (!path) {
    fail("freeze: usage: gate-check freeze <CONTRACT.md> | gate-check freeze --dir <repo-root>");
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
  // C-W1-03 (Epic A4) — --dir mode only, additive: no freeze before the FD-2
  // case review has landed in the run state.
  if (dir) {
    const st = readState(dir);
    if (st?.casesReviewed !== true) {
      fail(`C-W1-03: casesReviewed !== true in ${join(dir, ".plan-it", "state.json")} — the Test Contract case review must land before the contract freezes`);
    }
  }
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

function cmdHandoff(rawArgs) {
  const { dir: rootFlag, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`handoff: ${dirErr}`);
    return finish("pre-handoff lint");
  }
  // --dir <repo-root> (Epic A4): lint <root>/delivery and run the embedded
  // reconcile scan against the root. Positional callers keep v2 behavior.
  const dir = rootFlag ? (existsSync(join(rootFlag, "delivery")) ? join(rootFlag, "delivery") : rootFlag) : rest[0];
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
    // [A-Z] (not literal E): coordinator ruling on PROPOSED-AMENDMENT-2,
    // epics-1-gatecheck-fd.md addendum 2026-07-08 — v3 A*/B*/C* IDs recognized.
    for (const m of text.matchAll(/\bT-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\b/g)) {
      if (allCaseIds.has(m[0]) && allCaseIds.get(m[0]) !== f) continue; // same id across files is allowed (cross-refs)
      allCaseIds.set(m[0], f);
    }
  }
  const epicsWithCases = new Set(
    [...allCaseIds.keys()].map((id) => id.match(/^T-([A-Z]\d+)/)[1])
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
      const counted = (block.match(/\|\s*T-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\s*\|/g) || []).length;
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
    const epicHeads = [...text.matchAll(/^#{2,3}\s+([A-Z]\d+[^\n]*epic[^\n]*|epic\s+[A-Z]\d+[^\n]*|[A-Z]\d+\s+—[^\n]*)/gim)];
    for (const eh of epicHeads) {
      const eid = eh[1].match(/[A-Z]\d+/)[0];
      const from = eh.index;
      const rest2 = text.slice(from + eh[0].length);
      const nextHead = rest2.search(new RegExp(`^#{1,${eh[0].match(/^#+/)[0].length}}\\s`, "m"));
      const section = nextHead === -1 ? rest2 : rest2.slice(0, nextHead);
      const coveredInSection = /test contract/i.test(section) || /\|\s*T-[A-Z]\d+/.test(section);
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

    // 5b. (C-W4-02) Every VERIFIED claim needs a run-output reference — a
    //    fenced output block or a `run:`/`output:` citation — within ±5 lines.
    //    Vocabulary enumerations and IMPLEMENTED-NOT-VERIFIED are mentions,
    //    not claims.
    const lines = text.split("\n");
    const hasRunRef = (i) => {
      const from = Math.max(0, i - 5);
      const to = Math.min(lines.length - 1, i + 5);
      for (let j = from; j <= to; j++) {
        if (/```/.test(lines[j]) || /\b(run|output):/i.test(lines[j])) return true;
      }
      return false;
    };
    lines.forEach((line, i) => {
      const scannable = line.replace(/`[^`\n]*`/g, ""); // backticked = mention
      if (!/(?<!NOT-)\bVERIFIED\b/.test(scannable)) return;
      if (/NOT-STARTED/.test(scannable) && /IN-PROGRESS/.test(scannable)) return; // vocab enumeration
      if (!hasRunRef(i)) {
        fail(`${f}:${i + 1}: "VERIFIED" without a run-output reference (fenced output or run:/output: citation) within 5 lines — verified means ran, not read`);
      }
    });

    // 5c. (C-W4-03) STATUS-board vocabulary: any table with a `Status` column
    //    (or a "## … STATUS …" heading shape) may only use the 4-term set.
    const VOCAB = new Set(["NOT-STARTED", "IN-PROGRESS", "IMPLEMENTED-NOT-VERIFIED", "VERIFIED"]);
    const boardShape = /^#{1,3}[^\n]*\bSTATUS\b/m.test(text) || /^\s*\|[^\n]*\|\s*status\s*\|/im.test(text);
    if (boardShape) {
      lines.forEach((line, i) => {
        if (!/^\s*\|/.test(line)) return;
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        const col = cells.findIndex((c) => /^status$/i.test(c));
        if (col === -1) return; // not a header row with a Status column
        for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
          const row = lines[j].split("|").slice(1, -1).map((c) => c.trim());
          const val = row[col] ?? "";
          if (val === "" || /^:?-+:?$/.test(val)) continue; // separator/empty
          if (!VOCAB.has(val)) {
            fail(`${f}:${j + 1}: status "${val}" outside the 4-term vocabulary (NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED)`);
          }
        }
      });
    }
  }
  if (files.length > 0 && allCaseIds.size === 0) {
    fail(`no T-<EID>-NN test cases found anywhere under ${dir} — a delivery package without a Test Contract cannot hand off`);
  } else if (allCaseIds.size > 0) {
    ok(`${allCaseIds.size} distinct test-case IDs found across ${files.length} files`);
  }

  // 6. Embedded reconcile (C-W5-04, Epic A4): same internal function, same
  // shared failures array, one finish() — never a subprocess, never
  // double-reported (PRD §5 R4). Runs when a repo root is derivable.
  const root = rootFlag ?? (basename(resolve(dir)) === "delivery" ? dirname(resolve(dir)) : null);
  if (root) reconcileScan(root);

  // 7. (C-W6-04, PRD §D8) plugin↔marketplace parity — scoped: only fires when
  //    the package carries packaging files (both manifests under the dir).
  const pkg = { plugin: null, marketplace: null };
  (function findPkg(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") && e.name !== ".claude-plugin") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) findPkg(p);
      else if (e.name === "plugin.json" && !pkg.plugin) pkg.plugin = p;
      else if (e.name === "marketplace.json" && !pkg.marketplace) pkg.marketplace = p;
    }
  })(dir);
  if (pkg.plugin && pkg.marketplace) {
    try {
      const pj = JSON.parse(readFileSync(pkg.plugin, "utf8"));
      const mk = JSON.parse(readFileSync(pkg.marketplace, "utf8"));
      const entry = (mk.plugins ?? []).find((x) => x?.name === pj.name) ?? (mk.plugins ?? [])[0];
      if (!entry) {
        fail(`${pkg.marketplace}: no plugins[] entry matching plugin.json name "${pj.name}"`);
      } else {
        let drift = false;
        for (const field of ["name", "version", "license"]) {
          if (field in entry && field in pj && entry[field] !== pj[field]) {
            fail(`packaging parity: ${pkg.plugin} ${field} "${pj[field]}" ≠ ${pkg.marketplace} plugins[] ${field} "${entry[field]}" — one release, one version story`);
            drift = true;
          }
        }
        if (!drift) ok(`packaging parity: ${pkg.plugin} ↔ ${pkg.marketplace} agree on name/version/license`);
      }
    } catch (e) {
      fail(`packaging parity: unparseable manifest — ${e.message}`);
    }
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

function cmdState(rawArgs) {
  const { dir: rootFlag, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`state: ${dirErr}`);
    return finish("run state valid");
  }
  const statePath = rootFlag ? join(rootFlag, ".plan-it", "state.json") : rest[0];
  const machinePath = rootFlag ? rest[0] : rest[1];
  if (!statePath) {
    fail("state: usage: gate-check state <state.json> [machine.json] | gate-check state --dir <repo-root> [machine.json]");
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

  // v3 root-aware payload checks (Epics A3/A4) run only when a repo root is
  // derivable — a --dir call or a canonical <root>/.plan-it/state.json path.
  // Bare state.json paths (v2 fixtures, T-E2-*) skip them: additive, zero
  // regression for existing callers (PRD prd-1-gatecheck-fd §2 D5).
  const root = rootFlag ?? (resolve(statePath).endsWith(join(".plan-it", "state.json")) ? dirname(dirname(resolve(statePath))) : null);
  if (root && state.testConventions?.registered === true) {
    // Case A3 (FD-1) — stale test-convention receipt.
    const claudePath = join(root, "CLAUDE.md");
    const claude = existsSync(claudePath) ? stripCode(readFileSync(claudePath, "utf8")) : "";
    if (!claude.includes(CONVENTIONS_OPEN)) {
      fail(`A3 (FD-1): stale test-conventions receipt — state.json records registered:true but ${claudePath} no longer contains the ${CONVENTIONS_OPEN} block (re-verify, not silent pass)`);
    }
  }
  if (root && state.gates?.G2?.approved === true) {
    // Cases B1/B2 (FD-2) — G2_ANSWERED requires the review artifact on disk,
    // carrying the user-ack grammar frozen at delivery/TEST-CONTRACT-REVIEW.md:49.
    const reviewPath = join(root, "delivery", "TEST-CONTRACT-REVIEW.md");
    if (!existsSync(reviewPath)) {
      fail(`B1 (FD-2): gates.G2.approved is true but ${reviewPath} is not on disk — G2_ANSWERED without the review artifact is rejected`);
    } else if (!/^Reviewed-by:\s+\S.*\b\d{4}-\d{2}-\d{2}\b/m.test(readFileSync(reviewPath, "utf8"))) {
      fail(`B2 (FD-2): ${reviewPath} lacks the "Reviewed-by: <name> <date>" acknowledgment line — review file without user ack is rejected`);
    }
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

// ---------------------------------------------------------------- testconv
// Epic A3 — FD-1 test-convention discovery/registration (draft cases A1/A2/A4
// + enforcement C-W1-02). --dir-only verb (D2/D4). Exit codes: 0 = a receipt
// exists or was written (registered OR declined — FD-1 registers the
// disposition either way); 2 = no block and no receipt: research → ask user →
// REGISTER (gate-check's only non-binary exit, sanctioned by AMD-3,
// delivery/decisions.md 2026-07-08); 1 = usage/structural failure.
function cmdTestconv(rawArgs) {
  const label = "test-conventions discovery (FD-1)";
  const { dir, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr || !dir) {
    fail(`testconv: ${dirErr ?? "usage: gate-check testconv --dir <repo-root> [--register [text] | --decline]"}`);
    return finish(label);
  }
  const claudePath = join(dir, "CLAUDE.md");
  const claudeRaw = existsSync(claudePath) ? readFileSync(claudePath, "utf8") : "";
  const blockPresent = stripCode(claudeRaw).includes(CONVENTIONS_OPEN);
  const state = readState(dir) ?? {};
  const now = new Date().toISOString();

  const writeReceipt = (receipt) => {
    state.testConventions = receipt;
    mkdirSync(join(dir, ".plan-it"), { recursive: true });
    writeFileSync(join(dir, ".plan-it", "state.json"), JSON.stringify(state, null, 2) + "\n");
  };

  if (rest.includes("--decline")) {
    if (state.testConventions?.declined !== true) writeReceipt({ declined: true, by: "user", at: now });
    ok(`declined-by-user receipt in ${join(dir, ".plan-it", "state.json")} — a valid FD-1 disposition (case A4)`);
    return finish(label);
  }

  const regIdx = rest.indexOf("--register");
  if (regIdx !== -1) {
    if (!blockPresent) {
      // C-W1-02: the block is regex-checked above before writing — a rerun is
      // a no-op, never a duplicate fenced block.
      const text = rest.slice(regIdx + 1).join(" ").trim() || "Test conventions registered via gate-check testconv --register.";
      writeFileSync(claudePath, `${claudeRaw}\n${CONVENTIONS_OPEN}\n${text}\n${CONVENTIONS_CLOSE}\n`);
      ok(`conventions block written to ${claudePath}`);
    } else {
      ok(`conventions block already present in ${claudePath} — idempotent no-op (C-W1-02)`);
    }
    if (state.testConventions?.registered !== true) writeReceipt({ registered: true, source: blockPresent ? "found" : "registered", at: now });
    return finish(label);
  }

  if (blockPresent) {
    if (state.testConventions?.registered !== true) writeReceipt({ registered: true, source: "found", at: now });
    ok(`conventions block present in ${claudePath}; receipt in .plan-it/state.json (case A1)`);
    return finish(label);
  }
  if (state.testConventions?.declined === true) {
    ok(`no conventions block, but a declined-by-user receipt exists (${state.testConventions.at}) — FD-1 accepts decline as a registered disposition (case A4)`);
    return finish(label);
  }
  console.error(`testconv: no ${CONVENTIONS_OPEN} block in ${claudePath} and no receipt in .plan-it/state.json.`);
  console.error("  → research the target repo's test conventions, ask the user, then REGISTER the outcome:");
  console.error('      gate-check testconv --dir <repo-root> --register "<conventions text>"  (adopt)');
  console.error("      gate-check testconv --dir <repo-root> --decline                        (decline — FD-1 registers either way)");
  console.error("  GROUNDED is rejected until a receipt exists (case A2).");
  process.exit(2);
}

// ---------------------------------------------------------------- reconcile
// Epic A4 — W5 orphan detection (C-W5-02/03) + FD-2 draft→binding case map
// (case B3). reconcileScan pushes into the shared failures array so cmdHandoff
// can embed it (C-W5-04) with one finish() and no double-reporting (PRD §5 R4).
function reconcileScan(root) {
  const mdUnder = (d) => (existsSync(d) ? collectMdFiles(d) : []);
  const epicTexts = mdUnder(join(root, "delivery", "v3", "epics")).map((f) => [f, readFileSync(f, "utf8")]);

  // C-W5-02 — PRD requirement with no covering epic (orphan).
  for (const f of mdUnder(join(root, "delivery", "v3", "prds"))) {
    const reqs = new Set([...stripCode(readFileSync(f, "utf8")).matchAll(/\bR-?\d+\b/g)].map((m) => m[0]));
    for (const r of reqs) {
      if (!epicTexts.some(([, t]) => new RegExp(`\\b${r}\\b`).test(t))) {
        fail(`C-W5-02: requirement ${r} in ${f} has no covering epic under delivery/v3/epics (orphan)`);
      }
    }
  }

  // C-W5-03 — epic heading with zero Binding Test Contract case rows
  // (generalizes cmdHandoff's presence-check to a row-count check).
  for (const [f, text] of epicTexts) {
    for (const eh of text.matchAll(/^(#{2,3})\s+(?:[Ee]pic\s+)?([A-Z]\d+)\b[^\n]*/gm)) {
      const rest = text.slice(eh.index + eh[0].length);
      const nextHead = rest.search(new RegExp(`^#{1,${eh[1].length}}\\s`, "m"));
      const section = nextHead === -1 ? rest : rest.slice(0, nextHead);
      const rows = (section.match(/\|\s*T-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\s*\|/g) || []).length;
      if (rows === 0) fail(`C-W5-03: epic ${eh[2]} in ${f} has zero Binding Test Contract case rows`);
    }
  }

  // Case B3 (FD-2) — every draft case ID in TEST-CONTRACT-REVIEW.md maps to
  // ≥1 epic binding row OR a dated delivery/decisions.md drop entry.
  const reviewPath = join(root, "delivery", "TEST-CONTRACT-REVIEW.md");
  if (existsSync(reviewPath)) {
    // Draft cases are DECLARED as list items ("- A1, A2 — ..." / "- F1 [REAL] ...");
    // prose citations elsewhere ("per case B3") are not declarations.
    const drafts = new Set();
    for (const line of stripCode(readFileSync(reviewPath, "utf8")).split("\n")) {
      if (!/^\s*-\s/.test(line)) continue;
      for (const m of line.matchAll(/(?<![-\w])([A-Z]\d+)(?![-\w])/g)) drafts.add(m[1]);
    }
    const decisionsPath = join(root, "delivery", "decisions.md");
    const decisions = existsSync(decisionsPath) ? readFileSync(decisionsPath, "utf8") : "";
    for (const id of drafts) {
      // Bound = the ID appears in a |-table row of some epic file (a Binding
      // Test Contract row, e.g. its Covers cell) — prose mentions don't bind.
      const bound = epicTexts.some(([, t]) =>
        t.split("\n").some((line) => line.trimStart().startsWith("|") && new RegExp(`\\b${id}\\b`).test(line))
      );
      if (!bound && !new RegExp(`\\b${id}\\b`).test(decisions)) {
        fail(`B3 (FD-2): draft case ${id} in ${reviewPath} is bound in no epic Binding Test Contract table row and has no delivery/decisions.md drop entry — split/rename allowed, silent drops are not`);
      }
    }
  }
}

function cmdReconcile(rawArgs) {
  const label = "reconcile (W5 orphan scan + FD-2 draft→binding map)";
  const { dir, dirErr } = parseDirFlag(rawArgs);
  if (dirErr || !dir) {
    fail(`reconcile: ${dirErr ?? "usage: gate-check reconcile --dir <repo-root>"}`);
    return finish(label);
  }
  reconcileScan(dir);
  if (failures.length === 0) ok(`no orphan requirements, no zero-case epics, draft→binding map closed under ${dir}`);
  finish(label);
}

// ---------------------------------------------------------------- pluginlint
function collectSkillMds(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".claude-plugin") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collectSkillMds(p, out);
    else if (e.name === "SKILL.md") out.push(p);
  }
  return out;
}

// EC-D7: the four loader/metadata-parse failure classes that ship broken
// plugins silently (PRD §D6) — lint them as exit codes.
function cmdPluginlint(rawArgs) {
  // Bound to the shared --dir parser (Epic A4/D2); positional callers keep v2 behavior.
  const { dir: dirFlag, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`pluginlint: ${dirErr}`);
    return finish("plugin loader/metadata lint (EC-D7)");
  }
  const root = dirFlag ?? rest[0];
  if (!root || !existsSync(root)) {
    fail(`pluginlint: plugin root not found: ${root ?? "(none given)"}`);
    return finish("plugin loader/metadata lint (EC-D7)");
  }

  // C1 + C4 — SKILL.md frontmatter: a plain-scalar value containing a colon
  // breaks the loader's YAML parse; skill name must match its directory.
  const skillMds = collectSkillMds(root);
  const before = failures.length;
  for (const f of skillMds) {
    const text = readFileSync(f, "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      fail(`${f}: no YAML frontmatter block`);
      continue;
    }
    let name = null;
    fm[1].split("\n").forEach((line, i) => {
      const kv = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*))?$/);
      if (!kv) return;
      const key = kv[1];
      const val = (kv[2] ?? "").trim();
      if (key === "name") name = val;
      if (val === "" || /^['">|&*]/.test(val)) return; // empty / quoted / block scalar / anchor — safe
      if (/:(\s|$)/.test(val)) {
        fail(`${f}:${i + 2}: frontmatter "${key}:" is a plain scalar containing a colon — the plugin loader's YAML parse breaks on this. Quote it or use a ">-" block scalar. Offending line: "${line.trim()}"`);
      }
    });
    const dirName = basename(dirname(f));
    if (name !== null && name !== dirName) {
      fail(`${f}: frontmatter name "${name}" ≠ directory name "${dirName}" — the loader resolves skills by directory`);
    }
  }
  if (skillMds.length > 0 && failures.length === before) {
    ok(`${skillMds.length} SKILL.md frontmatter block(s): parse-safe scalars, names match directories`);
  }

  // C2 — plugin.json required fields.
  const pluginJson = [join(root, ".claude-plugin", "plugin.json"), join(root, "plugin.json")].find((p) => existsSync(p));
  if (pluginJson) {
    try {
      const pj = JSON.parse(readFileSync(pluginJson, "utf8"));
      let bad = false;
      for (const field of ["name", "version", "description"]) {
        if (!pj[field] || typeof pj[field] !== "string") {
          fail(`${pluginJson}: missing required field "${field}"`);
          bad = true;
        }
      }
      if (pj.version && !/^\d+\.\d+\.\d+/.test(pj.version)) {
        fail(`${pluginJson}: version "${pj.version}" is not semver-shaped (N.N.N)`);
        bad = true;
      }
      if (!bad) ok(`${pluginJson}: required fields present (name, version, description; semver version)`);
    } catch (e) {
      fail(`${pluginJson}: unparseable JSON — ${e.message}`);
    }
  }

  // C3 — marketplace.json plugins[].source paths must exist on disk.
  const mkt = [join(root, ".claude-plugin", "marketplace.json"), join(root, "marketplace.json")].find((p) => existsSync(p));
  if (mkt) {
    try {
      const m = JSON.parse(readFileSync(mkt, "utf8"));
      const base = basename(dirname(mkt)) === ".claude-plugin" ? dirname(dirname(mkt)) : dirname(mkt);
      let bad = false;
      for (const entry of m.plugins ?? []) {
        if (typeof entry?.source !== "string") continue;
        const resolved = join(base, entry.source);
        if (!existsSync(resolved)) {
          fail(`${mkt}: plugins[] entry "${entry.name ?? "?"}" source "${entry.source}" does not exist on disk (resolved: ${resolved})`);
          bad = true;
        }
      }
      if (!bad) ok(`${mkt}: all plugins[].source paths exist`);
    } catch (e) {
      fail(`${mkt}: unparseable JSON — ${e.message}`);
    }
  }

  if (skillMds.length === 0 && !pluginJson && !mkt) {
    fail(`${root}: nothing to lint — no SKILL.md, plugin.json, or marketplace.json found under root`);
  }
  finish("plugin loader/metadata lint (EC-D7)");
}

// ---------------------------------------------------------------- mirror-check
// PRD §D7: the skill is shipped twice (repo root + plugins/plan-it). These 8
// pairs must stay byte-identical; drift → exit 2 listing every drifted pair.
const MIRROR_PAIRS = [
  ["SKILL.md", "plugins/plan-it/skills/plan-it/SKILL.md"],
  ["machine.json", "plugins/plan-it/skills/plan-it/machine.json"],
  ["scripts/gate-check.mjs", "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs"],
  ["scripts/hooks/planit-guard.mjs", "plugins/plan-it/scripts/hooks/planit-guard.mjs"],
  ["references/formats.md", "plugins/plan-it/skills/plan-it/references/formats.md"],
  ["references/machine.md", "plugins/plan-it/skills/plan-it/references/machine.md"],
  ["references/playbooks.md", "plugins/plan-it/skills/plan-it/references/playbooks.md"],
  ["references/templates.md", "plugins/plan-it/skills/plan-it/references/templates.md"],
];

function cmdMirrorCheck(rawArgs) {
  // Fixture mode: `mirror-check --dir <root>` compares <root>/root/<file> vs
  // <root>/plugins/plan-it/<file>. Real mode (no args): the fixed 8-pair list
  // from the repo root. Bound to the shared --dir parser (Epic A4/D2).
  const { dir: dirFlag, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    console.error(`mirror-check: ${dirErr}`);
    process.exit(2);
  }
  let pairs = MIRROR_PAIRS;
  let base = ".";
  if (dirFlag) {
    base = dirFlag;
    const rootDir = join(base, "root");
    if (!existsSync(rootDir)) {
      console.error(`mirror-check: fixture root not found: ${rootDir}`);
      process.exit(2);
    }
    pairs = readdirSync(rootDir).map((n) => [join("root", n), join("plugins", "plan-it", n)]);
  }
  const drifted = [];
  for (const [rootRel, plugRel] of pairs) {
    const a = join(base, rootRel);
    const b = join(base, plugRel);
    if (!existsSync(a) || !existsSync(b)) {
      drifted.push(`${rootRel} ↔ ${plugRel}: missing counterpart (${!existsSync(a) ? a : b})`);
      continue;
    }
    const ba = readFileSync(a);
    const bb = readFileSync(b);
    if (ba.equals(bb)) {
      ok(`${rootRel} ≡ ${plugRel} (${ba.length} bytes)`);
      continue;
    }
    let off = 0;
    const n = Math.min(ba.length, bb.length);
    while (off < n && ba[off] === bb[off]) off++;
    drifted.push(`${rootRel} ↔ ${plugRel}: drift at byte offset ${off} (sizes ${ba.length} vs ${bb.length})`);
  }
  if (drifted.length === 0) {
    console.log(`PASS — mirror-check: ${pairs.length} pair(s) byte-identical`);
    process.exit(0);
  }
  console.error(`FAIL — mirror-check: ${drifted.length} of ${pairs.length} pair(s) drifted`);
  for (const d of drifted) console.error(`  ✗ ${d}`);
  process.exit(2); // distinct drift exit, per T-C3-06
}

// ---------------------------------------------------------------- main
const [, , cmd, ...args] = process.argv;
const commands = { verify: cmdVerify, freeze: cmdFreeze, handoff: cmdHandoff, state: cmdState, contract: cmdContract, testconv: cmdTestconv, reconcile: cmdReconcile, pluginlint: cmdPluginlint, "mirror-check": cmdMirrorCheck };
if (!cmd || !(cmd in commands)) {
  console.error("usage: gate-check <verify|freeze|handoff|state|contract|testconv|reconcile|pluginlint|mirror-check> [args...]");
  console.error("  verify  <path...>                    files/dirs exist and are non-empty");
  console.error("  freeze  <CONTRACT.md|--dir repo-root>  frozen-contract structural check (+ casesReviewed in --dir mode)");
  console.error("  handoff <delivery-dir|--dir repo-root>  pre-handoff consistency lint (+ embedded reconcile)");
  console.error("  state   <state.json> [machine.json]  validate run state, print next events");
  console.error("  contract <--dir repo-root|CONTRACT.md>  W1 hygiene lint + computed tally (W5)");
  console.error("  testconv --dir <repo-root> [--register [text] | --decline]  FD-1 conventions discovery (exit 2 = needs registration)");
  console.error("  reconcile --dir <repo-root>          W5 orphan scan + FD-2 draft→binding case map");
  console.error("  pluginlint <plugin-root|--dir plugin-root>  loader/metadata lint (frontmatter, plugin.json, marketplace source, name↔dir)");
  console.error("  mirror-check [--dir fixture-root]    PRD §D7 mirror parity — exit 2 on drift");
  process.exit(1);
}
commands[cmd](args);
