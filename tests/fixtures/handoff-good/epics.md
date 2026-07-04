# Epics — fixture squad

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Depends on: none
Scope: create, read, retire widgets end to end.

Tasks:
- [ ] implement POST /widgets (api/widgets.ts)
- [ ] implement GET /widgets/:id

### Test Contract — E1   (BINDING: 100% pass or /iterate)
Types: [unit][e2e] · Count: 3 · Surfaces: API

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E1-01 | unit | valid payload / POST /widgets / 201 | row exists |
| T-E1-02 | unit | empty payload / POST /widgets / 422 | error names field |
| T-E1-03 | e2e | created widget / GET by id / 200 | body matches row |

DoD: all 3 tests green · merged to main.

## E2 — widget retirement epic

Branch: epic/E2-retire | Depends on: E1
Scope: retire flow with guard against retiring active runs.

Tasks:
- [ ] add status transition guard

### Test Contract — E2   (BINDING: 100% pass or /iterate)
Types: [unit] · Count: 2 · Surfaces: API

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E2-01 | unit | active run in flight / retire widget / 409 | refuses |
| T-E2-02 | unit | no runs / retire widget / 200 | status=retired |

DoD: all 2 tests green · merged to main.
