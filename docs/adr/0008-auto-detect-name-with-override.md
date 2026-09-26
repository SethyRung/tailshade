# ADR-0008: Name defaults to auto-detect, --name overrides

## Status

Accepted

## Context

`--color-<name>-<step>` needs a Name. Manual naming is friction; auto-detect
(nearest CSS named color) is convenient but can collide with Tailwind's default
color names — silently overriding Tailwind's teal with the user's teal is a
footgun.

## Decision

Name defaults to the **Nearest name** (culori's closest CSS named color,
kebab-cased). `--name <n>` overrides it. No automatic suffixing of colliding
names (too magical); the footgun is documented instead.

## Consequences

- Zero-friction default: most runs need no flags.
- One flag escapes any collision; no hidden renaming.
- README/help must call out that auto-names like `red` will shadow Tailwind's
  defaults when pasted into `@theme`.
