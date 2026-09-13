# STATUS — fixture

Legend: G-n governance rule · T-<EID>-NN test case · Wn wave — see GLOSSARY.md

This is a FROZEN artifact: the legend line above names the T-<EID>-NN test-ID
grammar, not an unfilled placeholder.

## E1 — widget CRUD epic

Branch: epic/E1-widget-crud | Depends on: none
Scope: create, read, retire widgets end to end.

### Test Contract — E1   (BINDING: 100% pass or /iterate)
Types: [unit] · Count: 1 · Surfaces: API

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E1-01 | unit | valid payload / POST /widgets / 201 | row exists |

DoD: all 1 test green · merged to main.
