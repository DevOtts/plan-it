#!/usr/bin/env node
/**
 * gate-check — plan-it's deterministic guards, as exit codes instead of prose.
 *
 * Subcommands (exit 0 = pass, exit 1 = fail with named reasons):
 *   verify  <path...>                 every path exists and is non-empty (Rule 3: idle ≠ delivered)
 *   freeze  <CONTRACT.md>             frozen-CONTRACT structural check (Rule 1: no contract → no squads)
 *   handoff <delivery-dir>            mechanizable half of the pre-handoff lint (playbooks §F)
 *   state   <state.json> [machine.json]  validate the run state; print current state + allowed events
 *   preflight <S|M|L> [--dir <target>]   run the shape-tiered env probes, write ENV-FACTS.md (v3 W2)
 *   machine-diff <live.json> <base.json> live machine must be an additive-only superset of baseline (v3 E1)
 *
 * Zero npm dependencies — node: builtins only. Portable across macOS/Linux/Windows.
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
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
  // v3 D11 (W3/G1): a frozen package must carry its RUN-POLICY — tiering table,
  // the reap-on-merge worktree rule, and BOTH halves of the disk-AND-message
  // delivery rule. Additive failure branch; every existing check above unchanged.
  const rp = text.match(/^##\s+RUN-POLICY[^\n]*\n([\s\S]*?)(?=\n##\s|$)/m);
  if (!rp) {
    fail(`no "## RUN-POLICY" section — the tiering policy must be frozen into the package (W3/G1)`);
  } else {
    const body = rp[1];
    if (!body.includes("reap-on-merge")) fail(`RUN-POLICY body missing the "reap-on-merge" worktree rule`);
    if (!body.includes("results to disk") || !body.includes("content-bearing final message")) {
      fail(`RUN-POLICY body missing the disk-AND-message delivery rule (need both "results to disk" and "content-bearing final message")`);
    }
    // v3 D12a (G2): RUN-POLICY content-provenance — every tier value must trace
    // (tier-word-normalized) to this run's recorded gates.G1.decisions. Only
    // checkable when a run state is discoverable from the cwd; structural
    // checks above still bind without one.
    const statePath = join(process.cwd(), ".plan-it", "state.json");
    if (existsSync(statePath)) {
      try {
        const st = JSON.parse(readFileSync(statePath, "utf8"));
        if (st?.gates?.G1?.decisions) for (const f of checkRunPolicySeeded(text, st)) fail(f);
      } catch {
        /* unreadable run state — the structural RUN-POLICY checks above still bind */
      }
    }
  }
  if (failures.length === 0) ok(`${path}: version header, ${sections} sections, changelog, RUN-POLICY, no placeholders`);
  finish("contract frozen");
}

// ---------------------------------------------------------------- v3: preflight (W2)
// Shape-tiered probe sets (formats.md §9). S = 6 probes; M/L = the same 6 + 3.
export const PROBE_SET_S = [
  "config-reachability",
  "live-registry",
  "deployed-vs-installed",
  "credential-validity",
  "dependency-actual-usage",
  "code-vs-external-split",
];
export const PROBE_SET_ML = [
  ...PROBE_SET_S,
  "tool-availability",
  "caller-consumer-surface",
  "secret-scan-on-import",
];

const PROBE_TIMEOUT_MS = 10_000; // C-W2-04: hard per-probe budget — recorded as TIMEOUT, never hangs the run

function firstLine(s) {
  const l = String(s ?? "").split(/\r?\n/).find((x) => x.trim()) ?? "";
  return l.trim().replaceAll("|", "\\|").slice(0, 160);
}

function envFactsMarkdown(shape, rows) {
  const lines = [
    "# ENV-FACTS — probed environment facts (never guessed)",
    "",
    `- shape: ${shape} (${rows.length}-probe set — formats.md §9)`,
    "- generated-by: `gate-check preflight` (deterministic; re-run to refresh)",
    "- status vocabulary: PRESENT | ABSENT | TIMEOUT — ABSENT/TIMEOUT fail the preflight gate",
    "",
    "| id | check | status | evidence |",
    "|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | \`${r.check}\` | ${r.status} | ${r.evidence} |`),
    "",
  ];
  return lines.join("\n");
}

