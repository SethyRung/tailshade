import { parse } from "culori";
import { generatePalette, PaletteError, STEPS, type Step } from "@/core";
import { toPreviewStrip, toTailwindV3, toThemeCss, type Notation } from "@/format";
import { kebabCase } from "@/name";

const NOTATIONS: Notation[] = ["oklch", "hex", "rgb", "hsl"];

export type CliResult = { output: string; exitCode: number };

const ROOT_USAGE = `Usage: tailwind_tools <command>

Commands:
  palette   Generate a palette from a base color`;

const PALETTE_USAGE = `Usage: tailwind_tools palette '<color>' [flags]
       tailwind_tools palette [flags] --color '<color>'

Generate a Tailwind v4 palette from a base color (any CSS color format).
The base color is the argument next to palette, or the --color flag's
value — never both.

The base color anchors at step 500 by default — pass --step to anchor at any
shade (50, 100, 200, ..., 950). The palette name defaults to the nearest CSS
color name, which can shadow Tailwind's built-in colors (red, teal, ...) inside
@theme — pass --name to choose your own. Pass --v3 to export a tailwind.config.js
snippet instead of the v4 @theme block. Values default to oklch; pass --format
to switch the notation (hex, rgb, hsl). Pass --preview to print an ANSI swatch
strip above the output.

Example: tailwind_tools palette '#ff0000'
         tailwind_tools palette '#111410' --step 700
         tailwind_tools palette --color '#ff0000' --name brand
         tailwind_tools palette '#ff0000' --v3 --format hex --preview`;

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  const [command, ...rest] = argv;
  if (argv.includes("--help") || argv.includes("-h")) {
    const output = argv.includes("palette") ? PALETTE_USAGE : ROOT_USAGE;
    return { output, exitCode: 0 };
  }
  if (command === undefined) {
    return rootUsage("expected a command");
  }
  if (command === "palette") {
    return paletteCommand(rest);
  }
  if (command.startsWith("--")) {
    return rootUsage(`unknown flag '${command}'`);
  }
  if (looksLikeColorLiteral(command)) {
    return rootUsage(
      `'${command}' looks like a base color.\nDid you mean: tailwind_tools palette '${command}'`,
    );
  }
  return rootUsage(`unknown command '${command}'`);
}

/** Hex or function-notation color tokens get the migration hint; bare words stay commands. */
function looksLikeColorLiteral(token: string): boolean {
  if (!token.startsWith("#") && !token.includes("(")) return false;
  return parse(token) !== undefined;
}

function rootUsage(message: string): CliResult {
  return { output: `tailwind_tools: ${message}\n\n${ROOT_USAGE}`, exitCode: 1 };
}

function paletteCommand(args: string[]): CliResult {
  const slot = args[0];
  if (slot !== undefined && !slot.startsWith("--")) {
    return runPalette(slot, args.slice(1));
  }
  return runPalette(undefined, args);
}

function runPalette(positional: string | undefined, args: string[]): CliResult {
  let name: string | undefined;
  let step: Step = 500;
  let v3 = false;
  let preview = false;
  let notation: Notation | undefined;
  let colorFlag: string | undefined;
  let extraPositional = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--color") {
      const value = args[++i];
      if (value === undefined || value.startsWith("--")) {
        return usage("--color requires a value");
      }
      if (colorFlag !== undefined) {
        return usage("--color given twice");
      }
      colorFlag = value;
      continue;
    }
    if (arg === "--step") {
      const value = args[++i];
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
      const value = args[++i];
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
      const value = args[++i];
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
    extraPositional = true;
  }
  if (positional !== undefined && colorFlag !== undefined) {
    return usage("got a color next to palette and --color");
  }
  const color = positional ?? colorFlag;
  if (color === undefined) {
    return usage(
      "expected a base color\nPass it as: tailwind_tools palette '<color>'\n      or as: tailwind_tools palette --color '<color>'",
    );
  }
  if (extraPositional) {
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
  return { output: `tailwind_tools: ${message}\n\n${PALETTE_USAGE}`, exitCode: 1 };
}
