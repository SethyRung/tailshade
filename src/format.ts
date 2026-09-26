import type { Palette } from "@/core";

const fmt = (n: number) => n.toFixed(3);

/** A Tailwind v4 @theme block with three-decimal oklch values. */
export function toThemeCss(palette: Palette): string {
  const lines = palette.steps.map(
    (s) => `  --color-${palette.name}-${s.step}: oklch(${fmt(s.l)} ${fmt(s.c)} ${fmt(s.h)});`,
  );
  return ["@theme {", ...lines, "}"].join("\n");
}
