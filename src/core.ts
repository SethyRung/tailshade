import { converter, displayable, parse } from "culori";
import { detectName, type Oklch } from "@/name";
import { CHROMA_RATIOS, L_MAX, L_MIN, LIGHTNESS_BOUNDS, TARGETS } from "@/targets";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];

const toOklch = converter("oklch");

export type PaletteEntry = { step: Step; l: number; c: number; h: number };
export type Palette = { name: string; base: Oklch; anchorStep: Step; steps: PaletteEntry[] };

export class PaletteError extends Error {}

function target(step: Step): number {
  const t = TARGETS[step];
  if (t === undefined) {
    throw new Error(`missing lightness target for step ${step}`);
  }
  return t;
}

function taperRatio(step: Step, anchorStep: Step = 500): number {
  const ratio = CHROMA_RATIOS[step];
  const anchorRatio = CHROMA_RATIOS[anchorStep];
  if (ratio === undefined || anchorRatio === undefined) {
    throw new Error(`missing chroma taper ratio for step ${step} or anchor ${anchorStep}`);
  }
  return ratio / anchorRatio;
}

/**
 * Parse any CSS color and normalize to OKLCH. Achromatic colors have no
 * meaningful hue, so missing/NaN channels normalize to 0.
 */
function parseBase(input: string): Oklch {
  const color = parse(input);
  if (!color) {
    throw new PaletteError(`could not parse color '${input}'`);
  }
  const oklch = toOklch(color);
  if (!oklch) {
    throw new PaletteError(`could not convert color '${input}' to oklch`);
  }
  const h = Number.isFinite(oklch.h) ? (oklch.h as number) : 0;
  const c = Number.isFinite(oklch.c) ? (oklch.c as number) : 0;
  return { l: oklch.l ?? 0, c, h };
}

/**
 * Lightness ladder for the 11 steps, scaled around the base's L. Clamping
 * each endpoint keeps archetypal bases on the universal ladder and stretches
 * or compresses extreme bases to span the range without duplicate steps.
 */
export function lightnessLadder(baseL: number, anchorStep: Step = 500): Map<Step, number> {
  const bounds = LIGHTNESS_BOUNDS[anchorStep] ?? { min: 0.03, max: 0.97 };
  if (baseL > bounds.max) {
    throw new PaletteError("base color is too light to build a 50–950 ramp");
  }
  if (baseL < bounds.min) {
    throw new PaletteError("base color is too dark to build a 50–950 ramp");
  }
  const tAnchor = target(anchorStep);
  const upExtent = target(50) - tAnchor;
  const downExtent = target(950) - tAnchor;

  const end50 = Math.min(Math.max(baseL + upExtent, target(50)), L_MAX);
  const end950 = Math.max(Math.min(baseL + downExtent, target(950)), L_MIN);
  const scaleUp = upExtent === 0 ? 1 : (end50 - baseL) / upExtent;
  const scaleDown = downExtent === 0 ? 1 : (end950 - baseL) / downExtent;

  const ladder = new Map<Step, number>();
  for (const step of STEPS) {
    if (step === anchorStep) {
      ladder.set(step, baseL);
      continue;
    }
    const scale = step < anchorStep ? scaleUp : scaleDown;
    ladder.set(step, baseL + (target(step) - tAnchor) * scale);
  }

  const values = STEPS.map((s) => round3(ladder.get(s)!));
  for (let i = 1; i < values.length; i++) {
    if (values[i]! >= values[i - 1]!) {
      if (baseL > target(anchorStep)) {
        throw new PaletteError("base color is too light to build a 50–950 ramp");
      } else {
        throw new PaletteError("base color is too dark to build a 50–950 ramp");
      }
    }
  }

  return ladder;
}

function ladderLightness(ladder: Map<Step, number>, step: Step): number {
  const l = ladder.get(step);
  if (l === undefined) {
    throw new Error(`missing ladder entry for step ${step}`);
  }
  return l;
}

/** Largest chroma at fixed L and H that stays inside the sRGB gamut. */
function maxInGamutChroma(l: number, c: number, h: number): number {
  if (c <= 0) return 0;
  if (displayable({ mode: "oklch", l, c, h })) return c;
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (displayable({ mode: "oklch", l, c: mid, h })) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const floor3 = (n: number) => Math.floor(n * 1000) / 1000;

/**
 * Generate the full 50–950 palette from a base color. Chroma follows the
 * v4 taper ratios, is gamut-mapped at the rounded L/H and floored so the
 * printed triple can't round its way out of the sRGB gamut.
 */
export function generatePalette(input: string, anchorStep: Step = 500): Palette {
  const base = parseBase(input);
  const ladder = lightnessLadder(base.l, anchorStep);
  const steps: PaletteEntry[] = STEPS.map((step) => {
    const l = round3(ladderLightness(ladder, step));
    const h = round3(base.h);
    const c = floor3(maxInGamutChroma(l, base.c * taperRatio(step, anchorStep), h));
    return { step, l, c, h };
  });
  return { name: detectName(base), base, anchorStep, steps };
}