function cmdPreflight(rawArgs) {
  // preflight <S|M|L> [--dir <target>]
  let target = ".";
  const rest = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--dir") target = rawArgs[++i] ?? ".";
    else rest.push(rawArgs[i]);
  }
  const shape = (rest[0] ?? "").toUpperCase();
  if (rest[1]) target = rest[1];
  if (!["S", "M", "L"].includes(shape)) {
    fail("preflight: usage: gate-check preflight <S|M|L> [--dir <target>]");
    return finish("preflight env facts");
  }
  const required = shape === "S" ? PROBE_SET_S : PROBE_SET_ML;
  const probesPath = join(target, "ENV-PROBES.json");
  if (!existsSync(probesPath)) {
    fail(`no ENV-PROBES.json in ${target} — author this run's probes first (formats.md §9); facts are probed, never guessed`);
    return finish("preflight env facts");
  }
  let defs;
  try {
    defs = JSON.parse(readFileSync(probesPath, "utf8")).probes ?? [];
  } catch (e) {
    fail(`cannot read/parse ${probesPath}: ${e.message}`);
    return finish("preflight env facts");
  }
  const byId = new Map(defs.map((p) => [p.id, p]));
  for (const id of required) {
    const p = byId.get(id);
    if (!p) fail(`probe "${id}" (required for shape ${shape}) missing from ${probesPath}`);
    else if (!Array.isArray(p.check) || p.check.length === 0) fail(`probe "${id}": "check" must be a non-empty argv array`);
  }
  for (const p of defs) {
    if (!required.includes(p.id)) fail(`probe "${p.id}" is not in the ${shape}-shape set (exactly ${required.length} probes — formats.md §9)`);
  }
  if (failures.length > 0) return finish("preflight env facts");
  const rows = [];
  for (const id of required) {
    const p = byId.get(id);
    let status, evidence;
    try {
      const out = execFileSync(p.check[0], p.check.slice(1), {
        cwd: target,
        encoding: "utf8",
        timeout: PROBE_TIMEOUT_MS,
        killSignal: "SIGKILL",
        stdio: ["ignore", "pipe", "pipe"],
      });
      status = "PRESENT";
      evidence = firstLine(out) || "exit 0";
    } catch (e) {
      // Recorded, never fatal: a dead or hanging probe must not abort the sweep (C-W2-04).
      if (e.signal || e.killed || e.code === "ETIMEDOUT") {
        status = "TIMEOUT";
        evidence = `killed after ${PROBE_TIMEOUT_MS}ms budget`;
      } else {
        status = "ABSENT";
        evidence = firstLine(e.stderr || e.stdout || e.message) || `exit ${e.status ?? "?"}`;
      }
    }
    rows.push({ id, check: p.check.join(" "), status, evidence });
    (status === "PRESENT" ? ok : fail)(`${id}: ${status} — ${evidence}`);
  }
  // ENV-FACTS.md is written even when probes fail: recording the facts IS the job.
  const factsPath = join(target, "ENV-FACTS.md");
  writeFileSync(factsPath, envFactsMarkdown(shape, rows));
  console.log(`  → wrote ${factsPath} (${rows.length} probes)`);
  finish(`preflight env facts (${shape}-shape; fail-closed on ABSENT/TIMEOUT)`);
}

