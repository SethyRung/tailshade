# tailshade — Domain Glossary

Generate a full Tailwind v4 palette from a single base color.

Terms defined here are the project's shared vocabulary. Use these words
exactly, in code, docs, and conversation.

- **Base color** — the single user-provided CSS color that seeds the palette.
  Default input format is oklch.
- **Name** — kebab-case palette identifier; custom properties are emitted as
  `--color-<name>-<step>`. Defaults to the Nearest name; `--name` overrides
  (see ADR-0008).
- **Swatch preview** — opt-in (`--preview`) ANSI rendering of each step's
  color above the regular output (see ADR-0011).
- **Step** — one of Tailwind's shade indices: 50, 100, 200, 300, 400, 500,
  600, 700, 800, 900, 950 (11 total).
- **Palette** — all 11 steps derived from one Base color, under one Name.
- **Ramp** — the ordered lightness progression across a palette's steps.
- **Lightness target** — the planned OKLCH L for a step, before chroma and
  gamut adjustments (see ADR-0003).
- **Base anchoring** — the rule that the Base color appears verbatim at step
  500; other steps' Lightness targets are scaled around it (see ADR-0005).
- **Taper** — the chroma reduction profile toward step 50 (aggressive) and
  step 950 (gentle) (see ADR-0006).
- **Nearest name** — the CSS named color closest to the Base color; the
  default source of the palette's Name.
- **Chroma curve** — the planned chroma for each step relative to the Base
  color's chroma.
- **Gamut mapping** — reducing chroma until a color fits the output color
  space (sRGB).
- **@theme block** — Tailwind v4's CSS custom-property container; the default
  output format (see ADR-0004).
- **OKLCH** — the perceptual color space (L lightness, C chroma, H hue) used
  as the internal representation (see ADR-0002).
