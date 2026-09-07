# Installation

`plan-it` ships in two forms from this one repo:

1. **Claude Code plugin** — the native experience, with parallel research and
   squad fan-outs via the Agent tool.
2. **Portable `SKILL.md`** — the same pipeline on any agent that reads the open
   [Agent Skills](https://github.com/vercel-labs/skills) standard (70+ tools).

## Claude Code (native)

```sh
# 1. Register the marketplace (this repo is its own direct-discovery marketplace)
/plugin marketplace add DevOtts/plan-it

# 2. Install the plugin (plugin-name@marketplace-name)
/plugin install plan-it@devotts
```

Verify with `/plugin` → the `plan-it` skill should be listed. Then run:

```
/plan-it <your idea, brain-dump, or transcription>
```

### Skills-CLI alternative

```sh
npx skills add DevOtts/plan-it -a claude-code    # add -g for a global install
```

## Cursor

```sh
npx skills add DevOtts/plan-it -a cursor
```

Installs into Cursor's `.agents/skills/`. Cursor has no subagent fan-out, so the
discovery and squad phases run sequentially — same gates, same artifacts.

## Codex (OpenAI Codex CLI)

```sh
npx skills add DevOtts/plan-it -a codex
# or:  gh skill install DevOtts/plan-it
```

## VS Code + GitHub Copilot

```sh
npx skills add DevOtts/plan-it -a github-copilot
```

## Any other agent

```sh
npx skills add DevOtts/plan-it --list      # see supported targets
npx skills add DevOtts/plan-it -a <agent>
```

## What gets installed

```
plan-it/
├── SKILL.md                 # the pipeline (phases 0–10, gates, rules)
└── references/
    ├── templates.md         # doc + delivery skeletons, the packaging shapes
    ├── formats.md           # atomic formats: test grammars, decision log, DoD ladder
    └── playbooks.md         # discovery modes, brownfield templates, scale-out fan-out
```

The skill reads its `references/` lazily — only the file the current phase
needs — so it stays cheap in context until the pipeline actually reaches
authoring.

## Optional companions

`plan-it` composes with, but does not require:

- [`build-it`](https://github.com/DevOtts/build-it) — the autonomous build agent
  the delivery package is designed for. Its Definition of Done is plan-it's
  Test Contract.
- A session-reading skill (`/read-chat` or similar) — resolves "see my other
  session" pointers during pre-grounding. Without one, paste the relevant
  summary instead.
- Knowledge-base / handoff skills (`/sync-obsidian`, `/session-debrief`,
  `/next-session-prompt` or equivalents) — the final handoff degrades to inline
  equivalents when they're absent.

## Validate

```sh
claude plugin validate .                    # the marketplace
claude plugin validate ./plugins/plan-it    # the plugin
```

## Cleaning up a stale install (owner action)

If you've had `plan-it` installed since before the `devotts` marketplace
rename (3.0.1, see [CHANGELOG.md](../CHANGELOG.md)), you may still be carrying
a **stale** copy: an old `plan-it@plan-it` marketplace namespace pointed at a
pre-3.0.1 (or pre-rename) version, or a user-level skill copy that predates
this repo's version and silently serves stale prose (e.g. pre-rename
`/fable-it` references) into a live session even after you've upgraded the
project-level install. This is not something the code detects or fixes for
you — it's a one-time cleanup on your machine:

1. Remove the stale marketplace entry: `/plugin marketplace remove plan-it`
   (the old `plan-it@plan-it` namespace), then re-add under the current name
   per [above](#claude-code-native): `/plugin marketplace add DevOtts/plan-it`.
2. Remove any stale user-level skill copy (outside this repo's plugin
   install) that still reports an older `version:` in its `SKILL.md`
   frontmatter, and reinstall from `plan-it@devotts`.
3. Confirm with `/plugin` that only the current `plan-it@devotts` entry is
   listed, and that `SKILL.md`'s frontmatter `version:` matches this repo's
   release.

---

_Built by [DevOtts](https://github.com/DevOtts)._
