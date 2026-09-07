# ENV-FACTS — probed environment facts (never guessed)

- shape: L (9-probe set — formats.md §9)
- generated-by: `gate-check preflight` (deterministic; re-run to refresh)
- status vocabulary: PRESENT | ABSENT | TIMEOUT — ABSENT/TIMEOUT fail the preflight gate

| id | check | status | evidence |
|---|---|---|---|
| config-reachability | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state .plan-it/state.json plugins/plan-it/skills/plan-it/machine.json` | PRESENT | state: discovery — Discovery |
| live-registry | `sh -c echo "marketplaces: $(ls ~/.claude-loudr/plugins/marketplaces | tr '\n' ' ') | skill-copy: $(grep -m1 '^version:' ~/.claude-loudr/skills/plan-it/SKILL.md) | plugin: $(grep -m1 '"version"' plugins/plan-it/.claude-plugin/plugin.json | tr -d ' ,')"` | PRESENT | marketplaces: build-it claude-obsidian-marketplace claude-plugins-official devotts mksglu-context-mode  openai-codex parallel-lifecycle plan-it vercel  \| skill |
| deployed-vs-installed | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror-check` | PRESENT | ✓ SKILL.md ≡ plugins/plan-it/skills/plan-it/SKILL.md (32067 bytes) |
| credential-validity | `gh auth status` | PRESENT | github.com |
| dependency-actual-usage | `sh -c node --version && test -f tests/run-contract.mjs && echo run-contract.mjs present` | PRESENT | v20.19.2 |
| code-vs-external-split | `sh -c test -d '/Applications/Google Chrome.app' && echo 'Chrome present' && curl -sI --max-time 6 https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.1/mermaid.min.js | head -1` | PRESENT | Chrome present |
| tool-availability | `sh -c command -v open && command -v node && command -v git && command -v python3` | PRESENT | /usr/bin/open |
| caller-consumer-surface | `sh -c ls ~/.claude-loudr/plugins/marketplaces | grep -E 'build-it|devotts' | tr '\n' ' '; ls ~/.claude-loudr/skills ~/.claude/skills 2>/dev/null | grep -E '^(build-it|review-it|conclude-it|prompt-it)$' | sort -u | tr '\n' ' '` | PRESENT | build-it devotts conclude-it review-it |
| secret-scan-on-import | `sh -c if grep -rIl -E 'sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|OPENSSH|PRIVATE)' assets/brand delivery/v4 2>/dev/null; then exit 1; else echo 'no secret patterns in assets/brand + delivery/v4'; fi` | PRESENT | no secret patterns in assets/brand + delivery/v4 |
