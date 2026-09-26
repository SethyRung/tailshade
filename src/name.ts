import { colorsNamed, converter, differenceEuclidean, nearest, parse } from "culori";

const toOklch = converter("oklch");

export type Oklch = { l: number; c: number; h: number };

type NamedColor = { name: string; color: Oklch };

const NAMED_COLORS: NamedColor[] = Object.entries(colorsNamed).flatMap(([name, int]) => {
  const color = toOklch(parse("#" + Number(int).toString(16).padStart(6, "0")));
  return color && Number.isFinite(color.l) ? [{ name, color: normalize(color) }] : [];
});

const findNearest = nearest(NAMED_COLORS, differenceEuclidean("oklch"), (entry) => ({
  mode: "oklch",
  ...entry.color,
}));

function normalize(color: { l?: number; c?: number; h?: number }): Oklch {
  return {
    l: color.l ?? 0,
    c: Number.isFinite(color.c) ? (color.c as number) : 0,
    h: Number.isFinite(color.h) ? (color.h as number) : 0,
  };
}

/** Closest CSS named color to the given color in OKLCH space, kebab-cased. */
export function detectName(color: Oklch): string {
  const [hit] = findNearest({ mode: "oklch", ...color });
  if (!hit) {
    throw new Error("no named colors available");
  }
  return hit.name.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
