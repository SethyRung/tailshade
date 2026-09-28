# tailwind_tools

Generate a full Tailwind CSS color palette (50–950) from a single base color.
Any CSS color in, Tailwind v4 `@theme` block out.

```bash
$ tailwind_tools palette '#ff0000'
@theme {
  --color-red-50: oklch(0.977 0.011 29.234);
  --color-red-100: oklch(0.945 0.027 29.234);
  --color-red-200: oklch(0.892 0.056 29.234);
  --color-red-300: oklch(0.815 0.104 29.234);
  --color-red-400: oklch(0.712 0.181 29.234);
  /* … */
  --color-red-950: oklch(0.223 0.091 29.234);
}
```

Your base color lands verbatim at `<name>-500` (or your chosen `--step`),
and the ramp reads like one of Tailwind's own: lightness targets and chroma
taper derived from v4's real palettes, every step gamut-mapped to sRGB.

## Install

No install needed — run it directly:

```bash
bunx @sethyrung/tailwind_tools palette '#ff0000'
npx @sethyrung/tailwind_tools palette '#ff0000'
```

Or install globally:

```bash
bun add -g @sethyrung/tailwind_tools   # then: tailwind_tools palette '#ff0000'
npm install -g @sethyrung/tailwind_tools
```

Requires [Bun](https://bun.com) >= 1.4 (or Node >= 18). For local development,
clone and `bun link` instead — edits stay live.

## Usage

```bash
tailwind_tools palette '<color>' [flags]
```

The command word is required — `tailwind_tools palette --help` prints the
palette usage, and a bare `tailwind_tools` lists the commands. The base color
accepts any CSS format — hex, `rgb()`, `hsl()`, named colors, or `oklch()`
(which passes through untouched).

| Flag                              | Effect                                                              |
| --------------------------------- | ------------------------------------------------------------------- |
| _(none)_                          | Tailwind v4 `@theme` block, oklch values (default)                  |
| `--step <50..950>`                | Anchor base color to a specific shade (default: 500)                |
| `--name <name>`                   | Override the auto-detected palette name                             |
| `--v3`                            | Export a `tailwind.config.js` snippet instead of the `@theme` block |
| `--format <oklch\|hex\|rgb\|hsl>` | Color notation of the emitted values (default: oklch)               |
| `--preview`                       | Print an ANSI swatch strip above the output                         |
| `--help`, `-h`                    | Usage                                                               |

Examples:

```bash
tailwind_tools palette '#111410' --step 700
tailwind_tools palette 'oklch(0.6 0.1 29)' --name brand
tailwind_tools palette '#ff0000' --v3 --format hex
tailwind_tools palette 'teal' --preview
```

### Palette naming

The name defaults to the nearest CSS named color (`#ff0000` → `red`). Watch
out: auto-names can shadow Tailwind's built-in colors inside `@theme` — pass
`--name brand` to choose your own.

### Tailwind v3 export

```bash
$ tailwind_tools palette '#ff0000' --v3 --format hex
module.exports = {
  theme: {
    extend: {
      colors: {
        red: {
          50: "#fff5f3",
          100: "#ffe7e2",
          /* … */
          950: "#3c0000",
        },
      },
    },
  },
};
```

## How it works

- Parse any CSS color (via [culori](https://culorijs.org/)) and normalize to OKLCH.
- Anchor the base color verbatim at step 500 (or the step given by `--step`);
  scale a v4-derived lightness ladder around it — natural spacing near the
  archetypal base, stretched or compressed for extreme bases, never two identical
  steps.
- Apply a v4-derived chroma taper (peak at 500, whisper at 50, moderate at 950),
  scaled relative to the anchor step, then gamut-map every step so nothing clips.

Decisions are recorded in [docs/adr](docs/adr); the domain vocabulary lives in
[CONTEXT.md](CONTEXT.md).

## Development

```bash
bun install
bun test               # test suite (single seam: the CLI entry, in-process)
bun run typecheck      # tsc --noEmit
bun run lint           # oxlint
bun run fmt            # oxfmt
bun run start palette '#ff0000'
```
