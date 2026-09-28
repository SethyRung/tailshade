# ADR-0010: Positional color argument

## Status

Superseded by ADR-0015 (positional color form dropped; `palette` is required)

## Context

The CLI takes one color plus optional flags. Positional reads naturally;
all-flags is verbose; interactive prompts add a code path to maintain.

## Decision

`tailshade <color> [flags]` — the base color is the sole positional argument.
Flags: `--name`, `--json`, `--ts`, `--preview`. Missing or unparseable color
exits non-zero with a clear message and quoted examples.

## Consequences

- Colors with parens/spaces/`#` need shell quoting (`'oklch(0.6 0.2 20)'`).
- Help text must show quoted examples up front.
- No interactive mode; errors are the fallback.
