# Spec: Palette generator from a Base color (Tailwind v4 output)

> Tickets 01–05 live in `.scratch/palette-generator/issues/`.

## Problem Statement

I have one brand color — my logo's red, a hex code from a client, a hand-picked
oklch value. Turning it into a usable Tailwind palette means inventing ten more
shades by hand, guessing oklch numbers, and hoping the result doesn't look
mechanical. Tailwind's own ramps are hand-tuned; mine come out chalky at 50,
muddy at 900, and my brand color ends up appearing nowhere in the palette.

## Solution

I give tailshade any CSS color — hex, rgb(), hsl(), a named color, or oklch().
It prints a complete Palette: all 11 Steps (50–950) as a `@theme` block of
oklch custom properties, formatted exactly like Tailwind v4's own files. My
Base color appears verbatim at `<name>-500`. The Ramp reads like a designed
palette: Lightness targets distributed v4-style, a Chroma curve that peaks at
the base and tapers toward both ends, every Step gamut-mapped so nothing clips.
Zero flags required — the Name is auto-detected — with `--name`, `--v3`
(a Tailwind v3 config export), and `--preview` swatches one flag away.

## User Stories

1. As a developer, I want to pass any CSS color (hex, rgb(), hsl(), named, oklch()), so that I never have to convert my brand color myself.
2. As a developer, I want oklch input to pass through untouched, so that the default format never surprises me.
3. As a developer, I want my Base color to appear verbatim as `<name>-500`, so that the palette provably contains my brand color.
4. As a developer, I want all 11 Steps generated (50–950), so that I get the complete Tailwind shade range.
5. As a developer, I want Lightness targets distributed like v4's ramps, so that my palette reads as hand-designed rather than mechanical.
6. As a developer, I want the Chroma curve to peak at the base and Taper toward 50 and 950, so that light Steps aren't chalky and dark Steps aren't muddy.
7. As a developer, I want constant hue across every Step, so that the palette is a predictable function of my input.
8. As a developer, I want every Step gamut-mapped to sRGB, so that pasted CSS never renders clipped colors.
9. As a developer, I want the default output to be a @theme block, so that I can paste it straight into my theme CSS.
10. As a Tailwind v3 developer, I want `--v3`, so that I can paste a tailwind.config.js snippet into my legacy project.
11. As a developer, I want the v3 export to carry the same palette as the v4 output, so that palettes stay consistent across major versions.
12. As a developer, I want the Name auto-detected from the Nearest name, so that a zero-flag run works.
13. As a developer, I want `--name` to override auto-detection, so that my palette never shadows Tailwind's default colors by accident.
14. As a designer, I want a Swatch preview on demand, so that I can eyeball the Ramp before committing to it.
15. As a developer, I want default output free of ANSI escapes, so that redirection always produces valid CSS/JS.
16. As a developer, I want clear errors with quoted examples when my color fails to parse, so that I can fix my own command.
17. As a script author, I want a non-zero exit code on bad input, so that pipelines fail loudly.
18. As a developer, I want achromatic bases to produce a gray Ramp, so that monochrome brands work.
19. As a developer, I want oklch values printed at three decimals, so that the output matches v4's own file style.
20. As a developer, I want extreme bases (very light or dark) to yield compressed but distinct Steps, so that no two Steps are ever identical.
21. As a user, I want to run the tool straight from the repo with Bun, so that there's nothing to install or publish.
22. As a maintainer, I want the generation core importable as a library, so that a future web playground reuses it without going through the CLI.
23. As a maintainer, I want tests to run through one seam — the CLI entry called in-process — so that tests cover external behavior only.
24. As a developer, I want `--format hex|rgb|hsl`, so that emitted values match what my project or tooling expects (ADR-0013).

## Implementation Decisions

- CLI over a pure library core: generation and formatting are importable
  functions with no I/O; the CLI is a thin wrapper (ADR-0001).
