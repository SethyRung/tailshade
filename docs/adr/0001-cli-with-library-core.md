# ADR-0001: CLI with a pure library core

## Status

Accepted

## Context

tailshade generates a full Tailwind v4 palette from one base color. It needs a
consumable interface today; a web playground is plausible later.

## Decision

The shade-generation and formatting logic lives in a pure library core
(importable functions, no I/O). The CLI is a thin wrapper: parse argv, call
core, print.

## Consequences

- Core is unit-testable with `bun test` without touching stdin/stdout.
- A future web UI is a new thin surface over the same core, not a rewrite.
- Slightly more structure than a single script; acceptable for the reuse.
