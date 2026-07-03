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
/plugin install plan-it@plan-it
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

- [`fable-it`](https://github.com/DevOtts/fable-it) — the autonomous build agent
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

---

_Built by [DevOtts](https://github.com/DevOtts)._
