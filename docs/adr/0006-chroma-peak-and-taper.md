# ADR-0006: Chroma peaks at the base, tapers toward the extremes

## Status

Accepted

## Context

Real Tailwind ramps are not constant-chroma: the 50s are near-white with a
whisper of chroma, chroma peaks somewhere in the 500–600 range, and the 900s
carry moderate chroma into darkness. Constant chroma reads as chalky or muddy.

## Decision

Chroma follows a taper curve anchored at the base color's chroma: it peaks at
step 500 and reduces toward both ends — aggressively toward 50, gently toward
950 — mirroring v4's ramps. Every step is gamut-mapped (chroma reduced until
in sRGB) after the curve is applied.

## Consequences

- Ramps read as "designed" rather than mechanical.
- Taper ratios are derived from v4's palette during implementation; fixed, not
  user-configurable.
- Achromatic bases (C ≈ 0) produce a pure gray ramp; hue is irrelevant there.
