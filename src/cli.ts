import { generatePalette, PaletteError } from "@/core";
import { toThemeCss } from "@/format";

export type CliResult = { output: string; exitCode: number };

const USAGE = `Usage: tailshade '<color>' [flags]

Generate a Tailwind v4 palette from a base color (any CSS color format).

Example: tailshade '#ff0000'`;

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  const [color, ...rest] = argv;
  if (!color || color.startsWith("--") || rest.length > 0) {
    return { output: `tailshade: expected exactly one color argument\n\n${USAGE}`, exitCode: 1 };
  }
  try {
    const palette = generatePalette(color);
    return { output: toThemeCss(palette), exitCode: 0 };
  } catch (error) {
    if (error instanceof PaletteError) {
      return { output: `tailshade: ${error.message}\n\n${USAGE}`, exitCode: 1 };
    }
    throw error;
  }
}
