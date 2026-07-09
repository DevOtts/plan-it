# CONTRACT — contacts REST API (adversary LINEAR fixture)

Version: v1.0 (frozen)

## 5. Data model (value enumerations, NOT a state machine)

- Role := admin | member | viewer
- SortOrder := asc | desc

These are value enums. No lifecycle, no transitions — a plain CRUD service.

## 6. Endpoints

- POST /contacts — create a contact, return 201 with the new id.
- GET /contacts/:id — read one contact.
- PATCH /contacts/:id — update mutable fields.
- DELETE /contacts/:id — remove a contact.
- GET /contacts — list, paginated.

No multi-step workflow, no approval gate, no agentic step. Each request is
independent and stateless.

## Cases

| ID | Asserts |
|----|---------|
| T-L1-01 | create returns 201 and the id round-trips on read |
| T-L1-02 | delete then read returns 404 |
