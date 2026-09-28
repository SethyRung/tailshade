export const ROOT_USAGE = `Usage: tailwind_tools <command>

Commands:
  palette   Generate a palette from a base color`;

export const PALETTE_USAGE = `Usage: tailwind_tools palette '<color>' [flags]
       tailwind_tools palette [flags] --color '<color>'

Generate a Tailwind v4 palette from a base color (any CSS color format).
The base color is the argument next to palette, or the --color flag's
value — never both.

The base color anchors at step 500 by default — pass --step to anchor at any
shade (50, 100, 200, ..., 950). The palette name defaults to the nearest CSS
color name, which can shadow Tailwind's built-in colors (red, teal, ...) inside
@theme — pass --name to choose your own. Pass --v3 to export a tailwind.config.js
snippet instead of the v4 @theme block. Values default to oklch; pass --format
to switch the notation (hex, rgb, hsl). Pass --preview to print an ANSI swatch
strip above the output.

Example: tailwind_tools palette '#ff0000'
         tailwind_tools palette '#111410' --step 700
         tailwind_tools palette --color '#ff0000' --name brand
         tailwind_tools palette '#ff0000' --v3 --format hex --preview`;

export const commandHelpTexts: Record<string, string> = {
  palette: PALETTE_USAGE,
};
