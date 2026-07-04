# LinkedIn post — plan-it (angle 3: the tool that blocked its own release)

## The post (ready to paste)

My open-source planning tool found a bug in its own spec — and refused to ship itself until I fixed it.

Here's what happened.

plan-it turns a fuzzy idea into an agent-buildable delivery package: specs, PRDs, epics, and a binding Test Contract with expected outputs registered at planning time.

For v2, I used plan-it to plan plan-it. Its own pipeline produced its own delivery package.

Then its brand-new consistency lint ran over that package:

→ The spec declared "Count: 20" test cases.
→ The lint counted the actual table rows: 21.
→ Handoff blocked. Exit code 1. "Count tags, don't hand-type."

I had hand-typed the number. The tool caught its author, in its own spec, on day one.

That's the whole philosophy in one moment:

1. Plans drift the second a human types a number a machine could count.
2. So every rule that CAN be a check becomes one — frozen CONTRACT, 3 human gates, per-epic Test Contracts, a lint before handoff.
3. "Done" = 100% of the contract passes. For v2 that meant 26/26 — including the case that started as my own typo.

It doesn't write your code. It makes sure the agent that does inherits decisions, contracts, and tests — instead of inventing them overnight.

If your tooling has never caught YOU, it isn't checking anything.

Free, MIT. Runs as a Claude Code plugin, or as a SKILL.md on 70+ agents. Repo in the comments 👇

What's the last time one of your own tools called you out?

#AI #ClaudeCode #AgenticCoding #OpenSource #DevTools

## First comment

Repo: https://github.com/DevOtts/plan-it — install with `/plugin marketplace add DevOtts/plan-it` on Claude Code, or `npx skills add DevOtts/plan-it -a <agent>` anywhere else. The build half of the lifecycle: https://github.com/DevOtts/fable-it.

## Hook variant B (A/B option)

The best test of a planning tool: make it plan itself.

I did. It failed its own lint in the first run — a hand-typed "20 test cases" that was actually 21 — and blocked its own handoff until the spec was fixed.

(then continue from "That's the whole philosophy in one moment:")
