# ADR-0002: Accept any CSS color, normalize to OKLCH

## Status

Accepted

## Context

The base color "defaults to oklch", but users typically have hex, rgb(), hsl(),
or a named color in hand.

## Decision

Parse any CSS color string via culori and normalize to OKLCH as the single
internal representation. oklch input passes through untouched — "default to
oklch" means no conversion is needed, not that other formats are rejected.

## Consequences

- One internal representation; downstream logic never branches on input format.
- Adds the culori dependency; parsing and gamut math are delegated to it.
- Unparseable input needs a clear, actionable error.
