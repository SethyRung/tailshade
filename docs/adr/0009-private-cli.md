# ADR-0009: Private CLI, not a published npm package

## Status

Accepted

## Context

tailshade is a personal tool. Publishing to npm brings name reservation, semver
discipline, and README/help polish obligations that add no value to its current
audience.

## Decision

Run from the repo: `bunx .` or `bun run index.ts -- …`. No bin packaging, no
publish workflow. If publishing is wanted later it is purely additive.

## Consequences

- No ceremony now; nothing to undo later.
- The npm name "tailshade" is not reserved (acceptable risk).
- Consumers must have the repo — acceptable for a personal tool.
