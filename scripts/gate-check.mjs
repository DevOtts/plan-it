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
import { join, dirname, basename, resolve } from "node:path";
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

function cmdHandoff(args) {
  // Tolerate the CONTRACT `run:` syntax (`handoff --dir <path>`) until the
  // global --dir parser ships (Squad A); their parser makes this shim inert.
  const dir = args[0] === "--dir" ? args[1] : args[0];
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

    // 6. (C-W4-02) Every VERIFIED claim needs a run-output reference — a
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

    // 7. (C-W4-03) STATUS-board vocabulary: any table with a `Status` column
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
function cmdPluginlint([root]) {
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

// ---------------------------------------------------------------- main
const [, , cmd, ...args] = process.argv;
const commands = { verify: cmdVerify, freeze: cmdFreeze, handoff: cmdHandoff, state: cmdState, pluginlint: cmdPluginlint };
if (!cmd || !(cmd in commands)) {
  console.error("usage: gate-check <verify|freeze|handoff|state|pluginlint> [args...]");
  console.error("  verify  <path...>                    files/dirs exist and are non-empty");
  console.error("  freeze  <CONTRACT.md>                frozen-contract structural check");
  console.error("  handoff <delivery-dir>               pre-handoff consistency lint");
  console.error("  state   <state.json> [machine.json]  validate run state, print next events");
  console.error("  pluginlint <plugin-root>             loader/metadata lint (frontmatter, plugin.json, marketplace source, name↔dir)");
  process.exit(1);
}
commands[cmd](args);
