# Epics — status-json fixture

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Wave: W1 | Depends on: none

### Tasks
- [ ] implement POST /widgets (api/widgets.ts)
- [ ] implement GET /widgets/:id
- [ ] FX-03 add list endpoint

### Test Contract — E1   (BINDING: 100% pass or /iterate)

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E1-01 | unit | valid payload / POST / 201 | row exists |
| T-E1-02 | e2e | created widget / GET / 200 | body matches |

## E2 — widget retirement epic

Branch: epic/E2-retire | Wave: W2 | Depends on: E1

### Tasks
- [ ] add status transition guard
- [ ] retire endpoint

### Test Contract — E2   (BINDING: 100% pass or /iterate)

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E2-01 | unit | active run / retire / 409 | refuses |

## E3 — audit log epic

Branch: epic/E3-audit | Wave: W2 | Depends on: E1

### Tasks
- [ ] write audit rows on retire

### Test Contract — E3   (BINDING: 100% pass or /iterate)

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E3-01 | unit | retire / audit | one row |
