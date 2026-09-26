import { generatePalette, PaletteError } from "@/core";
import { toThemeCss } from "@/format";
import { kebabCase } from "@/name";

export type CliResult = { output: string; exitCode: number };

const USAGE = `Usage: tailshade '<color>' [--name <name>]

Generate a Tailwind v4 palette from a base color (any CSS color format).

The palette name defaults to the nearest CSS color name, which can shadow
Tailwind's built-in colors (red, teal, ...) inside @theme — pass --name to
choose your own.

Example: tailshade '#ff0000'
         tailshade '#ff0000' --name brand`;

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  let color: string | undefined;
  let name: string | undefined;

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
    return { output: toThemeCss(palette), exitCode: 0 };
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
