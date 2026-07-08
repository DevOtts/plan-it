# Fixture: pkg-parity

Consumed by: **C-W6-04** (`handoff` verb's plugin↔marketplace parity check).
Violates: "plugin.json ↔ marketplace.json parity mismatch fixture →
`handoff` FAILS." `plugin.json.version` is `2.1.0`; the matching
`marketplace.json` entry says `2.0.0`.

Contents:
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` — version mismatch vs plugin.json.
