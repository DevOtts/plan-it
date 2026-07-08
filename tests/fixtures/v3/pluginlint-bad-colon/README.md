# Fixture: pluginlint-bad-colon

Consumed by: **T-C2-01** (`pluginlint` verb).
Violates: "SKILL.md frontmatter `description:` with an unquoted colon → lint
fails with the exact offending line."

Contents:
- `skills/sample-skill/SKILL.md` — plain-scalar `description: foo: bar` (no
  `>-` block scalar), which is invalid single-line YAML.
