# ADR-0005: Base color anchors verbatim at 500

## Status

Accepted

## Context

The tool's whole point is "give us your brand color." If the palette doesn't
contain that exact color, it breaks the promise — but every palette must still
span the full 50–950 range like a real Tailwind ramp.

## Decision

The Base color lands verbatim at step 500. The universal v4-style lightness
targets are scaled around the base's L: steps above and below 500 keep their
relative spacing, compressed or stretched to fit the available range, then
gamut-clamped. No step ever duplicates another (spacing compresses instead of
clamping values).

## Consequences

- `<name>-500` is always pixel-identical to the input color.
- Extreme bases (very light/dark) yield tighter spacing at one end rather than
  duplicate steps or clamped flat spots.
- The universal ladder's exact numbers are an implementation concern, derived
  from v4's ramps; not user-configurable.
