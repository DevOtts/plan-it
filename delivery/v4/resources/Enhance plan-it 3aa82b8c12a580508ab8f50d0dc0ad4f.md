# Enhance plan-it

Week: 15/12/25 (https://app.notion.com/p/15-12-25-2bc82b8c12a580068355ff4178658d87?pvs=21)
Completed: No
Category: Microfactory

### Lack of Clarity

I've being using plan-it for a while, it is really good but we have a few enhancements.

My main concern is that once it starts it doesn't clarify what is everything in the output of the chat (only in the documentation, but I don't want to read all the documentation). The ideal is that before it prompt me with the decisions of the sizes for me to choose, it first explain what are the sizes what it involves and so on.

![image.png](Enhance%20plan-it/image.png)

### We need a human UI summary

Good examples:

```jsx
Engine - claudinho sub - session: "mission-control-pt3-exec"
/Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/mission-control-card-context/visual/anatomia-de-uma-decisao.html
/Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/0-done/mission-control-card-context/visual/anatomia-de-uma-decisao.html

```

### Great example on HTML

session: open-sessions-closeout-aug26

[DECISIONS-bkp-case.html](Enhance%20plan-it/DECISIONS-bkp-case.html)

A few other htmls

```jsx
file:///private/tmp/claude-501/-Users-macbook-Workspace-Engine-Engine-Core/f89762a0-568a-4561-9ebd-cec482122260/scratchpad/conclude-report/CONCLUDE_REPORT.html
file:///Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/open-sessions-closeout/DECISIONS-pt2.html
file:///Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/open-sessions-closeout/CONCLUDE_REPORT.html
file:///Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/open-sessions-closeout/OVERNIGHT-RUN-REPORT.html

```

### A new way of planning is appearing

look what I asked. kind of a new format that the plan should ask for which build format we want to plan .

```jsx
awesome job. let's /plan-it
  Take in mind that we will run this with the orchestrator session approach, and the plan should determine all other sessions should I open, the name of other sessions so the orchestrator session can manage over night.

  If the plan identify other decisions, actions blockers that depend on me, it should be in the plan html report so I can answer and the build-it can run autonomously until the conclude of it.
```

Check the session “done-open-sessions-closeout-aug26-orchestrator” that build the plan as orchestrator to learn what worked, what didn't. Mainly at the end it learned one adaptation when we decide to move to backlog small items so we can close the epic.

### Contract HTML

/Users/macbook/Workspace/Engine/Engine-Core/docs/implementation/praxya-sprint1-ads-rules/delivery/CONTRACT.html

Review session “praxya-sprint1-ads-rules-research” claudeloudr sub. Amazing research and planning sample! AMAZING STANDARD!

Then review the build orchestrator session at “s1-ads-orchestrator” claudinho sub.

### New extra behaviour

- The user is now asking to do the full plan, do the research on codebase, documentation, chrome CDP if necessary → anamynesis → use it own recommendations and create the entire plan end-to-end, and then a html report with the recommendations and then the user answer and contradict if he sees a problem in the plan.
- Before do the entire plan, the plan-it previously check everything that might need from the user so it can work end-to-end in the plan by having everything that it needs from the user.

### Great Report explaining  why implement

[SEED-TRIAGE-2026-09-04.html](Enhance%20plan-it/SEED-TRIAGE-2026-09-04.html)

But I asked to do more enhancements (check what user is also looking for, a more abstraction, real usescases to really understand why this is important.

```jsx
- hermes-studio-layer - I need in the report a visual mockup of each part that you try to explain.
  this is not so clear to me yet. also real usecases examples might help.

  - agent-proposes-skill - I need a visual proposal, as mockup or mermaid flow for me to better
  understand. also real usecases examples might help.

```

### Great reference

[SEED-DECISIONS-v2.html](Enhance%20plan-it/SEED-DECISIONS-v2.html)