# ADR-0012: Tailwind v3 config export via --v3; no --json/--ts

## Status

Accepted

## Context

The original output plan (ADR-0004) paired the default v4 `@theme` block with
`--json`/`--ts` structured-data flags. On review this missed the actual need:
the choice that matters is the Tailwind major version, not the serialization
format — legacy projects still on Tailwind v3 need a `tailwind.config.js`
shape.

## Decision

- Default output remains the Tailwind v4 `@theme` block (ADR-0004's core).
- `--v3` exports the same palette as a Tailwind v3 config snippet:
  `module.exports = { theme: { extend: { colors: { <name>: { 50..950 } } } } }`.
- Values in the v3 export stay oklch() strings, consistent with the v4 output
  and valid in v3.4+ configs on modern browsers.
- `--json`/`--ts` are dropped entirely.

## Consequences

- One flag covers the v3 use case; no structured-data surface to maintain.
- Notation of emitted values (both modes) is selected by `--format`
  (ADR-0013); oklch remains the default.
- ADR-0004's flag section is superseded; its default-output section stands.
