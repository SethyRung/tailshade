import { formatHex, formatHsl, formatRgb, type Color } from "culori";
import type { Palette, PaletteEntry } from "@/core";

export type Notation = "oklch" | "hex" | "rgb" | "hsl";

const fmt = (n: number) => n.toFixed(3);

const asColor = (s: { l: number; c: number; h: number }): Color =>
  ({ mode: "oklch", l: s.l, c: s.c, h: s.h }) as Color;

const NOTATIONS: Record<Notation, (s: PaletteEntry) => string> = {
  oklch: (s) => `oklch(${fmt(s.l)} ${fmt(s.c)} ${fmt(s.h)})`,
  hex: (s) => formatHex(asColor(s)),
  rgb: (s) => formatRgb(asColor(s)),
  hsl: (s) => formatHsl(asColor(s)),
};

/** Stringify one palette step in the given color notation. */
export function valueStr(s: PaletteEntry, notation: Notation): string {
  return NOTATIONS[notation](s);
}

/** A Tailwind v4 @theme block; values in the given notation (oklch default). */
export function toThemeCss(palette: Palette, notation: Notation = "oklch"): string {
  const lines = palette.steps.map(
    (s) => `  --color-${palette.name}-${s.step}: ${valueStr(s, notation)};`,
  );
  return ["@theme {", ...lines, "}"].join("\n");
}

/** A paste-ready Tailwind v3 config snippet for the same palette. */
export function toTailwindV3(palette: Palette, notation: Notation = "oklch"): string {
  const entries = palette.steps.map((s) => `          ${s.step}: "${valueStr(s, notation)}",`);
  return [
    "module.exports = {",
    "  theme: {",
    "    extend: {",
    "      colors: {",
    `        ${palette.name}: {`,
    ...entries,
    "        },",
    "      },",
    "    },",
    "  },",
    "};",
  ].join("\n");
}
