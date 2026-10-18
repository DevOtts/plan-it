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
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const em = EPIC_RE.exec(raw);
    if (em && /^##\s/.test(raw) && !/^###/.test(raw)) {
      cur = { eid: em[1], title: em[2], header: [], items: [], groups: [], typeCounts: new Map() };
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
    if (im) { cur.items.push(im[1]); continue; }
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

/** Epic markdown files -> plan.json (writer input). Never carries a status. */
export function buildPlan({ pkg, epicsDir, implementation, title }) {
  const files = findEpicFiles(pkg, epicsDir);
  if (!files.length) {
    throw new Error(`no epic files found (looked in ${epicsDir ?? `${pkg}/delivery/epics and ${pkg}/epics`})`);
  }
  const epics = files.flatMap((f) => parseEpicText(fs.readFileSync(f, "utf8")));
  if (!epics.length) throw new Error("no epics parsed (expected '## E1 — title' headings)");

  const used = new Set();
  const unique = (id) => {
    let c = id; let n = 2;
    while (used.has(c)) c = `${id}.${n++}`;
    used.add(c); return c;
  };
  const waves = new Map();
  const pieces = [];
  for (const e of epics) {
    let tasks = [];
    if (e.items.length) {
      e.items.forEach((it, i) => {
        const { id, title: t } = stripId(it);
        tasks.push({ id: id ?? `${e.eid}-${String(i + 1).padStart(2, "0")}`, title: t });
      });
    } else {
      let groups = e.groups.filter((g) => g.rows > 0 || !g.whole);
      if (groups.length === 1 && groups[0].whole && e.typeCounts.size > 1) {
        groups = [...e.typeCounts].map(([t, n]) => ({ title: `${t} cases`, rows: n }));
      } else if (groups.length === 1 && groups[0].whole) {
        groups = [{ title: `Test Contract (${groups[0].rows} cases)`, rows: groups[0].rows }];
      }
      tasks = groups.map((g, i) => ({
        id: `${e.eid}-${String(i + 1).padStart(2, "0")}`,
        title: `${e.eid}: ${g.title}`.slice(0, 200),
      }));
    }
    tasks = tasks.map((t) => ({ ...t, id: unique(t.id) }));
    if (!waves.has(e.wave)) waves.set(e.wave, []);
    waves.get(e.wave).push(...tasks);
    pieces.push({
      piece: `${e.eid} — ${e.title}`.slice(0, 200),
      whats_left: tasks.length ? `All ${tasks.length} tasks` : "Nothing planned yet",
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
  let plan;
  try {
    plan = buildPlan({ pkg, epicsDir: o.epics && path.resolve(o.epics), implementation: o.implementation, title: o.title });
  } catch (e) {
    console.error(`status-from-plan: ${e.message}`);
    return 1;
  }
  if (o.dry) { console.log(JSON.stringify(plan, null, 2)); return 0; }

  let writer;
  try { writer = resolveWriter({ env }); } catch (e) {
    console.error(`status-from-plan: ${e.message}`);
    return 1;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "status-from-plan-"));
  const planFile = path.join(tmp, "plan.json");
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  const file = path.join(pkg, "status.json");
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
