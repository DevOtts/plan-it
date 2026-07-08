# Epics — fixture squad (epic without a Test Contract on purpose)

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Depends on: none
Scope: create, read widgets.

Tasks:
- [ ] implement POST /widgets
- [ ] implement GET /widgets/:id

DoD: merged to main.

## E2 — properly tested epic

### Test Contract — E2   (BINDING: 100% pass or /iterate)
Types: [unit] · Count: 1 · Surfaces: API

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E2-01 | unit | no runs / retire widget / 200 | status=retired |
