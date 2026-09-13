# Epics — fixture squad

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Depends on: none
Scope: create, read, retire widgets end to end.

### Test Contract — E1   (BINDING: 100% pass or /iterate)
Types: [unit] · Count: 2 · Surfaces: API

| ID | Type | Given / When / Then | Assertion | Tag |
|---|---|---|---|---|
| T-E1-01 | unit | valid payload / POST /widgets / 201 | row exists | [REAL] |
| T-E1-02 | unit | empty payload / POST /widgets / 422 | error names field | [REAL] |

DoD: all 2 tests green · merged to main.
