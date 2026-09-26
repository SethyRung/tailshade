# ADR-0013: Color notation flag (--format), oklch stays default

## Status

Accepted

## Context

Both output modes (v4 @theme, v3 config) emit oklch values, matching Tailwind
v4's file style. But oklch isn't universally wanted: legacy v3 projects and
older tooling expect hex; designers eyeball hsl. ADR-0012 anticipated hex as
a likely follow-up need.

## Decision

`--format <scheme>` selects the color notation of emitted values in both
output modes: `oklch` (default), `hex`, `rgb`, `hsl`. Values are stringified
via culori's native formatters; the palette itself always lives in OKLCH
internally — notation is purely a formatting concern, chosen at the CLI edge.

## Consequences

- One selector flag; future notations extend the union without new flags.
- The v3 export's "same oklch values as v4" guarantee (ADR-0012) becomes
  "same palette"; notation follows the flag in both modes.
- Hex quantizes to 8-bit — the 500 step may drift a hair from the base color
  after oklch rounding; tolerated by the verbatim checks (tolerance-based).
