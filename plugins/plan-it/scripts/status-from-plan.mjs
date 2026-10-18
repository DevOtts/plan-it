#!/usr/bin/env node
/**
 * status-from-plan — plan-it ST-02. Derives a plan.json from the epic files and
 * hands it to the shared status writer (build-it's status-write.mjs) to create
 * status.json (schema 1), then makes sure STATUS.md is rendered from it.
 *
 * plan-it never writes status.json itself (single-writer rule) and never emits
 * done/verified: every task is created not-started by the writer.
 *
 * Usage:
 *   status-from-plan --package <impl dir> [--epics <dir>] [--implementation <name>]
 *                    [--title T] [--dry-run]
 *
 * Writer resolution (D-09): env DOIT_STATUS_WRITE -> sibling install of build-it
 * next to ${CLAUDE_PLUGIN_ROOT} -> ~/.claude/plugins/**\/build-it/**\/scripts/status/
 * status-write.mjs (newest) -> sibling checkout ../build-it/plugins/build-it/...
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const MARKER =
  "<!-- generated from status.json by status-write; do not edit by hand -->";
const WRITER_REL = path.join("scripts", "status", "status-write.mjs");
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));

const isFile = (p) => {
  try { return fs.statSync(p).isFile(); } catch { return false; }
};
const isDir = (p) => {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
};

// ---------------------------------------------------------------- resolver
function findUnder(root, maxDepth) {
  const hits = [];
  const walk = (dir, depth) => {
    if (depth > maxDepth) return;
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory() || e.name === "node_modules" || e.name === ".git") continue;
      const full = path.join(dir, e.name);
      const cand = path.join(full, WRITER_REL);
      if (isFile(cand) && /(^|[\\/])build-it([\\/]|$)/.test(cand)) hits.push(cand);
      walk(full, depth + 1);
    }
  };
  walk(root, 0);
  return hits;
}

/**
 * Returns { path, source } or throws Error with a clear message listing what
 * was tried. All inputs injectable for tests.
 */
export function resolveWriter(opts = {}) {
  const env = opts.env ?? process.env;
  const home = opts.home ?? os.homedir();
  const pluginRoot = opts.pluginRoot ?? env.CLAUDE_PLUGIN_ROOT ?? path.resolve(SELF_DIR, "..");
  const repoRoot = opts.repoRoot ?? path.resolve(SELF_DIR, "..", "..", "..");
  const tried = [];

  if (env.DOIT_STATUS_WRITE) {
    tried.push(`env DOIT_STATUS_WRITE=${env.DOIT_STATUS_WRITE}`);
    if (isFile(env.DOIT_STATUS_WRITE)) return { path: env.DOIT_STATUS_WRITE, source: "env" };
    // An explicit env var that points nowhere is an error, not a fall-through.
    throw new Error(
      `status writer not found: DOIT_STATUS_WRITE points to a missing file (${env.DOIT_STATUS_WRITE})`,
    );
  }

  const sibling = [
    path.join(pluginRoot, "..", "build-it", WRITER_REL),
    path.join(pluginRoot, "..", "build-it", "plugins", "build-it", WRITER_REL),
  ];
  for (const c of sibling) {
    tried.push(c);
    if (isFile(c)) return { path: path.resolve(c), source: "sibling-install" };
  }
  // versioned cache layouts: <plugins>/build-it/<version>/scripts/status/...
  const parent = path.resolve(pluginRoot, "..");
  const siblingHit = findUnder(path.join(parent, "build-it"), 3);
  if (siblingHit.length) return { path: newest(siblingHit), source: "sibling-install" };

  const plugins = path.join(home, ".claude", "plugins");
  tried.push(`${plugins}/**/build-it/**/${WRITER_REL}`);
  const found = isDir(plugins) ? findUnder(plugins, 8) : [];
  if (found.length) return { path: newest(found), source: "claude-plugins" };

  const checkout = path.join(repoRoot, "..", "build-it", "plugins", "build-it", WRITER_REL);
  tried.push(checkout);
  if (isFile(checkout)) return { path: path.resolve(checkout), source: "sibling-checkout" };

  throw new Error(
    "status writer not found (build-it status-write.mjs). Tried:\n  " +
      tried.join("\n  ") +
      "\nInstall the build-it plugin or set DOIT_STATUS_WRITE=<path to status-write.mjs>.",
  );
}