- Any CSS color string is parsed via culori and normalized to OKLCH as the
  single internal representation (ADR-0002).
- Shades are derived in OKLCH from v4-style per-step Lightness targets with
  chroma management (ADR-0003).
- The Base color anchors verbatim at Step 500; the lightness ladder is scaled
  around the base's L, preserving relative spacing — spacing compresses at the
  tight end instead of clamping values, so Steps never duplicate (ADR-0005).
- Chroma follows a Taper curve: peak at the base, aggressive reduction toward
  Step 50, gentle toward Step 950, then gamut-mapped per Step. Curve constants
  are derived from v4's real ramps and are fixed, not configurable (ADR-0006).
- Hue is constant across all Steps; no drift, no flag (ADR-0007). Achromatic
  bases (C ≈ 0) yield a pure gray Ramp.
- Output defaults to a @theme block; `--v3` emits the same Palette as a
  Tailwind v3 config snippet (module.exports with theme.extend.colors). The
  color notation of emitted values is selected by `--format`
  (oklch default, plus hex/rgb/hsl) in both modes (ADR-0012, ADR-0013; these
  supersede ADR-0004's --json/--ts flags). oklch values are formatted at
  three decimals.
- The Name defaults to the Nearest name (culori's closest CSS named color,
  kebab-cased); `--name` overrides. No automatic suffixing of colliding names
  (ADR-0008).
- Distribution is a private CLI run from the repo via Bun; no npm publishing
  (ADR-0009).
- Invocation is `tailshade <color> [flags]`: one positional color, flags
  `--name`, `--v3`, `--format`, `--preview`. Missing or unparseable color exits
  non-zero with quoted examples (ADR-0010).
- stdout is always pipe-clean; `--preview` adds the ANSI Swatch preview above
  the output. No TTY sniffing, no conditional behavior (ADR-0011).
- The CLI entry is an in-process-callable function taking an argv array and
  returning the output and exit code — the single test seam.

## Testing Decisions

- **One seam: the CLI entry, in-process.** Tests drive the CLI entry function
  with an argv array and assert on the returned output and exit code. Nothing
  below it is tested directly.
- A good test here asserts external behavior only: emitted strings, exit
  codes, and numeric properties recovered by parsing the emitted oklch values
  with culori — never internal helpers or intermediate structures.
- Key behaviors to cover: Base verbatim at 500; lightness strictly monotonic
  down the Ramp; all Steps distinct; every Step in sRGB gamut; a v4-derived
  golden fixture sanity-checked against Tailwind's own ramp (with tolerance,
  since exact reproduction of hand-tuned values is not the goal); gray base →
  gray Ramp; extreme bases → compressed, distinct Steps; Nearest-name
  detection and `--name` override; `--v3` emits a syntactically valid config
  snippet nesting the palette under theme.extend.colors; `--preview` prepends
  an ANSI block; clean color
  missing/bad → non-zero exit with quoted example in the message.
- Prior art: none — the repo is greenfield; `bun test` idioms apply.

## Out of Scope

- Web playground UI (core stays importable for it, per ADR-0001).
- npm publishing and remote install (ADR-0009).
- Per-step hue drift (rejected in ADR-0007).
- Interactive prompts (ADR-0010).
- Wide-gamut output spaces (display-p3); sRGB only.
- In-place edits of theme files, clipboard integration, config files, caching.
- Multiple Base colors in a single run.

## Further Notes

- ADRs 0001–0011 are canonical; the CONTEXT.md glossary defines the
  vocabulary used above (Base color, Palette, Step, Ramp, Lightness target,
  Chroma curve, Taper, Gamut mapping, Nearest name, Swatch preview).
- Lightness-target and Taper constants are extracted from v4's real palette
  during implementation; they are fixed constants, not user-facing knobs.
- Known footgun, documented in help text: auto-detected Names like `red` or
  `teal` shadow Tailwind's defaults when pasted into `@theme`; `--name` is
  the escape hatch.
