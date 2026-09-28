import { generatePalette, PaletteError, STEPS, type Step } from "@/utils/palette/core";
import { toPreviewStrip, toTailwindV3, toThemeCss, type Notation } from "@/utils/palette/format";
import { kebabCase } from "@/utils/palette/name";
import { takeValue } from "@/utils/parse";
import { PALETTE_USAGE } from "@/consts/help";
import type { CliResult } from "@/types/result";

const NOTATIONS: Notation[] = ["oklch", "hex", "rgb", "hsl"];

export function paletteCommand(args: string[]): CliResult {
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
      const value = takeValue(args, i);
      if (value === undefined) {
        return usage("--color requires a value");
      }
      if (colorFlag !== undefined) {
        return usage("--color given twice");
      }
      colorFlag = value;
      i++;
      continue;
    }
    if (arg === "--step") {
      const value = takeValue(args, i);
      if (value === undefined) {
        return usage("--step requires a value");
      }
      const num = Number(value);
      if (!Number.isInteger(num) || !STEPS.includes(num as Step)) {
        return usage(`--step '${value}' expects one of: ${STEPS.join(", ")}`);
      }
      step = num as Step;
      i++;
      continue;
    }
    if (arg === "--name") {
      const value = takeValue(args, i);
      if (value === undefined) {
        return usage("--name requires a value");
      }
      name = value;
      i++;
      continue;
    }
    if (arg === "--preview") {
      preview = true;
      continue;
    }
    if (arg === "--format") {
      const value = takeValue(args, i);
      if (value === undefined) {
        return usage("--format requires a value");
      }
      if (!NOTATIONS.includes(value as Notation)) {
        return usage(`--format '${value}' expects one of: ${NOTATIONS.join(", ")}`);
      }
      notation = value as Notation;
      i++;
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
