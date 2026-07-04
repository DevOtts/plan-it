# LinkedIn post — plan-it v2 "deterministic core"

## The post (ready to paste)

I watched a conference talk about AI slop and realized it was describing my own open-source tool.

David Khourshid (creator of XState) calls the failure mode "prose control flow": markdown instructions — do step 1, then step 2, NEVER skip the gate — that you *hope* the agent follows.

Sometimes it won't. That's not a model problem. It's an architecture problem.

My plan-it plugin — the one that turns fuzzy ideas into agent-buildable delivery packages — was 1,177 lines of exactly that.

So v2 applies his medicine to my own pipeline: determinism at the core, LLM at the edges.

→ machine.json — the pipeline is now an explicit statechart (XState v5-compatible): 15 states, 3 human gates, guarded transitions. Paste it into stately.ai/viz and *see* the pipeline.
→ .plan-it/state.json — every run persists its position. Crash, compaction, fresh session → resume from the machine, not from re-reading the transcript.
→ gate-check.mjs — the rules became exit codes. "No frozen contract → no parallel work" is no longer a plea; a non-zero exit blocks the transition.
→ v2.1 — a hook that hard-DENIES writing PRDs/epics while the contract is unfrozen. The harness refuses; the agent is told why.

The research, synthesis, and judgment stay with the LLM. You model the confusing parts, not everything.

Here's my favorite part. During the build, I ran the new consistency lint on its own delivery package — and it failed. I had hand-typed "20 test cases" in the spec. The actual count was 21.

The tool caught a bug in its own spec, during its own build, on day one.

Prose asks. Exit codes refuse.

Free, MIT, runs on Claude Code (and 70+ agents via SKILL.md — the guards degrade gracefully where Node isn't available). Repo + the talk in the comments 👇

What's living in your prompts today that should be an exit code?

#AI #ClaudeCode #AgenticCoding #OpenSource #StateMachines

## First comment

Repo: https://github.com/DevOtts/plan-it — install with `/plugin marketplace add DevOtts/plan-it` on Claude Code, or `npx skills add DevOtts/plan-it -a <agent>` anywhere else.

The talk that triggered the rewrite: "Beyond the Prompt: Goodbye Slop, Welcome Determinism" by David Khourshid — https://www.youtube.com/watch?v=uMvTAF280so

The build half of the lifecycle lives at https://github.com/DevOtts/fable-it.

## Hook variant B (A/B option)

My AI planning tool had one job: stop agents from skipping steps.

It was written as 1,177 lines of markdown steps — that an agent could skip.

(then continue from "David Khourshid calls this…")
