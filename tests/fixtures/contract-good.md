# CONTRACT — fixture program (FROZEN v1.0)

Status: FROZEN v1.0 — squads write to this; amendments land in the changelog.

## 1. Vocabulary

- **Widget** — the canonical entity this fixture program ships.
- **WidgetRun** — one execution of a Widget against a target.

## 2. Schema

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| name | text | unique per tenant |
| status | enum(draft,active,retired) | canonical states |

## 3. Interface

- `POST /widgets` — create; returns 201 with the row.
- `GET /widgets/:id` — fetch one.

## 4. Definition of shipped

All epic tests green, merged to main, STATUS board updated.

## Changelog

- v1.0 (2026-07-04, Fernando) — initial freeze.
