# ADR-0011: Plain output by default, --preview opt-in

## Status

Accepted

## Context

Default output should pipe cleanly into theme files and other tools. ANSI
swatches are delightful in a terminal but corrupt piped output and CI logs.

## Decision

Default stdout is pure CSS (@theme) / JSON / TS — no ANSI escapes ever. The
`--preview` flag renders an ANSI **swatch strip** (one block per step, labeled)
above the output.

## Consequences

- `tailshade <color> > theme.css` always produces clean text.
- Preview is opt-in; no TTY sniffing, no conditional behavior.
- One extra formatter; trivially testable (flag → prefix block).