// ---------------------------------------------------------------- v3: machine-diff (E1, D1 Option 2)
export function checkMachineAdditive(live, base) {
  const out = [];
  const edge = (t) => (Array.isArray(t) ? t[0] : t) ?? {};
  if (live.initial !== base.initial) out.push(`initial changed: "${base.initial}" → "${live.initial}"`);
  for (const [name, bNode] of Object.entries(base.states ?? {})) {
    const lNode = live.states?.[name];
    if (!lNode) {
      out.push(`baseline state missing/renamed in live machine: "${name}"`);
      continue;
    }
    if (bNode.type === "final" && lNode.type !== "final") out.push(`baseline final state "${name}" is no longer final`);
    for (const [ev, bT] of Object.entries(bNode.on ?? {})) {
      const lT = lNode.on?.[ev];
      if (!lT) {
        out.push(`baseline transition dropped: ${name}.on.${ev}`);
        continue;
      }
      const b = edge(bT), l = edge(lT);
      if ((b.guard ?? null) !== (l.guard ?? null)) {
        out.push(`guard mapping changed on ${name}.on.${ev}: "${b.guard ?? "(none)"}" → "${l.guard ?? "(none)"}"`);
      }
      if (l.target !== b.target) {
        if (!live.states?.[l.target]) out.push(`edge ${name}.on.${ev} retargeted to unknown state "${l.target}"`);
        else if (base.states?.[l.target]) out.push(`edge ${name}.on.${ev} retargeted from "${b.target}" to pre-existing baseline state "${l.target}" — only insertion of NEW states is additive`);
        // else: retargeted through a NEW state — additive insertion, allowed.
      }
    }
  }
  for (const g of Object.keys(base.meta?.guards ?? {})) {
    if (!live.meta?.guards?.[g]) out.push(`baseline guard missing/renamed in live machine: "${g}"`);
  }
  return out;
}

function cmdMachineDiff([livePath, basePath]) {
  if (!livePath || !basePath) {
    fail("machine-diff: usage: gate-check machine-diff <live-machine.json> <baseline-machine.json>");
    return finish("machine additive-only vs baseline");
  }
  let live = null, base = null;
  try { live = JSON.parse(readFileSync(livePath, "utf8")); } catch (e) { fail(`cannot read/parse ${livePath}: ${e.message}`); }
  try { base = JSON.parse(readFileSync(basePath, "utf8")); } catch (e) { fail(`cannot read/parse ${basePath}: ${e.message}`); }
  if (live && base) for (const f of checkMachineAdditive(live, base)) fail(f);
  if (failures.length === 0) ok(`${livePath} is an additive-only superset of ${basePath}`);
  finish("machine additive-only vs baseline (no state/event/guard dropped, renamed, or retargeted into old states)");
}

