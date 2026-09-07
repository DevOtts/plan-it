# ENV-FACTS — probed environment facts (never guessed)

- shape: S (6-probe set — formats.md §9)
- generated-by: `gate-check preflight` (deterministic; re-run to refresh)
- status vocabulary: PRESENT | ABSENT | TIMEOUT — ABSENT/TIMEOUT fail the preflight gate

| id | check | status | evidence |
|---|---|---|---|
| config-reachability | `node scripts/check-gh.mjs` | ABSENT | gh: command not found |
