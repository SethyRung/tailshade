import { generatePalette, PaletteError } from "@/core";
import { toTailwindV3, toThemeCss, type Notation } from "@/format";
import { kebabCase } from "@/name";

const NOTATIONS: Notation[] = ["oklch", "hex", "rgb", "hsl"];

export type CliResult = { output: string; exitCode: number };

const USAGE = `Usage: tailshade '<color>' [--name <name>] [--v3] [--format <oklch|hex|rgb|hsl>]

Generate a Tailwind v4 palette from a base color (any CSS color format).

The palette name defaults to the nearest CSS color name, which can shadow
Tailwind's built-in colors (red, teal, ...) inside @theme — pass --name to
choose your own. Pass --v3 to export a tailwind.config.js snippet instead of
the v4 @theme block. Values default to oklch; pass --format to switch the
notation (hex, rgb, hsl).

Example: tailshade '#ff0000'
         tailshade '#ff0000' --name brand
         tailshade '#ff0000' --v3 --format hex`;

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  let color: string | undefined;
  let name: string | undefined;
  let v3 = false;
  let notation: Notation | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--name") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        return usage("--name requires a value");
      }
      name = value;
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
    const palette = generatePalette(color);
    if (name !== undefined) {
      const kebab = kebabCase(name);
      if (!kebab) {
        return usage(`--name '${name}' must contain letters or digits`);
      }
      palette.name = kebab;
    }
    const fmt = notation ?? "oklch";
    const output = v3 ? toTailwindV3(palette, fmt) : toThemeCss(palette, fmt);
    return { output, exitCode: 0 };
  } catch (error) {
    if (error instanceof PaletteError) {
      return usage(error.message);
    }
    throw error;
  }
}

function usage(message: string): CliResult {
  return { output: `tailshade: ${message}\n\n${USAGE}`, exitCode: 1 };
}
