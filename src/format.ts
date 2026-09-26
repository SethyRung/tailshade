import { converter, formatHex, formatHsl, formatRgb, type Color } from "culori";
import type { Palette, PaletteEntry } from "@/core";

export type Notation = "oklch" | "hex" | "rgb" | "hsl";

const toRgb = converter("rgb");

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

/**
 * An ANSI truecolor swatch strip — one labeled block per step, 50→950 —
 * rendered from the palette's own colors. Labels stay plain text.
 */
export function toPreviewStrip(palette: Palette): string {
  const ESC = String.fromCharCode(27);
  const blocks = palette.steps.map((s) => {
    const rgb = toRgb(asColor(s))!;
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => Math.round((v ?? 0) * 255));
    const label = s.step.toString().padStart(3);
    return `${label} ${ESC}[48;2;${r};${g};${b}m      ${ESC}[0m`;
  });
  return blocks.join(" ");
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
