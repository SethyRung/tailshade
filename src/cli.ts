import { generatePalette, PaletteError, STEPS, type Step } from "@/core";
import { toPreviewStrip, toTailwindV3, toThemeCss, type Notation } from "@/format";
import { kebabCase } from "@/name";

const NOTATIONS: Notation[] = ["oklch", "hex", "rgb", "hsl"];

export type CliResult = { output: string; exitCode: number };

const USAGE = `Usage: tailwind_tools '<color>' [--step <50..950>] [--name <name>] [--v3] [--format <oklch|hex|rgb|hsl>] [--preview]

Generate a Tailwind v4 palette from a base color (any CSS color format).

The base color anchors at step 500 by default — pass --step to anchor at any
shade (50, 100, 200, ..., 950). The palette name defaults to the nearest CSS
color name, which can shadow Tailwind's built-in colors (red, teal, ...) inside
@theme — pass --name to choose your own. Pass --v3 to export a tailwind.config.js
snippet instead of the v4 @theme block. Values default to oklch; pass --format
to switch the notation (hex, rgb, hsl). Pass --preview to print an ANSI swatch
strip above the output.

Example: tailwind_tools '#ff0000'
         tailwind_tools '#111410' --step 700
         tailwind_tools '#ff0000' --name brand
         tailwind_tools '#ff0000' --v3 --format hex --preview`;

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  let color: string | undefined;
  let name: string | undefined;
  let step: Step = 500;
  let v3 = false;
  let preview = false;
  let notation: Notation | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--help" || arg === "-h") {
      return { output: USAGE, exitCode: 0 };
    }
    if (arg === "--step") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        return usage("--step requires a value");
      }
      const num = Number(value);
      if (!Number.isInteger(num) || !STEPS.includes(num as Step)) {
        return usage(`--step '${value}' expects one of: ${STEPS.join(", ")}`);
      }
      step = num as Step;
      continue;
    }
    if (arg === "--name") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        return usage("--name requires a value");
      }
      name = value;
      continue;
    }
    if (arg === "--preview") {
      preview = true;
      continue;
    }
    if (arg === "--format") {
      const value = argv[++i];
      if (value === undefined) {
        return usage("--format requires a value");
      }
      if (!NOTATIONS.includes(value as Notation)) {
        return usage(`--format '${value}' expects one of: ${NOTATIONS.join(", ")}`);
      }
      notation = value as Notation;
      continue;
    }
    if (arg === "--v3") {
      v3 = true;
      continue;
    }
    if (arg.startsWith("--")) {
      return usage(`unknown flag '${arg}'`);
    }
    if (color !== undefined) {
      return usage("expected exactly one color argument");
    }
    color = arg;
  }
  if (color === undefined) {
    return usage("expected exactly one color argument");
  }

  try {
    const palette = generatePalette(color, step);
    if (name !== undefined) {
      const kebab = kebabCase(name);
      if (!kebab) {
        return usage(`--name '${name}' must contain letters or digits`);
      }
      palette.name = kebab;
    }
    const fmt = notation ?? "oklch";
    let output = v3 ? toTailwindV3(palette, fmt) : toThemeCss(palette, fmt);
    if (preview) {
      output = `${toPreviewStrip(palette)}\n\n${output}`;
    }
    return { output, exitCode: 0 };
  } catch (error) {
    if (error instanceof PaletteError) {
      return usage(error.message);
    }
    throw error;
  }
}

function usage(message: string): CliResult {
  return { output: `tailwind_tools: ${message}\n\n${USAGE}`, exitCode: 1 };
}
