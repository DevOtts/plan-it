# Fixture CONTRACT — missing RUN-POLICY (FROZEN v1.0)

Status: FROZEN v1.0 — structurally valid (version header, 3+ sections,
changelog, no placeholders) EXCEPT it has no `## RUN-POLICY` heading, which
Epic B2's `freeze` extension requires.

## 1. Vocabulary

- **Widget** — the canonical entity this fixture program ships.

## 2. Schema

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |

## 3. Definition of shipped

All epic tests green, merged to main, STATUS board updated.

## Changelog

- v1.0 (2026-07-08, Fernando Ott) — initial freeze; deliberately no RUN-POLICY section.
