# ADR-0007: Constant hue across all steps

## Status

Accepted

## Context

Tailwind v4's own ramps drift hue slightly across steps (red's 17°→27° swing),
but those drift constants were hand-tuned per color family. Arbitrary hues
with borrowed drift numbers can look wrong, and drift makes the output a less
predictable function of the input.

## Decision

All 11 steps share the Base color's hue exactly. No drift, no per-family magic
numbers, no flag.

## Consequences

- Palette = pure function of the base color; easy to reason about and test.
- Ramps may look slightly more "clinical" than v4's hand-tuned ones; accepted.
- If drift is ever wanted, it comes back as its own ADR with evidence.
