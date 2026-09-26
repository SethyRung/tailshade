# ADR-0004: @theme CSS default output, --json/--ts flags

## Status

Accepted

## Context

The Tailwind v4 color standard is CSS-first: palettes are `@theme` custom
properties holding oklch values. Some consumers want structured data instead.

## Decision

Default output (stdout) is a `@theme` block:

```css
@theme {
  --color-<name>-50: oklch(...);
  /* … */
  --color-<name>-950: oklch(...);
}
```

`--json` emits the same palette as structured data; `--ts` as a typed export.

## Consequences

- Default output pipes straight into a theme.css file.
- Non-CSS consumers are one flag away; no second tool needed.
