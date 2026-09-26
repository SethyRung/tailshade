/**
 * Per-step lightness targets: mean L across the 17 chromatic families of
 * Tailwind v4's theme.css.
 */
export const TARGETS: Record<number, number> = {
  50: 0.9772,
  100: 0.9504,
  200: 0.9055,
  300: 0.8405,
  400: 0.7535,
  500: 0.6827,
  600: 0.5978,
  700: 0.5149,
  800: 0.4461,
  900: 0.3946,
  950: 0.2779,
};

/** Ramp endpoint bounds: the 50 and 950 steps clamp into these. */
export const L_MAX = 0.985;
export const L_MIN = 0.02;

/** Bases beyond this cannot fit 4 distinct steps above/below. */
export const L_TOO_LIGHT = 0.97;
export const L_TOO_DARK = 0.03;

/**
 * Chroma taper ratios per step (C_step / C_500): mean ratio across the 17
 * chromatic families of Tailwind v4's theme.css. Chroma peaks at the base
 * step and tapers hard toward 50, gently toward 950.
 */
export const CHROMA_RATIOS: Record<number, number> = {
  50: 0.0867,
  100: 0.2082,
  200: 0.3993,
  300: 0.6594,
  400: 0.9036,
  500: 1,
  600: 0.9823,
  700: 0.8606,
  800: 0.7083,
  900: 0.5679,
  950: 0.4013,
};