// ---------------------------------------------------------------- v3: tiering policy (W3/G2)
// D12a — RUN-POLICY tiers must trace to this run's recorded G1 decisions.
// Model-tier words are normalized to tier words before matching, so decisions
// recorded as model names still seed tier rows (tiers, not models, are binding).
export function checkRunPolicySeeded(contractText, stateJson) {
  const out = [];
  const decisions = stateJson?.gates?.G1?.decisions;
  if (!decisions) {
    out.push("RUN-POLICY provenance: state gates.G1.decisions missing — tiering policy has no recorded G1 source");
    return out;
  }
  const rp = String(contractText).match(/^##\s+RUN-POLICY[^\n]*\n([\s\S]*?)(?=\n##\s|$)/m);
  if (!rp) {
    out.push('RUN-POLICY provenance: no "## RUN-POLICY" section to check');
    return out;
  }
  const norm = JSON.stringify(decisions)
    .toLowerCase()
    .replace(/haiku/g, " low ")
    .replace(/sonnet/g, " mid ")
    .replace(/opus/g, " top ")
    .replace(/fable/g, " top ")
    .replace(/coordinator|main-thread/g, " top ");
  const rows = [...rp[1].matchAll(/^\|([^|\n]+)\|([^|\n]+)\|/gm)]
    .map((m) => ({ slice: m[1].trim(), tier: m[2].trim().toLowerCase() }))
    .filter((r) => r.tier && r.tier !== "tier" && !/^[-: ]+$/.test(r.tier));
  if (rows.length === 0) out.push("RUN-POLICY provenance: no tier table rows found in the RUN-POLICY body");
  for (const r of rows) {
    if (!norm.includes(` ${r.tier} `) && !norm.includes(r.tier)) {
      out.push(`RUN-POLICY provenance: tier "${r.tier}" (slice "${r.slice}") does not trace to any gates.G1.decisions value (tier-word-normalized)`);
    }
  }
  return out;
}

// D9/D12b — every epic section must bind a Tier Table with the four fields:
// tier | effort | escalation | scaffold-pointer. The pointer is a real pointer
// (fable-it:<preset> or .claude/agents/<file>.md), never inline prompt prose.
const TIER_HEADER_RE = /^\|\s*tier\s*\|\s*effort\s*\|\s*escalation\s*\|\s*scaffold-pointer\s*\|?\s*$/i;
const POINTER_RE = /^(fable-it:[A-Za-z0-9_.:\/-]+(#[A-Za-z0-9_-]+=[^\s|]+)*|\.claude\/agents\/[A-Za-z0-9_.-]+\.md)$/;

export function checkEpicTierTable(epicText) {
  const out = [];
  const sections = [...String(epicText).matchAll(/^##\s+(?!#)([^\n]+)\n([\s\S]*?)(?=\n##\s|$)/gm)]
    .map(([, title, body]) => ({ title: title.trim(), body }))
    .filter((s) => /^(epic\b|[A-Z]{1,3}\d+\b)/i.test(s.title));
  if (sections.length === 0) {
    out.push("no epic sections (## Epic … / ## <ID> …) found — nothing to tier-check");
    return out;
  }
  for (const { title, body } of sections) {
    const lines = body.split("\n");
    const h = lines.findIndex((l) => TIER_HEADER_RE.test(l.trim()));
    if (h === -1) {
      out.push(`epic "${title}": no Tier Table (need header: | tier | effort | escalation | scaffold-pointer |) — C-W3-01`);
      continue;
    }
    let sawRow = false;
    for (let i = h + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l.startsWith("|")) break;
      if (/^\|[\s|:-]+\|$/.test(l)) continue; // separator row
      const cells = l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      if (cells.length < 4) {
        out.push(`epic "${title}": Tier Table row has ${cells.length} cells — all 4 fields required (tier, effort, escalation, scaffold-pointer)`);
        continue;
      }
      sawRow = true;
      const [tier, effort, escalation, pointer] = cells;
      if (!tier) out.push(`epic "${title}": Tier Table row missing tier`);
      if (!effort) out.push(`epic "${title}": Tier Table row missing effort`);
      if (!escalation) out.push(`epic "${title}": Tier Table row missing escalation`);
      if (!pointer) out.push(`epic "${title}": Tier Table row missing scaffold-pointer`);
      else if (/\s/.test(pointer)) out.push(`epic "${title}": scaffold-pointer contains whitespace — inline prompt prose is not a pointer: "${pointer.slice(0, 60)}"`);
      else if (!POINTER_RE.test(pointer)) out.push(`epic "${title}": scaffold-pointer "${pointer}" does not match the pointer grammar (fable-it:<preset>[#k=v…] or .claude/agents/<name>.md)`);
    }
    if (!sawRow) out.push(`epic "${title}": Tier Table has a header but no rows`);
  }
  return out;
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

function findMachine(explicit, requested) {
  if (explicit) return explicit; // CLI arg always wins
  const here = dirname(fileURLToPath(import.meta.url));
  // v3 D6: a run's state.json may carry an optional top-level "machine" key
  // (e.g. "machine-replan.json") selecting which statechart binds this run.
  // Absent key → machine.json, byte-identical to v2 behavior.
  if (typeof requested === "string" && requested) {
    if (existsSync(requested)) return requested;
    for (const c of [join(here, "..", requested), join(process.cwd(), requested)]) {
      if (existsSync(c)) return c;
    }
    return null;
  }
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
  const mp = findMachine(machinePath, state.machine);
  if (!mp) {
    fail(
      state.machine
        ? `machine "${state.machine}" (selected by state.json "machine" key) not found`
        : "machine.json not found (pass its path as the second argument)"
    );
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
  const gateState = (g) => Object.entries(states).find(([, n]) => n.meta?.gate === g)?.[0];
  // v3 D7 (E4): once the G3 gate state is in history, every recorded known-gap
  // row must carry a disposition ∈ {fix, waive, case-ify} — EC-B7.
  const g3state = gateState("G3");
  const g3 = state.gates?.G3;
  if (g3state && visited.has(g3state) && g3 && "knownGaps" in g3) {
    if (!Array.isArray(g3.knownGaps)) {
      fail("gates.G3.knownGaps must be an array of gap rows");
    } else {
      g3.knownGaps.forEach((row, i) => {
        const d = row?.disposition;
        if (!["fix", "waive", "case-ify"].includes(d)) {
          fail(`G3 known-gap ${i + 1} ("${row?.gap ?? row?.id ?? "unnamed"}"): disposition ${d ? `"${d}"` : "missing"} — every gap needs fix, waive, or case-ify (EC-B7)`);
        }
      });
    }
  }
  // v3 D8 (E5): credentials recorded at the G2 gate must be procured or
  // GATED-with-owner, and GATED rows must appear in the frozen CONTRACT.
  const g2state = gateState("G2");
  const g2 = state.gates?.G2;
  if (g2state && visited.has(g2state) && g2 && Array.isArray(g2.credentials)) {
    for (const c of g2.credentials) {
      const cname = c?.name ?? "(unnamed credential)";
      if (!["procured", "GATED-with-owner"].includes(c?.status)) {
        fail(`credential "${cname}": status ${c?.status ? `"${c.status}"` : "missing"} — must be procured or GATED-with-owner${c?.owner ? "" : " (an ungated, unowned credential blocks handoff)"}`);
        continue;
      }
      if (c.status !== "GATED-with-owner") continue;
      if (!c.owner) {
        fail(`credential "${cname}": GATED-with-owner requires an owner`);
        continue;
      }
      const cp = state.contract?.path;
      if (!cp) {
        fail(`credential "${cname}": GATED-with-owner but state contract.path is null — no frozen CONTRACT to carry the gate row`);
        continue;
      }
      const stateDir = dirname(resolve(statePath));
      const baseDir = stateDir.endsWith(".plan-it") ? dirname(stateDir) : stateDir;
      const cAbs = [resolve(baseDir, cp), resolve(process.cwd(), cp)].find((p) => existsSync(p));
      if (!cAbs) {
        fail(`credential "${cname}": contract file "${cp}" not found — cannot cross-check the gate row`);
        continue;
      }
      const ctext = readFileSync(cAbs, "utf8");
      if (ctext.includes(cname) && ctext.includes("GATED-with-owner") && ctext.includes(c.owner)) {
        ok(`credential "${cname}": GATED-with-owner (owner: ${c.owner}) — cross-checked in ${cp}`);
      } else {
        fail(`credential "${cname}": GATED-with-owner row not found in ${cp} (need the credential name, "GATED-with-owner", and owner "${c.owner}" in the frozen CONTRACT)`);
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

// ---------------------------------------------------------------- main
const commands = {
  verify: cmdVerify,
  freeze: cmdFreeze,
  handoff: cmdHandoff,
  state: cmdState,
  preflight: cmdPreflight,
  "machine-diff": cmdMachineDiff,
};

// Import-safe: dispatch only when run as a CLI, so tests can import the
// exported check* functions without side effects.
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , cmd, ...args] = process.argv;
  if (!cmd || !(cmd in commands)) {
    console.error("usage: gate-check <verify|freeze|handoff|state|preflight|machine-diff> [args...]");
    console.error("  verify  <path...>                    files/dirs exist and are non-empty");
    console.error("  freeze  <CONTRACT.md>                frozen-contract structural check (incl. RUN-POLICY)");
    console.error("  handoff <delivery-dir>               pre-handoff consistency lint");
    console.error("  state   <state.json> [machine.json]  validate run state, print next events");
    console.error("  preflight <S|M|L> [--dir <target>]   probe env facts → ENV-FACTS.md (fail-closed)");
    console.error("  machine-diff <live.json> <base.json> live machine additive-only vs baseline");
    process.exit(1);
  }
  commands[cmd](args);
}
