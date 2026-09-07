#!/usr/bin/env node
// T-V4A1-08 / T-V4A1-09 / T-V4A1-10 — --open platform routing, never changes exit code.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'two-embeds-one-flow', 'decisions.manifest.json');

function makeStub(dir, name, logFile) {
  const stubPath = path.join(dir, name);
  fs.writeFileSync(
    stubPath,
    `#!/usr/bin/env node\nconst fs=require('node:fs');\nfs.appendFileSync(${JSON.stringify(logFile)}, process.argv.slice(2).join(' ')+"\\n");\nprocess.exit(process.env.PLANIT_STUB_EXIT ? Number(process.env.PLANIT_STUB_EXIT) : 0);\n`
  );
  fs.chmodSync(stubPath, 0o755);
}

// T-V4A1-08: darwin routes through `open -a "Google Chrome"`, falls back to bare `open` on non-zero.
{
  const dir = tmpDir('open-darwin');
  const out = path.join(dir, 'out.html');
  const log = path.join(dir, 'log.txt');
  makeStub(dir, 'open', log);
  const env = { PATH: `${dir}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'darwin', PLANIT_FORCE_TTY: '1' };
  const r = runRenderer([manifest, '--open', '--out', out], { env });
  assert(r.status === 0, `darwin --open still exits per render result, got ${r.status}`);
  const logged = fs.existsSync(log) ? fs.readFileSync(log, 'utf-8') : '';
  assert(logged.includes('-a Google Chrome') || logged.includes('-a "Google Chrome"') || /-a\s+Google Chrome\s+/.test(logged), `logs -a "Google Chrome" <file>: ${logged}`);

  // Non-zero exit from the first `open` call triggers a bare fallback `open <file>`.
  const dir2 = tmpDir('open-darwin-fallback');
  const out2 = path.join(dir2, 'out.html');
  const log2 = path.join(dir2, 'log.txt');
  makeStub(dir2, 'open', log2);
  const env2 = { PATH: `${dir2}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'darwin', PLANIT_STUB_EXIT: '1', PLANIT_FORCE_TTY: '1' };
  const r2 = runRenderer([manifest, '--open', '--out', out2], { env: env2 });
  assert(r2.status === 0, `fallback path still exits per render result, got ${r2.status}`);
  const logged2 = fs.readFileSync(log2, 'utf-8').trim().split('\n');
  assert(logged2.length === 2, `two open invocations logged (primary + fallback): ${JSON.stringify(logged2)}`);
}

// T-V4A1-09: PLANIT_NO_OPEN=1 suppresses; same for forced non-TTY.
{
  const dir = tmpDir('open-suppressed');
  const out = path.join(dir, 'out.html');
  const log = path.join(dir, 'log.txt');
  makeStub(dir, 'open', log);
  const env = { PATH: `${dir}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'darwin', PLANIT_NO_OPEN: '1', PLANIT_FORCE_TTY: '1' };
  const r = runRenderer([manifest, '--open', '--out', out], { env });
  assert(r.status === 0, `suppressed --open still exits per render result, got ${r.status}`);
  assert(!fs.existsSync(log), 'open stub never invoked when PLANIT_NO_OPEN=1');
  assert(r.stdout.includes('--open suppressed'), `stdout notes suppression: ${r.stdout}`);
}
{
  const dir = tmpDir('open-nontty');
  const out = path.join(dir, 'out.html');
  const log = path.join(dir, 'log.txt');
  makeStub(dir, 'open', log);
  const env = { PATH: `${dir}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'darwin', PLANIT_FORCE_TTY: '0' };
  const r = runRenderer([manifest, '--open', '--out', out], { env });
  assert(r.status === 0, `non-TTY --open still exits per render result, got ${r.status}`);
  assert(!fs.existsSync(log), 'open stub never invoked when stdout is not a TTY');
  assert(r.stdout.includes('--open suppressed'), `stdout notes suppression: ${r.stdout}`);
}

// T-V4A1-10: linux → xdg-open, win32 → cmd /c start.
{
  const dir = tmpDir('open-linux');
  const out = path.join(dir, 'out.html');
  const log = path.join(dir, 'log.txt');
  makeStub(dir, 'xdg-open', log);
  const env = { PATH: `${dir}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'linux', PLANIT_FORCE_TTY: '1' };
  const r = runRenderer([manifest, '--open', '--out', out], { env });
  assert(r.status === 0, `linux --open still exits per render result, got ${r.status}`);
  assert(fs.existsSync(log) && fs.readFileSync(log, 'utf-8').includes(out), `xdg-open logged with the file path: ${log}`);
}
{
  const dir = tmpDir('open-win32');
  const out = path.join(dir, 'out.html');
  const log = path.join(dir, 'log.txt');
  makeStub(dir, 'cmd', log);
  const env = { PATH: `${dir}:${process.env.PATH}`, PLANIT_TEST_PLATFORM: 'win32', PLANIT_FORCE_TTY: '1' };
  const r = runRenderer([manifest, '--open', '--out', out], { env });
  assert(r.status === 0, `win32 --open still exits per render result, got ${r.status}`);
  const logged = fs.existsSync(log) ? fs.readFileSync(log, 'utf-8') : '';
  assert(logged.includes('/c start') && logged.includes(out), `cmd /c start "" <file> logged: ${logged}`);
}

report('T-V4A1-08/09/10 open-routing');
