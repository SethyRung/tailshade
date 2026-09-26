# ADR-0003: Tailwind-style lightness targets with chroma management

## Status

Accepted (anchoring, chroma curve, and hue semantics refined in later ADRs)

## Context

The 11 steps (50–950) should resemble Tailwind v4's hand-tuned ramps:
near-white 50s, vivid mids, deep 900s — not a naive linear lightness ramp.

## Decision

Derive shades in OKLCH space using per-step lightness targets that mirror the
structure of v4's ramps, with chroma managed per step (scaled/tapered and
gamut-clamped).

## Consequences

- Output reads as a "real" Tailwind palette rather than a mechanical ramp.
- Requires explicit decisions on anchoring, chroma curve, hue behavior, and
  gamut mapping (tracked as separate ADRs).
