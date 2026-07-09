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
 *   adversary <delivery-dir|--dir root> failure-mode depth: declared machine models failures+recovery, cascade classes covered-or-waived (v3.2 D4)
 *
 * Zero npm dependencies — node: builtins only. Portable across macOS/Linux/Windows.
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, statSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
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
//
// W3.1-1: the inline span is newline-tolerant — an author who line-wraps an
// inline code span (`vault rotate\n--resume <id>`) is still *describing* the
// token, not leaving a placeholder, so it must strip. But an unterminated
// backtick must not swallow the whole document: the lazy `[^`]*?` stops at the
// very next backtick, and a span that straddles a blank line (a paragraph
// break — never a real inline span) is kept, so a bare-prose `<id>` between two
// distant backticks stays visible and the placeholder scan still fails closed.
function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*?`/g, (m) => (/\n\s*\n/.test(m) ? m : ""));
}

function cmdFreeze(rawArgs) {
  const { dir, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`freeze: ${dirErr}`);
    return finish("contract frozen");
  }
  let path;
  if (dir) {
    // Generalized --dir path (W3.1-2): a real project freezes delivery/CONTRACT.md;
    // plan-it's own dogfood layout is delivery/v3/CONTRACT.md. Prefer the real
    // path, fall back to the dogfood path (also the missing-file error path).
    const cands = [join(dir, "delivery", "CONTRACT.md"), join(dir, "delivery", "v3", "CONTRACT.md")];
    path = cands.find(existsSync) || cands[1];
  } else {
    path = rest[0];
  }
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
  // W3.1-2: the v3 freeze hardenings key off "is there a v3 run backing this
  // contract", not the --dir flag. --dir is an explicit run root; a positional
  // freeze resolves one only when the contract is at a run root's canonical
  // delivery path with a sibling .plan-it/state.json (resolveRunRoot). Either
  // way, a freestanding v2 contract stays byte-identical (runRoot === null).
  const runRoot = dir || resolveRunRoot(path);
  const isV3Run = runRoot !== null;
  // C-W1-03 (Epic A4) — additive: no freeze before the FD-2 case review has
  // landed in the run state.
  if (runRoot) {
    const st = readState(runRoot);
    if (st?.casesReviewed !== true) {
      fail(`C-W1-03: casesReviewed !== true in ${join(runRoot, ".plan-it", "state.json")} — the Test Contract case review must land before the contract freezes`);
    }
  }
  // v3 D11 (W3/G1) [T-B2-04]: a frozen package must carry its RUN-POLICY —
  // tiering table, the reap-on-merge worktree rule, and BOTH halves of the
  // disk-AND-message delivery rule. Additive: v2 semantics stay byte-identical
  // when the contract never speaks of RUN-POLICY. Presence is required when
  // (a) the contract references RUN-POLICY outside code spans (mention-vs-use,
  // same stripCode convention as the placeholder scan), or (b) freeze runs in
  // --dir mode (the v3 package path). NOTE: end-of-string in the lookahead is
  // written (?![\s\S]) — a bare $ under /m matches every line end and would
  // truncate the body to its first line.
  const rp = text.match(/^##\s+RUN-POLICY[^\n]*\n([\s\S]*?)(?=\n##\s|(?![\s\S]))/m);
  if (!rp) {
    if (isV3Run || /RUN-POLICY/.test(stripCode(text))) {
      fail(`no "## RUN-POLICY" section — the tiering policy must be frozen into the package (W3/G1)`);
    }
  } else {
    const body = rp[1];
    if (!body.includes("reap-on-merge")) fail(`RUN-POLICY body missing the "reap-on-merge" worktree rule`);
    if (!body.includes("results to disk") || !body.includes("content-bearing final message")) {
      fail(`RUN-POLICY body missing the disk-AND-message delivery rule (need both "results to disk" and "content-bearing final message")`);
    }
    // v3 D12a (G2): RUN-POLICY content-provenance — every tier value must trace
    // (tier-word-normalized) to this run's recorded gates.G1.decisions. Only
    // checkable when a run state is discoverable (--dir root, else cwd);
    // structural checks above still bind without one.
    const statePath = join(runRoot || process.cwd(), ".plan-it", "state.json");
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
        else if (base.states?.[l.target]) out.push(`edge ${name}.on.${ev} retargeted (baseline "${b.target}" → "${l.target}") onto a pre-existing baseline state — only insertion of NEW states is additive`);
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

// ---------------------------------------------------------------- v3.2: adversary (adversarial-depth gate, D4)
// The D4 crown-jewel lever. v3's earlier enforcement raised the FLOOR
// (traceability, honesty, computed counts) but never touched the failure-mode
// DEPTH CEILING — which is set UPSTREAM by the CONTRACT's core-logic state
// machine. A thin machine (happy path + one failure) yields shallow tests that
// still pass every other v3 gate; the field trial's D4 tie was exactly this.
// This gate makes failure-mode depth mechanizable: exit code, not prose.
//
// It is conditional on a DECLARED state machine — a linear/CRUD workflow
// declares none and the whole gate is N/A (no over-reach; mirrors "no run-state
// ⇒ no v3 demands"). Every demand is COVERED-or-WAIVED: a genuinely simple flow
// waives a class with a reason (v2's CB-1 pattern), and silent absence fails
// closed. Design-depth reads the frozen CONTRACT (D-A*); coverage-depth reads
// the epics/cases (D-B*).

// A state token: an UPPER-CASE identifier of ≥2 chars (SCHEDULED, ROLLED_BACK,
// VERIFY-FAILED). Common all-caps non-states are stopworded so they never seed
// a phantom obligation.
const STATE_TOKEN_RE = /[A-Z][A-Z0-9]+(?:[_-][A-Z0-9]+)*/g;
const STATE_STOPWORDS = new Set([
  "RUN", "POLICY", "REAL", "TBD", "TODO", "CONTRACT", "API", "CLI", "SHA", "MD5", "JSON", "YAML",
  "ID", "IDS", "DOD", "PRD", "AMD", "FD", "CB", "REST", "HTTP", "HTTPS", "URL", "URI", "UUID",
  "OK", "NA", "WAIVED", "AND", "OR", "NOT", "THE", "FOR", "GET", "PUT", "POST", "CRUD", "MVP",
  "SLA", "UTC", "ISO", "CSV", "XML", "SQL", "CPU", "RAM", "PII", "TTL", "PR", "CI", "CD", "QA",
]);
// A transition arrow: -->, →, or a labelled --(label)-->. This is what defines
// a state MACHINE (a lifecycle graph) — as opposed to a value enumeration.
const ARROW_RE = /-+\s*\([^)]*\)\s*-*>|-{1,}>|=>|→/;
// A *lifecycle* enumeration authoritatively lists machine states: its type name
// is lifecycle-ish (RotationState, VerifyStatus, *Phase/*Stage/*Machine). A
// plain value enum (ActionResult := OK|DENIED|ERROR, AdapterType := …) is NOT a
// machine and must not seed phantom state obligations — that conflation is what
// would false-fail a deep package on a value like "DENIED".
const LIFECYCLE_ENUM_RE = /^[^\n:=]*\b\w*(?:state|status|phase|stage|lifecycle|machine)\b[^\n:=]*:{1,2}=(.+)$/i;
function isMachineLine(line) {
  return ARROW_RE.test(line);
}
// States = tokens that are transition endpoints (source/target of an arrow, plus
// any dangling state named on an arrow line), UNION the members of a lifecycle
// enumeration. Arrow-label prose (inside `(…)`) is stripped so words like the
// "FAILED" in "--(some PASSED, some FAILED)-->" never count as a state.
function extractStates(contractText) {
  const states = new Set();
  for (const rawLine of String(contractText).split("\n")) {
    if (ARROW_RE.test(rawLine)) {
      const noLabels = rawLine.replace(/\([^)]*\)/g, " ");
      for (const m of noLabels.matchAll(STATE_TOKEN_RE)) {
        if (!STATE_STOPWORDS.has(m[0])) states.add(m[0]);
      }
    }
    const em = rawLine.match(LIFECYCLE_ENUM_RE);
    if (em) {
      for (const m of em[1].matchAll(STATE_TOKEN_RE)) {
        if (!STATE_STOPWORDS.has(m[0])) states.add(m[0]);
      }
    }
  }
  return states;
}

// Failure/terminal-error state taxonomy (matched against state NAMES) and the
// recovery/compensation vocabulary (matched against CONTRACT prose).
const FAILURE_TAXONOMY_RE = /FAIL|ERROR|ROLL.?BACK|ESCALAT|PARTIAL|ABORT|TIMEOUT|REJECT|DENIED|CANCEL/i;
const RECOVERY_VOCAB_RE = /\bre-?verif|\bresume\b|\bretry\b|\brollback\b|re-?dispatch|\brestore\b|operator fixes|\bcompensat/i;

// A loose matcher for a state token in prose: separators become optional so
// ROLLED_BACK / ROLLED-BACK / "rolled back" all match one declared state.
function stateProseRe(token) {
  const body = token
    .split(/[_-]/)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s_-]?");
  return new RegExp(`\\b${body}\\b`, "i");
}

// Is any failure-named state the SOURCE of a transition edge? (a failure state
// with an outgoing arrow = a recovery/compensation path, structurally.)
function hasFailureSourceEdge(contractText) {
  const re = new RegExp(`([A-Z][A-Z0-9_-]+)\\s*(?:${ARROW_RE.source})`, "g");
  for (const line of String(contractText).split("\n")) {
    if (!isMachineLine(line)) continue;
    for (const m of line.matchAll(re)) {
      if (FAILURE_TAXONOMY_RE.test(m[1])) return true;
    }
  }
  return false;
}

// The five cascade classes — the "beat v2 by far" lever. Each must be COVERED
// (a case asserts it) or WAIVED (named with a reason); silent absence fails.
// NOTE on word boundaries: the leading `\b` is load-bearing. Without it,
// `roll[\s_-]?back` matches inside "sc-rollback" (scrollback) and false-passes a
// package that never rolls anything back. The `(?:ed|s|ing)?` infix catches
// ROLLED_BACK / "rolled back" / rollback / "roll back" as one class.
const CASCADE_CLASSES = [
  { key: "partial-failure", cover: /\bpartial[\s_-]?fail|\bpartially (?:failed|applied|propagated|revoked)/i, name: /\bpartial/i },
  { key: "rollback/compensation", cover: /\broll(?:ed|s|ing)?[\s_-]?back\b|\bcompensat|\brevert\b|\bundo\b/i, name: /\broll(?:ed|s|ing)?[\s_-]?back\b|\bcompensat|\brevert\b/i },
  { key: "failed-recovery→escalation", cover: /\bescalat|\bunrecoverab|\broll(?:ed|s|ing)?[\s_-]?back\b[^.\n]*\bfail|\bdead[\s-]?letter\b/i, name: /\bescalat|\bunrecoverab/i },
  { key: "recovery/resume", cover: /\bresume\b|\bre-?verif|\bretry\b|\bre-?dispatch\b|\brecover(?:s|ed|y|ing)?\b|\boperator fixes\b/i, name: /\bresume\b|\brecover|\bretry\b|\bre-?verif/i },
  { key: "adversarial-verify", cover: /\badversar|\btamper|\bexternally (?:overwritten|modified|changed|altered)|\bre-?reads?\b|\bround[\s_-]?trip\b|\bproves it\b/i, name: /\badversar|\btamper|\bround[\s_-]?trip\b/i },
];

// A class is WAIVED when a line names it (its `name` regex) alongside an
// explicit WAIVED / N/A marker AND a reason (an em/en dash, `--`, `: text`,
// "because", or a leading "no").
function classWaived(waiverText, klass) {
  for (const line of String(waiverText).split("\n")) {
    if (!/\b(WAIVED|N\/A)\b/i.test(line)) continue;
    if (!klass.name.test(line)) continue;
    if (/—|–|--|:\s*\S|because|\bno\b/i.test(line)) return line.trim().slice(0, 120);
  }
  return null;
}

// Pure, importable core (mirrors checkMachineAdditive / checkEpicTierTable).
// Returns { na, problems[], notes[] } — na ⇒ no declared machine ⇒ gate PASS.
export function checkAdversarialDepth({ contractText = "", epicText = "", waiverText = "" }) {
  const problems = [];
  const notes = [];
  const states = extractStates(contractText);

  // Gate condition: a declared, multi-step state machine. Fewer than 2 declared
  // states ⇒ a linear/CRUD flow ⇒ the whole gate is N/A (no over-reach).
  if (states.size < 2) {
    notes.push(`no multi-state machine declared in CONTRACT (${states.size} state token(s)) — linear/CRUD workflow, adversarial-depth gate N/A`);
    return { na: true, problems, notes };
  }
  const failureStates = [...states].filter((s) => FAILURE_TAXONOMY_RE.test(s));
  notes.push(`declared ${states.size} states; ${failureStates.length} failure state(s): ${failureStates.join(", ") || "(none)"}`);

  // D-A1 — the machine must model at least one failure state.
  if (failureStates.length === 0) {
    problems.push(`D-A1: CONTRACT declares a ${states.size}-state machine but models NO failure state (taxonomy: FAIL|ERROR|ROLLBACK|ESCALAT|PARTIAL|ABORT|TIMEOUT|REJECT|DENIED) — model the failure path, or reduce to a linear flow (which is N/A here)`);
  }

  // D-A2 — at least one recovery/compensation transition: recovery vocabulary in
  // the CONTRACT, or a failure state that is the source of an outgoing edge.
  if (failureStates.length > 0 && !RECOVERY_VOCAB_RE.test(contractText) && !hasFailureSourceEdge(contractText)) {
    problems.push(`D-A2: no recovery/compensation transition — the machine enters a failure state but nothing leaves it (no failure-state-source edge, no re-verify/resume/retry/rollback/restore vocabulary). A dead-end failure is a design gap or must be WAIVED`);
  }

  // D-B1 — every declared failure state is an asserted outcome of ≥1 case.
  for (const s of failureStates) {
    if (!stateProseRe(s).test(epicText)) {
      problems.push(`D-B1: failure state "${s}" is declared in the machine but no test case asserts it as an outcome — an unreachable-in-tests failure state is a coverage hole`);
    }
  }

  // D-B2 — every governance rule (G-n / CB-n) is referenced by a case, carries
  // an inline (test: …) hook, or is explicitly WAIVED. Schema-free teeth
  // (revives the deferred E3): SOMETHING must declare each rule tested.
  const govIds = [...new Set([...String(contractText).matchAll(/\b((?:G|CB)-\d+)\b/g)].map((m) => m[1]))];
  const contractLines = String(contractText).split("\n");
  for (const g of govIds) {
    const gRe = new RegExp(`\\b${g}\\b`);
    const inEpic = gRe.test(epicText);
    const hooked = contractLines.some((l) => gRe.test(l) && /\(test:|WAIVED|N\/A|\binverse-op\b|\bnegative\b/i.test(l));
    if (!inEpic && !hooked) {
      problems.push(`D-B2: governance rule "${g}" has no test hook — not referenced by any case, and its CONTRACT line carries no "(test: …)" / WAIVED marker`);
    }
  }

  // D-B3 — the five cascade classes, each COVERED or WAIVED. This is the lever.
  for (const klass of CASCADE_CLASSES) {
    if (klass.cover.test(epicText)) {
      notes.push(`cascade "${klass.key}": COVERED`);
      continue;
    }
    const waiver = classWaived(waiverText, klass);
    if (waiver) {
      notes.push(`cascade "${klass.key}": WAIVED — ${waiver}`);
      continue;
    }
    problems.push(`D-B3: cascade class "${klass.key}" is neither COVERED by a case nor explicitly WAIVED — silent absence fails closed. Add a case that exercises it, or waive it with a reason (e.g. "${klass.key}: N/A — <why>")`);
  }

  return { na: false, problems, notes };
}

function cmdAdversary(rawArgs) {
  const label = "adversarial-depth (D4: failure-mode coverage)";
  const { dir, rest, dirErr } = parseDirFlag(rawArgs);
  if (dirErr) {
    fail(`adversary: ${dirErr}`);
    return finish(label);
  }
  let deliveryDir;
  if (dir) {
    deliveryDir = existsSync(join(dir, "delivery")) ? join(dir, "delivery") : dir;
  } else {
    deliveryDir = rest[0];
    if (!deliveryDir) {
      fail("adversary: usage: gate-check adversary <delivery-dir> | gate-check adversary --dir <repo-root>");
      return finish(label);
    }
  }
  if (!existsSync(deliveryDir)) {
    fail(`adversary: delivery dir not found: ${deliveryDir}`);
    return finish(label);
  }
  const cands = [join(deliveryDir, "CONTRACT.md"), join(deliveryDir, "v3", "CONTRACT.md")];
  const contractPath = cands.find(existsSync) || cands[0];
  let contractText;
  try {
    contractText = readFileSync(contractPath, "utf8");
  } catch {
    fail(`adversary: CONTRACT not found: ${contractPath}`);
    return finish(label);
  }

  // Coverage text = every case-bearing epic file under delivery, EXCLUDING the
  // CONTRACT itself (the CONTRACT *declares* the machine; it is never coverage).
  const files = collectMdFiles(deliveryDir);
  const contractAbs = resolve(contractPath);
  const caseRe = /\bT-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\b/;
  const epicParts = [];
  for (const f of files) {
    if (resolve(f) === contractAbs) continue;
    const t = readFileSync(f, "utf8");
    const norm = f.replace(/\\/g, "/");
    if (/\/epics?\//i.test(norm) || /^epics?[-.]/i.test(basename(norm)) || caseRe.test(t)) {
      epicParts.push(t);
    }
  }
  const epicText = epicParts.join("\n\n");

  // Waivers may also live in a decisions.md. Candidates are anchored to the
  // RESOLVED delivery/repo dirs only — never a bare CWD-relative path, which
  // would leak the invoking repo's own delivery/decisions.md into an unrelated
  // package under test (a test-isolation + correctness hazard).
  const decisionCands = [join(deliveryDir, "decisions.md"), join(deliveryDir, "..", "decisions.md")];
  if (dir) decisionCands.unshift(join(dir, "delivery", "decisions.md"));
  let decisionsText = "";
  for (const dp of decisionCands) {
    if (existsSync(dp)) {
      decisionsText = readFileSync(dp, "utf8");
      break;
    }
  }
  const waiverText = `${epicText}\n\n${decisionsText}`;

  const res = checkAdversarialDepth({ contractText, epicText, waiverText });
  for (const n of res.notes) console.log(`  · ${n}`);
  if (res.na) {
    console.log(`PASS — ${label}: N/A — ${res.notes[res.notes.length - 1]}`);
    process.exit(0);
  }
  for (const p of res.problems) fail(p);
  if (failures.length === 0) {
    ok("failure-mode depth: machine models failures + recovery; every declared failure state & cascade class is covered-or-waived");
  }
  finish(label);
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
  // end-of-string spelled (?![\s\S]): a bare $ under /m truncates the body to
  // its first line (it matches every line end).
  const rp = String(contractText).match(/^##\s+RUN-POLICY[^\n]*\n([\s\S]*?)(?=\n##\s|(?![\s\S]))/m);
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
  // end-of-string spelled (?![\s\S]): a bare $ under /m truncates each section
  // body to its first line (it matches every line end).
  const sections = [...String(epicText).matchAll(/^##\s+(?!#)([^\n]+)\n([\s\S]*?)(?=\n##\s|(?![\s\S]))/gm)]
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
    //    PRDs are excluded: they carry design-area headings (`D1 — …`) that the
    //    `[A-Z]\d+ —` shorthand would misread as epics. Epics live under epics/.
    const isPrd = /\/prds?\//.test(f.replace(/\\/g, "/"));
    const epicHeads = isPrd ? [] : [...text.matchAll(/^#{2,3}\s+([A-Z]\d+[^\n]*epic[^\n]*|epic\s+[A-Z]\d+[^\n]*|[A-Z]\d+\s+—[^\n]*)/gim)];
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
    // A run-output reference near line i: a fenced block, a `run:`/`output:`
    // citation, or an inline receipt that a command actually RAN — an exit code
    // or a `decisions.md` evidence citation. A bare case ID is NOT a receipt (it
    // references a case, it does not prove the case ran) — so the C-W4-02
    // fixture, whose only near-token is a `T-E9-01` Test-Contract row, still
    // fails closed. "verified means ran, not read."
    const REF_RE = /```|\b(run|output):|\bexit\s+\d|decisions\.md/i;
    const hasRunRef = (i) => {
      const from = Math.max(0, i - 5);
      const to = Math.min(lines.length - 1, i + 5);
      for (let j = from; j <= to; j++) if (REF_RE.test(lines[j])) return true;
      return false;
    };
    // A multi-line vocabulary enumeration (all four status terms within a few
    // lines) is a definition of the vocabulary, not a status claim.
    const vocabEnumNear = (i) => {
      const from = Math.max(0, i - 2), to = Math.min(lines.length - 1, i + 2);
      const win = lines.slice(from, to + 1).join(" ");
      return /NOT-STARTED/.test(win) && /IN-PROGRESS/.test(win) && /IMPLEMENTED-NOT-VERIFIED/.test(win);
    };
    // The Status column of a board table, if the file has one (board-row claims
    // carry their evidence in the same row, not necessarily a fenced block).
    const boardStatusCol = (() => {
      for (const l of lines) {
        if (!/^\s*\|/.test(l)) continue;
        const cells = l.split("|").slice(1, -1).map((c) => c.trim().toLowerCase());
        const c = cells.findIndex((x) => x === "status");
        if (c !== -1) return c;
      }
      return -1;
    })();
    lines.forEach((line, i) => {
      const scannable = line.replace(/`[^`\n]*`/g, ""); // backticked = mention
      if (!/(?<!NOT-)\bVERIFIED\b/.test(scannable)) return;
      if (vocabEnumNear(i)) return; // vocabulary definition, not a claim
      // C-W4-02 governs the VERIFIED *tag* — an assigned status — not every
      // prose occurrence of the word. Recognize a status assignment via: a
      // board Status-column cell == VERIFIED; a `Status: VERIFIED` line; or a
      // predicate "… is/are/was/were VERIFIED", minus negation ("never/not/
      // rather"), compound labels ("VERIFIED-…"), and the verb sense
      // ("…VERIFIED all four…", where a noun follows).
      let isTag = false;
      if (boardStatusCol !== -1 && /^\s*\|/.test(line)) {
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        if ((cells[boardStatusCol] ?? "").toUpperCase() === "VERIFIED") isTag = true;
      }
      if (!isTag && /\bstatus\b[^\n|]*[:=]\s*\**\s*VERIFIED\b/i.test(scannable)) isTag = true;
      if (!isTag
          && /\b(is|are|was|were)\s+\**VERIFIED\b(?!\s+(?:all|the|every|each|both|these|those|[a-z]+\s+(?:verbs|cases|rows|items)))/.test(scannable)
          && !/\b(never|not|rather|n't)\b/i.test(scannable)
          && !/VERIFIED-/.test(scannable)) isTag = true;
      if (!isTag) return; // prose mention of the word — not an assigned tag
      if (!hasRunRef(i)) {
        fail(`${f}:${i + 1}: VERIFIED status tag without a run-output reference (fenced output, run:/output:, exit code, or decisions.md citation) within 5 lines — verified means ran, not read`);
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
  // v3 D6 (E2, additive on the canon line): state.json may select its machine
  // via the optional top-level "machine" key; absent → byte-identical v2 lookup.
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

// W3.1-2: a positional `freeze <CONTRACT.md>` is v3-backed when the contract
// sits at a run root's canonical delivery path AND that root carries a
// `.plan-it/state.json`. This is deliberately narrow — it matches only a
// contract literally at `<root>/delivery/CONTRACT.md` or
// `<root>/delivery/v3/CONTRACT.md` with a sibling run state — so a freestanding
// v2 contract (e.g. a test fixture that happens to live inside some repo's tree)
// never resolves a stray ancestor `.plan-it/` and stays byte-identical v2.
// Returns the run root, or null (⇒ v2 mode).
function resolveRunRoot(contractPath) {
  const p = resolve(contractPath);
  for (const suffix of ["/delivery/CONTRACT.md", "/delivery/v3/CONTRACT.md"]) {
    if (p.endsWith(suffix)) {
      const root = p.slice(0, -suffix.length);
      return existsSync(join(root, ".plan-it", "state.json")) ? root : null;
    }
  }
  return null;
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

// C-W2-03 — cross-squad seam (Squad B preflight ⇄ Squad A contract). Parse an
// ENV-FACTS.md (written by `gate-check preflight`) and return the set of tool
// command tokens the environment cannot supply — every non-flag token in the
// `check` argv of any row whose status is ABSENT or TIMEOUT (both "fail the
// preflight gate", per the ENV-FACTS header). Absent file → empty set, so the
// cross-check is a no-op until a preflight has actually run.
function unavailableToolsFromEnvFacts(dir) {
  const factsPath = join(dir, "ENV-FACTS.md");
  const unavailable = new Set();
  if (!existsSync(factsPath)) return unavailable;
  for (const line of readFileSync(factsPath, "utf8").split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cells.length < 3) continue;
    const [id, check, status] = cells;
    if (id === "id" || /^-+$/.test(id)) continue; // header / separator
    if (status !== "ABSENT" && status !== "TIMEOUT") continue;
    for (const tok of check.replace(/`/g, "").split(/\s+/)) {
      if (tok && !tok.startsWith("-")) unavailable.add(tok);
    }
  }
  return unavailable;
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
    // C-W2-03 — a case whose run: invokes a tool the environment probe marked
    // ABSENT/TIMEOUT must not be treated as runnable. The invoked tool is the
    // command name (first token) of the run: cell; matching an ENV-FACTS
    // ABSENT tool fails the contract (the case cannot actually be executed here).
    const unavailable = unavailableToolsFromEnvFacts(dir);
    if (unavailable.size > 0) {
      for (const r of rows) {
        if (!r.run || r.run.startsWith("manual:")) continue;
        const cmd = r.run.split(/\s+/)[0];
        if (unavailable.has(cmd)) {
          fail(`C-W2-03: case ${r.id} run: invokes "${cmd}", which ENV-FACTS.md marks ABSENT/TIMEOUT — the case is not runnable in this environment (probe the tool or gate the case)`);
        }
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

  // C-W5-02 — PRD requirement with no covering epic (orphan). Requirement IDs
  // are collected per section, skipping risk-register / assumption / out-of-
  // scope sections: an `R3` under `## Risks` is a risk register entry, not a
  // requirement that an epic must cover.
  for (const f of mdUnder(join(root, "delivery", "v3", "prds"))) {
    const raw = stripCode(readFileSync(f, "utf8"));
    const reqs = new Set();
    for (const sec of raw.split(/^(?=#{2,3}\s)/m)) {
      const head = (sec.match(/^#{2,3}\s+([^\n]*)/) || [, ""])[1];
      if (/\b(risk|assumption|out[- ]of[- ]scope|non[- ]goal)/i.test(head)) continue;
      for (const m of sec.matchAll(/\bR-?\d+\b/g)) reqs.add(m[0]);
    }
    for (const r of reqs) {
      if (!epicTexts.some(([, t]) => new RegExp(`\\b${r}\\b`).test(t))) {
        fail(`C-W5-02: requirement ${r} in ${f} has no covering epic under delivery/v3/epics (orphan)`);
      }
    }
  }

  // C-W3-01 (D9/D12b, Epic E2) — tiering must be bound to a Tier Table. v3
  // centralizes RUN-POLICY in the frozen CONTRACT (`## RUN-POLICY`, governed at
  // program level per 00-program-plan.md), so when the package carries a
  // central tier policy, a per-epic table is not additionally required — the
  // "no Tier Table" finding is suppressed. A malformed per-epic table is still
  // reported. A package with NO central policy (e.g. the no-tier fixture, which
  // has no CONTRACT.md) still fails closed.
  const centralTierPolicy = (() => {
    const cpath = join(root, "delivery", "v3", "CONTRACT.md");
    if (!existsSync(cpath)) return false;
    // end-of-string spelled (?![\s\S]): a bare $ under /m matches every line end
    // and would truncate the section to its heading line (table unseen).
    const m = readFileSync(cpath, "utf8").match(/^##\s+RUN-POLICY\b[\s\S]*?(?=\n##\s|(?![\s\S]))/m);
    return !!m && m[0].split("\n").some((l) => /^\s*\|/.test(l) && /\btier\b/i.test(l));
  })();
  for (const [f, epicText] of epicTexts) {
    for (const finding of checkEpicTierTable(epicText)) {
      if (finding.startsWith("no epic sections")) continue;
      if (centralTierPolicy && /no Tier Table/.test(finding)) continue; // tiering frozen centrally (RUN-POLICY)
      fail(`${finding} [${f}]`);
    }
  }

  // C-W5-03 — epic heading with zero Binding Test Contract case rows
  // (generalizes cmdHandoff's presence-check to a row-count check).
  for (const [f, text] of epicTexts) {
    for (const eh of text.matchAll(/^(#{2,3})\s+(?:[Ee]pic\s+)?([A-Z]\d+)\b[^\n]*/gm)) {
      const rest = text.slice(eh.index + eh[0].length);
      const nextHead = rest.search(new RegExp(`^#{1,${eh[1].length}}\\s`, "m"));
      const section = nextHead === -1 ? rest : rest.slice(0, nextHead);
      // A binding row is any of the package's sanctioned case grammars: the
      // synthetic `T-A4-01` form, the FD-2 B-series `T-A4-B1` form that keeps
      // the draft-ID letter, OR a direct CONTRACT enforcement ID (`C-W1-04` /
      // `C-META-01`) — epics that bind straight to contract rows (e.g. A2) use
      // the latter (decisions.md 2026-07-07/-08).
      const rows = (section.match(/\|\s*(?:T-[A-Z]\d+[A-Za-z0-9.]*-(?:[A-Z]\d+|\d{2})|C-(?:W\d+|META)-\d{2})\s*\|/g) || []).length;
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
      const bullet = line.match(/^\s*-\s+(.*)$/);
      if (!bullet) continue;
      // Draft IDs are DECLARED only in the LEADING run of the bullet — the
      // ID(s) before the first descriptor ("[REAL]", " — ", ": ", "("). An ID
      // appearing later in the sentence is a prose citation (e.g. "Stream D F6"
      // inside F1's description) and neither declares nor binds a draft case
      // (decisions.md 2026-07-08 ruling; the pre-existing comment intended this
      // but the old per-line matchAll leaked mid-sentence IDs).
      // Emphasis markers (`**Z9**`, `_A1_`) are transparent in the leading run,
      // so a bolded draft ID is still a declaration; the run still stops at the
      // first real descriptor char (—, [, :, (, lowercase word), so mid-sentence
      // IDs stay excluded.
      const head = bullet[1].match(/^((?:[A-Z]\d+|[*_]|,|&|\band\b|\s)+)/);
      if (!head) continue;
      for (const m of head[1].matchAll(/[A-Z]\d+/g)) drafts.add(m[0]);
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
    // Test-fixture trees deliberately carry broken SKILL.md files (the
    // pluginlint violating fixtures), and node_modules is third-party; neither
    // is a shipped plugin unit, so a whole-repo `pluginlint .` must not walk
    // into them. Fixture-scoped runs pass the fixture dir AS root, so their
    // skills sit directly below root (not under a nested `tests/`) and are
    // still linted.
    if (e.isDirectory() && (e.name === "tests" || e.name === "node_modules")) continue;
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
    // The loader resolves skills by directory ONLY for the canonical
    // skills/<name>/SKILL.md layout. A top-level SKILL.md (repo/plugin root, or
    // a mirror copy) is not a loader path, so its name need not match the root
    // dir basename — scope the check to files whose parent sits under skills/.
    const dirName = basename(dirname(f));
    const skillsNested = basename(dirname(dirname(f))) === "skills";
    if (skillsNested && name !== null && name !== dirName) {
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
const commands = {
  verify: cmdVerify,
  freeze: cmdFreeze,
  handoff: cmdHandoff,
  state: cmdState,
  contract: cmdContract,
  testconv: cmdTestconv,
  reconcile: cmdReconcile,
  preflight: cmdPreflight,
  "machine-diff": cmdMachineDiff,
  adversary: cmdAdversary,
  pluginlint: cmdPluginlint,
  "mirror-check": cmdMirrorCheck,
};

// Import-safe: dispatch only when run as a CLI, so tests can import the
// exported check* functions without side effects.
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , cmd, ...args] = process.argv;
  if (!cmd || !(cmd in commands)) {
    console.error("usage: gate-check <verify|freeze|handoff|state|contract|testconv|reconcile|preflight|machine-diff|adversary|pluginlint|mirror-check> [args...]");
    console.error("  verify  <path...>                    files/dirs exist and are non-empty");
    console.error("  freeze  <CONTRACT.md|--dir repo-root>  frozen-contract structural check (+ casesReviewed in --dir mode; incl. RUN-POLICY)");
    console.error("  handoff <delivery-dir|--dir repo-root>  pre-handoff consistency lint (+ embedded reconcile)");
    console.error("  state   <state.json> [machine.json]  validate run state, print next events");
    console.error("  contract <--dir repo-root|CONTRACT.md>  W1 hygiene lint + computed tally (W5)");
    console.error("  testconv --dir <repo-root> [--register [text] | --decline]  FD-1 conventions discovery (exit 2 = needs registration)");
    console.error("  reconcile --dir <repo-root>          W5 orphan scan + FD-2 draft→binding case map");
    console.error("  preflight <S|M|L> [--dir <target>]   probe env facts → ENV-FACTS.md (fail-closed)");
    console.error("  machine-diff <live.json> <base.json> live machine additive-only vs baseline");
    console.error("  adversary <delivery-dir|--dir root>  failure-mode depth gate (D4): declared machine models failures+recovery; cascade classes covered-or-waived (N/A when no machine)");
    console.error("  pluginlint <plugin-root|--dir plugin-root>  loader/metadata lint (frontmatter, plugin.json, marketplace source, name↔dir)");
    console.error("  mirror-check [--dir fixture-root]    PRD §D7 mirror parity — exit 2 on drift");
    process.exit(1);
  }
  commands[cmd](args);
}
