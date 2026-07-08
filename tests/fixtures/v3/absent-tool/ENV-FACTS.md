# ENV-FACTS — probed environment facts (never guessed)

- shape: M (9-probe set — formats.md §9)
- generated-by: `gate-check preflight` (deterministic; re-run to refresh)
- status vocabulary: PRESENT | ABSENT | TIMEOUT — ABSENT/TIMEOUT fail the preflight gate

| id | check | status | evidence |
|---|---|---|---|
| tool-availability | `frobnicate --version` | ABSENT | command not found: frobnicate |
| live-registry | `node --version` | PRESENT | v20.19.2 |
