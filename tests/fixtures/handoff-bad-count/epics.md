# Epics — fixture squad (count mismatch on purpose)

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Depends on: none
Scope: create, read widgets.

### Test Contract — E1   (BINDING: 100% pass or /iterate)
Types: [unit] · Count: 2 · Surfaces: API

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E1-01 | unit | valid payload / POST /widgets / 201 | row exists |
| T-E1-02 | unit | empty payload / POST /widgets / 422 | error names field |
| T-E1-03 | unit | dup name / POST /widgets / 409 | conflict |

DoD: all tests green.
