// Shared helpers for the do-it 1.1 L1/V1/K2 tests (zero deps).
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, existsSync, rmSync, readdirSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const GC = join(ROOT, "scripts", "gate-check.mjs");
export const GC_MIRROR = join(ROOT, "plugins", "plan-it", "skills", "plan-it", "scripts", "gate-check.mjs");
// The doc-it CLI the dependent tests run against (decision X10): DOC_IT_CLI, else the newest installed copy
// under ~/.claude/plugins/cache/<marketplace>/doc-it/<version>/scripts/doc-it.mjs, else null (tests skip with
// IMPLEMENTED-NOT-VERIFIED). No machine-specific path.
export function docItCli() {
  if (process.env.DOC_IT_CLI && existsSync(process.env.DOC_IT_CLI)) return process.env.DOC_IT_CLI;
  const cache = join(homedir(), ".claude", "plugins", "cache");
  let best = null;
  try {
    for (const m of readdirSync(cache)) {
      const base = join(cache, m, "doc-it");
      if (!existsSync(base)) continue;
      for (const v of readdirSync(base)) {
        const f = join(base, v, "scripts", "doc-it.mjs");
        if (existsSync(f) && (!best || cmpVer(v, best.v) > 0)) best = { v, f };
      }
    }
  } catch { /* no cache */ }
  return best ? best.f : null;
}
const cmpVer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

const made = [];
process.on("exit", () => { for (const d of made) { try { rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ } } });
export function tmp(prefix = "planit-trust-") {
  const d = mkdtempSync(join(tmpdir(), prefix));
  made.push(d);
  return d;
}

export function gc(args, { env = {}, cwd = ROOT, script = GC, drop = [] } = {}) {
  const e = { ...process.env, ...env };
  for (const k of drop) delete e[k];
  const r = spawnSync("node", [script, ...args], { encoding: "utf8", cwd, env: e });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

export function write(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export const LEDGER_HEAD = "| ID | Claim | Tier | Source |\n|---|---|---|---|\n";

// A temp HOME with no doc-it installed and no DOC_IT_CLI.
export function noDocItEnv(home) {
  return { env: { HOME: home, USERPROFILE: home }, drop: ["DOC_IT_CLI"] };
}

export { mkdirSync, writeFileSync, cpSync, join, existsSync };

const S_IDS = ["config-reachability", "live-registry", "deployed-vs-installed", "credential-validity", "dependency-actual-usage", "code-vs-external-split"];
const ML_IDS = [...S_IDS, "tool-availability", "caller-consumer-surface", "secret-scan-on-import"];

// A target dir with an ENV-PROBES.json whose required probes are trivial, plus `extra` grounding probes.
export function probeTarget(shape, extra) {
  const dir = tmp("planit-pre-");
  const ids = shape === "S" ? S_IDS : ML_IDS;
  const probes = [...ids.map((id) => ({ id, fact: "fixture", check: ["node", "-e", "console.log('ok')"] })), ...extra];
  write(join(dir, "ENV-PROBES.json"), JSON.stringify({ probes }, null, 2));
  return dir;
}

export function git(cwd, ...args) {
  const r = spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

// A bare remote with 4 commits on main; clone `behind` sits 3 commits behind it.
export function behindFixture() {
  const base = tmp("planit-remote-");
  const remote = join(base, "remote.git");
  const author = join(base, "author");
  const behind = join(base, "behind");
  git(base, "init", "-q", "--bare", "-b", "main", "remote.git");
  git(base, "clone", "-q", "remote.git", "author");
  git(author, "checkout", "-q", "-B", "main");
  for (let i = 1; i <= 4; i++) {
    writeFileSync(join(author, "f.txt"), `v${i}\n`);
    git(author, "add", "f.txt");
    git(author, "commit", "-q", "-m", `c${i}`);
  }
  git(author, "push", "-q", "-u", "origin", "main");
  git(base, "clone", "-q", "remote.git", "behind");
  git(behind, "reset", "-q", "--hard", "HEAD~3");
  const full = (cwd, ref) => git(cwd, "rev-parse", ref);
  return { base, remote, author, behind, local: full(behind, "HEAD"), remoteSha: full(author, "HEAD") };
}