function newest(files) {
  return files
    .map((f) => ({ f, t: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
}

// ---------------------------------------------------------------- parser
const EPIC_RE = /^##\s+(?:Epic\s+)?([A-Za-z][A-Za-z0-9]*)\s+[—–:-]+\s*(.*?)\s*$/;
const ITEM_RE = /^\s*[-*]\s+\[[ xX]\]\s+(.*\S)\s*$/;
const ID_RE = /^[`\[]?([A-Z][A-Z0-9]*-\d+)[`\]]?\s*[:—–-]?\s*/;
const TC_HEAD_RE = /^#{2,4}\s+Test Contract\b/i;

function stripId(text) {
  const m = ID_RE.exec(text);
  if (!m) return { id: null, title: text.trim() };
  const rest = text.slice(m[0].length).trim();
  return { id: m[1], title: rest || text.trim() };
}

function splitCells(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

/** Parse one epic markdown text into [{eid,title,wave,items[],groups[]}]. */
export function parseEpicText(text) {
  const lines = text.split(/\r?\n/);
  const epics = [];
  let cur = null;
  let inTC = false;
  let tcLevel = 0;
  let sub = null; // current TC sub-heading group
  let inFence = false;
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const lineNo = li + 1;
    if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const em = EPIC_RE.exec(raw);
    if (em && /^##\s/.test(raw) && !/^###/.test(raw)) {
      cur = { eid: em[1], title: em[2], line: lineNo, endLine: lines.length + 1, header: [], items: [], itemLines: [], groups: [], typeCounts: new Map() };
      if (epics.length) epics[epics.length - 1].endLine = lineNo; // block = [line, endLine)
      epics.push(cur);
      inTC = false; sub = null;
      continue;
    }
    if (!cur) continue;
    const h = /^(#{2,6})\s+(.*)$/.exec(raw);
    if (h) {
      const level = h[1].length;
      if (TC_HEAD_RE.test(raw)) {
        inTC = true; tcLevel = level; sub = null;
        cur.groups.push({ title: h[2].replace(/^Test Contract\s*[—–:-]*\s*/i, "").trim() || cur.eid, rows: 0, whole: true });
        continue;
      }
      if (inTC && level > tcLevel) {
        sub = { title: h[2].trim(), rows: 0 };
        cur.groups.push(sub);
        // a sub-heading splits the contract into real groups: drop the whole-contract placeholder
        cur.groups = cur.groups.filter((g) => !g.whole);
        continue;
      }
      if (inTC && level <= tcLevel) { inTC = false; sub = null; }
      continue;
    }
    if (inTC) {
      if (/^\s*\|/.test(raw)) {
        const cells = splitCells(raw);
        if (/^[-: ]+$/.test(cells.join("")) || /^id$/i.test(cells[0])) continue;
        if (!/^T-/i.test(cells[0] || "")) continue;
        const target = sub ?? cur.groups[cur.groups.length - 1];
        if (target) target.rows += 1;
        const type = (cells.find((c) => /^\[?(unit|e2e|use-?case|stress|property|golden|integration)\]?$/i.test(c)) || "").replace(/[\[\]]/g, "").toLowerCase();
        if (type) cur.typeCounts.set(type, (cur.typeCounts.get(type) || 0) + 1);
      }
      continue;
    }
    const im = ITEM_RE.exec(raw);
    if (im) { cur.items.push(im[1]); cur.itemLines.push(lineNo); continue; }
    if (cur.items.length === 0 && cur.header.length < 12) cur.header.push(raw);
  }
  for (const e of epics) {
    const hdr = e.header.join("\n");
    const wm = /\bwave\s*[:=]?\s*`?W?(\d+)/i.exec(hdr);
    e.wave = wm ? `W${wm[1]}` : "W1";
  }
  return epics;
}

export function findEpicFiles(pkg, epicsDir) {
  const dirs = epicsDir
    ? [epicsDir]
    : [path.join(pkg, "delivery", "epics"), path.join(pkg, "epics")];
  for (const d of dirs) {
    if (isDir(d)) {
      return fs.readdirSync(d).filter((f) => f.endsWith(".md")).sort().map((f) => path.join(d, f));
    }
  }
  return [];
}

// ---------------------------------------------------------------- D-29 ids
const MAP_NAME = "id-renames.json";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokenRe = (id, flags = "") => new RegExp(`(?<![A-Za-z0-9-])${esc(id)}(?![0-9])`, flags);
const posix = (p) => p.split(path.sep).join("/");

function readMap(pkg) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(pkg, MAP_NAME), "utf8"));
    return Array.isArray(m) ? m : [];
  } catch { return []; }
}

/**
 * Epic files -> ordered task list with source positions. `texts` (Map file->text)
 * overrides what is on disk (dry-run). Generated-id renames recorded in
 * <pkg>/id-renames.json are applied here (they have no source line to edit).
 */
export function collectTasks({ pkg, epicsDir, texts, genRenames = [] }) {
  const files = findEpicFiles(pkg, epicsDir);
  if (!files.length) {
    throw new Error(`no epic files found (looked in ${epicsDir ?? `${pkg}/delivery/epics and ${pkg}/epics`})`);
  }
  const genMap = new Map();
  for (const r of [...readMap(pkg), ...genRenames]) if (r.generated && r.epic) genMap.set(`${r.file}|${r.epic}|${r.old}`, r.new);
  const epics = [];
  for (const f of files) {
    const text = texts?.get(f) ?? fs.readFileSync(f, "utf8");
    for (const e of parseEpicText(text)) epics.push({ ...e, file: f });
  }
  if (!epics.length) throw new Error("no epics parsed (expected '## E1 — title' headings)");
  const out = [];
  for (const e of epics) {
    const rel = posix(path.relative(pkg, e.file));
    const mk = (id, title, generated, line) => {
      const mapped = generated ? genMap.get(`${rel}|${e.eid}|${id}`) : undefined;
      return { id: mapped ?? id, title, generated, line, epic: e, from: mapped ? id : undefined };
    };
    let tasks = [];
    if (e.items.length) {
      e.items.forEach((it, i) => {
        const { id, title: t } = stripId(it);
        tasks.push(id ? mk(id, t, false, e.itemLines[i]) : mk(`${e.eid}-${String(i + 1).padStart(2, "0")}`, t, true, e.line));
      });
    } else {
      let groups = e.groups.filter((g) => g.rows > 0 || !g.whole);
      if (groups.length === 1 && groups[0].whole && e.typeCounts.size > 1) {
        groups = [...e.typeCounts].map(([t, n]) => ({ title: `${t} cases`, rows: n }));
      } else if (groups.length === 1 && groups[0].whole) {
        groups = [{ title: `Test Contract (${groups[0].rows} cases)`, rows: groups[0].rows }];
      }
      tasks = groups.map((g, i) => mk(`${e.eid}-${String(i + 1).padStart(2, "0")}`, `${e.eid}: ${g.title}`.slice(0, 200), true, e.line));
    }
    out.push(...tasks);
  }
  return { epics, tasks: out };
}

function walkFiles(root) {
  const res = [];
  const go = (d) => {
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) go(full);
      else if (e.isFile()) res.push(full);
    }
  };
  go(root);
  return res;
}

function outsideRefs(pkg, oldId, notes) {
  const top = spawnSync("git", ["-C", pkg, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (top.status !== 0) { notes.notGit = true; return []; }
  const root = fs.realpathSync(top.stdout.trim());
  const rel = posix(path.relative(root, fs.realpathSync(pkg)));
  const args = ["-C", root, "grep", "-n", "-I", "--untracked", "-E", `(^|[^A-Za-z0-9-])${esc(oldId)}([^0-9]|$)`, "--", "."];
  if (rel && !rel.startsWith("..")) args.push(`:(exclude)${rel}`);
  const g = spawnSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (g.status === 1) return [];
  if (g.status !== 0) return [{ file: root, line: 0, msg: `outside-reference check failed (git grep: ${(g.stderr || "").trim()})` }];
  const re = tokenRe(oldId);
  const hits = [];
  for (const l of g.stdout.split("\n")) {
    const m = /^(.*?):(\d+):(.*)$/.exec(l);
    if (m && re.test(m[3])) hits.push({ file: path.join(root, m[1]), line: Number(m[2]), msg: `outside the package references ${oldId}` });
  }
  return hits;
}

/**
 * D-29. Finds duplicate task ids and plans consistent renames. Pure: nothing is
 * written. Returns { renames, ambiguous, outside, edits, notGit } where edits is
 * Map<epic file, rewritten text>.
 */
export function planRenames({ pkg, epicsDir, texts }) {
  const { epics, tasks } = collectTasks({ pkg, epicsDir, texts });
  const rel = (f) => posix(path.relative(pkg, f));
  const used = new Set();
  const dups = [];
  const kept = new Map();
  for (const t of tasks) {
    if (used.has(t.id)) dups.push(t); else { used.add(t.id); kept.set(t.id, t); }
  }
  // next free number per series, from the highest number anywhere in the plan
  const next = new Map();
  const serie = (id) => { const m = /^(.*?)(\d+)$/.exec(id); return m ? { prefix: m[1], n: Number(m[2]), w: m[2].length } : null; };
  for (const t of tasks) {
    const s = serie(t.id);
    if (s) next.set(s.prefix, Math.max(next.get(s.prefix) ?? 0, s.n + 1));
  }
  const renames = [];
  for (const t of dups) {
    const s = serie(t.id);
    let cand;
    if (s) {
      do { const n = next.get(s.prefix); next.set(s.prefix, n + 1); cand = s.prefix + String(n).padStart(s.w, "0"); } while (used.has(cand));
    } else {
      let n = 2; do { cand = `${t.id}-${n++}`; } while (used.has(cand));
    }
    used.add(cand);
    renames.push({ old: t.id, new: cand, file: rel(t.epic.file), line: t.line, generated: t.generated, task: t });
  }

  const ambiguous = [];
  const outside = [];
  const notes = {};
  const lineEdits = new Map(); // abs file -> Map(lineNo -> [{old,new}])
  const addEdit = (f, ln, old, nw) => {
    if (!lineEdits.has(f)) lineEdits.set(f, new Map());
    const m = lineEdits.get(f);
    if (!m.has(ln)) m.set(ln, []);
    m.get(ln).push({ old, new: nw });
  };
  const epicFiles = new Set(epics.map((e) => e.file));
  const scan = [...new Set([...walkFiles(pkg), ...epicFiles])];
  const SKIP = new Set(["status.json", MAP_NAME, "STATUS.md"]);
  const fileLines = new Map();
  for (const f of scan) {
    if (SKIP.has(path.basename(f)) && !epicFiles.has(f)) continue;
    let text = texts?.get(f);
    if (text === undefined) {
      try { if (fs.statSync(f).size > 5 * 1024 * 1024) continue; text = fs.readFileSync(f, "utf8"); } catch { continue; }
    }
    if (text.includes("\0")) continue;
    if (text.split("\n", 1)[0] === MARKER) continue;
    fileLines.set(f, text.split("\n"));
  }

  for (const r of renames) {
    r.references_updated = [];
    if (r.generated) continue; // no source line; recorded in the map, applied by collectTasks
    const same = tasks.filter((t) => t.id === r.old && !t.generated);
    const blockOf = (t) => t.epic;
    const B = blockOf(r.task);
    const holdsOnlyThis = tasks.filter((t) => t.epic === B && t.id === r.old).length === 1;
    const defLines = new Set(same.map((t) => `${t.epic.file}:${t.line}`));
    const re = tokenRe(r.old);
    for (const [f, lines] of fileLines) {
      if (re.test(posix(path.relative(pkg, f)))) {
        ambiguous.push({ file: f, line: 0, msg: `file name contains ${r.old}` });
      }
      lines.forEach((text, i) => {
        const ln = i + 1;
        if (!re.test(text)) return;
        if (defLines.has(`${f}:${ln}`)) {
          if (f === B.file && ln === r.line) addEdit(f, ln, r.old, r.new);
          return;
        }
        if (f === B.file && ln >= B.line && ln < B.endLine && holdsOnlyThis) addEdit(f, ln, r.old, r.new), r.references_updated.push({ file: rel(f), line: ln });
        else ambiguous.push({ file: f, line: ln, msg: `ambiguous reference to ${r.old} (renamed to ${r.new} in ${rel(B.file)}:${r.line}); fix by hand` });
      });
    }
    outside.push(...outsideRefs(pkg, r.old, notes));
  }
  const edits = new Map();
  for (const [f, m] of lineEdits) {
    const lines = [...fileLines.get(f)];
    for (const [ln, es] of m) for (const e of es) lines[ln - 1] = lines[ln - 1].replace(tokenRe(e.old, "g"), e.new);
    edits.set(f, lines.join("\n"));
  }
  return { renames, ambiguous, outside, edits, notGit: !!notes.notGit };
}

/** Writes the planned edits atomically (tmp + rename) and appends the rename map. */
export function applyRenames({ pkg, plan }) {
  const staged = [];
  for (const [f, text] of plan.edits) {
    const tmp = `${f}.d29-${process.pid}.tmp`;
    fs.writeFileSync(tmp, text);
    staged.push([tmp, f]);
  }
  for (const [tmp, f] of staged) fs.renameSync(tmp, f);
  if (plan.renames.length) {
    const mapFile = path.join(pkg, MAP_NAME);
    const all = readMap(pkg);
    const at = new Date().toISOString();
    for (const r of plan.renames) {
      const e = { old: r.old, new: r.new, file: r.file, line: r.line, references_updated: r.references_updated, at };
      if (r.generated) { e.generated = true; e.epic = r.task.epic.eid; }
      all.push(e);
    }
    const tmp = `${mapFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(all, null, 2) + "\n");
    fs.renameSync(tmp, mapFile);
  }
}

/** Epic markdown files -> plan.json (writer input). Never carries a status. */
export function buildPlan({ pkg, epicsDir, implementation, title, texts, genRenames }) {
  const { epics, tasks } = collectTasks({ pkg, epicsDir, texts, genRenames });
  const seen = new Set();
  for (const t of tasks) {
    if (seen.has(t.id)) throw new Error(`duplicate task id ${t.id} (run status-from-plan to rename it consistently, D-29)`);
    seen.add(t.id);
  }
  const waves = new Map();
  const pieces = [];
  for (const e of epics) {
    const mine = tasks.filter((t) => t.epic === e).map((t) => ({ id: t.id, title: t.title }));
    if (!waves.has(e.wave)) waves.set(e.wave, []);
    waves.get(e.wave).push(...mine);
    pieces.push({
      piece: `${e.eid} — ${e.title}`.slice(0, 200),
      whats_left: mine.length ? `All ${mine.length} tasks` : "Nothing planned yet",
    });
  }
  const waveList = [...waves.entries()]
    .sort((a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)))
    .map(([id, tasks]) => ({ id, title: `Wave ${id.slice(1)}`, tasks }));
  const plan = { implementation: implementation ?? path.basename(path.resolve(pkg)), waves: waveList, pieces };
  if (title) plan.title = title;
  return plan;
}

// ---------------------------------------------------------------- CLI
function parseArgs(argv) {
  const o = { dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") o.dry = true;
    else if (["--package", "--epics", "--implementation", "--title"].includes(a)) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      o[a.slice(2)] = v;
    } else throw new Error(`unknown argument: ${a}`);
  }
  if (!o.package) throw new Error("--package <implementation dir> is required");
  return o;
}

function statusMdPath(pkg) {
  return isDir(path.join(pkg, "delivery")) ? path.join(pkg, "delivery", "STATUS.md") : path.join(pkg, "STATUS.md");
}

export function main(argv = process.argv.slice(2), env = process.env) {
  let o;
  try { o = parseArgs(argv); } catch (e) {
    console.error(`status-from-plan: ${e.message}\nusage: status-from-plan --package <dir> [--epics <dir>] [--implementation <name>] [--title T] [--dry-run]`);
    return 2;
  }
  const pkg = path.resolve(o.package);
  const epicsDir = o.epics && path.resolve(o.epics);
  const file = path.join(pkg, "status.json");
  let plan;
  let d29;
  const mapEntry = (r) => ({ old: r.old, new: r.new, file: r.file, line: r.line, generated: true, epic: r.task.epic.eid });
  try {
    d29 = planRenames({ pkg, epicsDir });
  } catch (e) {
    console.error(`status-from-plan: ${e.message}`);
    return 1;
  }
  const where = (x) => `${x.file}${x.line ? `:${x.line}` : ""}`;
  const real = d29.renames.filter((r) => !r.generated);
  if (real.length && d29.notGit) console.log("outside-reference check skipped: not in a git repo");
  const problems = [...d29.ambiguous, ...d29.outside];
  const live = d29.renames.length > 0 && fs.existsSync(file);
  if (problems.length || live) {
    console.error("status-from-plan: duplicate task ids cannot be renamed safely (D-29); nothing was changed.");
    for (const x of problems) console.error(`  ${where(x)}: ${x.msg}`);
    if (live) {
      console.error(`  ${file}: board already exists; the writer refuses id changes past not-started. Rename these by hand and re-run: ${d29.renames.map((r) => `${r.old} (${r.file}:${r.line})`).join(", ")}`);
    }
    return 1;
  }
  const say = (r) => `${r.old} -> ${r.new} at ${r.file}:${r.line}${r.generated ? " (generated id, recorded in the map only)" : ""}, ${r.references_updated.length} reference(s) updated`;
  if (o.dry) {
    try {
      plan = buildPlan({ pkg, epicsDir, implementation: o.implementation, title: o.title, texts: d29.edits, genRenames: d29.renames.filter((r) => r.generated).map(mapEntry) });
    } catch (e) { console.error(`status-from-plan: ${e.message}`); return 1; }
    for (const r of d29.renames) console.log(`status-from-plan: would rename ${say(r)}`);
    console.log(JSON.stringify(plan, null, 2));
    return 0;
  }

  let writer;
  try { writer = resolveWriter({ env }); } catch (e) {
    console.error(`status-from-plan: ${e.message}`);
    return 1;
  }
  try {
    if (d29.renames.length) applyRenames({ pkg, plan: d29 });
    // plan.json always comes from the (rewritten) source, so source and status cannot diverge
    plan = buildPlan({ pkg, epicsDir, implementation: o.implementation, title: o.title });
  } catch (e) {
    console.error(`status-from-plan: ${e.message}`);
    return 1;
  }
  {
    for (const r of d29.renames) console.log(`status-from-plan: renamed ${say(r)}`);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "status-from-plan-"));
  const planFile = path.join(tmp, "plan.json");
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  const run = (args) => spawnSync(process.execPath, [writer.path, ...args], { stdio: "inherit", env });
  try {
    // Re-running plan-it on an existing board only adds tasks it does not have yet (idempotent recovery).
    const initArgs = ["init", "--file", file, "--plan", planFile, "--by", "plan-it"];
    if (fs.existsSync(file)) initArgs.push("--merge");
    let r = run(initArgs);
    if (r.status !== 0) return r.status || 1;
    const md = statusMdPath(pkg);
    let rendered = false;
    try { rendered = fs.readFileSync(md, "utf8").split("\n", 1)[0] === MARKER; } catch { /* absent */ }
    if (!rendered) {
      r = run(["render", "--file", file]);
      if (r.status !== 0) return r.status || 1;
    }
    const n = plan.waves.reduce((s, w) => s + w.tasks.length, 0);
    console.log(`status-from-plan: wrote ${file} (${n} tasks, writer: ${writer.path})`);
    return 0;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
