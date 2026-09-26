# ADR-0014: Configurable anchor step via --step

## Status

Accepted

## Context

ADR-0005 fixed the anchor step at 500. Users often have a brand color or dark/light token that belongs at a specific shade (e.g. #111410 at 700, or a tinted background at 50) rather than at the 500 midpoint.

## Decision

Support `--step <50..950>` (default: 500). The base color lands verbatim at the specified shade. Lightness targets scale proportionally above and below the chosen anchor, and the chroma taper ratio normalizes relative to the anchor's taper ratio. Monotonicity and bounds are validated per step.

## Consequences

- Users can anchor at any valid Tailwind step (50 through 950).
- Backward-compatible: defaults to 500 when omitted.
- Out-of-bounds lightness for the chosen anchor exits non-zero with a clear error.
