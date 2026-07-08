# fable-it backlog — filed from plan-it v3 research run (2026-07-07)

Builder-side items surfaced by the v3 research that are OUT OF SCOPE for plan-it
(a planning skill). Do not implement here; import into the next fable-it planning run.

| ID | Item | Source |
|---|---|---|
| FB-1 | Context-compression for long build runs (pxpipe thesis: render stable context to images / aggressive compaction survival) | stream-A |
| FB-2 | Reflect-on-stop hook (`reflect-on-stop.mjs` pattern): post-run self-review before session close | stream-B |
| FB-3 | Builder memory docs (`docs/memory.md` pattern): persistent per-repo memory the builder maintains | stream-B |
| FB-4 | Runtime struggle telemetry as code (superagent.ts failure/struggle signals) — build-time half; plan-it v3 W3 only *declares* escalation triggers, fable-it must *detect and act* | stream-B |
| FB-5 | EC-D8 build-side half: execution-time env self-healing (plan-it W2 covers plan-time preflight only) | stream-D |
| FB-6 | promptfoo-style CI eval harness for skill regressions | stream-C |
| FB-7 | Release-and-comms epic execution (changelog, marketplace publish flow) | stream-D |

Handoff rule: when fable-it v3 planning starts, this file is a research input, not a spec.
