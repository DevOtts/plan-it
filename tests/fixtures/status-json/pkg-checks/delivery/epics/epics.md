# Epics — R-1 check commands fixture

## C1 — contract with a Verify and a Check column

Branch: epic/C1 | Wave: W1

### Test Contract — C1   (BINDING: 100% pass or /iterate)

| ID | Scenario | Expected | Kind | Verify | Check |
|---|---|---|---|---|---|
| T-C1-01 | build passes | exit 0 | happy | auto | `node -e "process.exit(0)"` |
| T-C1-02 | morning report reads well | owner confirms | edge | attended | `node report.mjs` |
| T-C1-03 | copy matches brand voice | reviewer judgement | edge | judgement | — |

## C2 — checklist tasks mapped by a Task column

Branch: epic/C2 | Wave: W1

### Tasks
- [ ] CK-01 build the parser
- [ ] CK-02 owner signs off the copy
- [ ] CK-03 docs page

### Test Contract — C2   (BINDING)

| ID | Task | @tag | Case | run: |
|---|---|---|---|---|
| T-C2-01 | CK-01 | @case | parses a valid file | `node tests/parse.mjs` |
| T-C2-02 | CK-01 | @case | round-trips its own output | `node tests/rt.mjs \| grep -q ok` |
| T-C2-03 | CK-02 | @owner | owner reads the copy | — |

## C3 — live and prod cases

Branch: epic/C3 | Wave: W2

### Test Contract — C3   (BINDING)

| ID | @tag | Case | run: |
|---|---|---|---|
| T-C3-01 | @case | [REAL] writes a row to the live base | `node tests/live.mjs` |
| T-C3-02 | @prod | prod deploy answers 200 | `curl -sf https://example.invalid/health` |

## C4 — [REAL] case opted in with Verify auto, and a contract with no check column

Branch: epic/C4 | Wave: W2

### Test Contract — C4   (BINDING)

#### Local

| ID | Case | Verify | run: |
|---|---|---|---|
| T-C4-01 | [REAL] reads the real fixture file | auto | `node tests/real-file.mjs` |

#### Old style

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-C4-02 | unit | a / b / c | d |
