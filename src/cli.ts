import { parse } from "culori";
import pkg from "../package.json" with { type: "json" };
import { paletteCommand } from "@/commands/palette";
import { commandHelpTexts, ROOT_USAGE } from "@/consts/help";
import type { CliResult } from "@/types/result";

/**
 * CLI entry and the single test seam: pure — takes an argv array, returns
 * the output and exit code instead of writing to stdout.
 */
export function main(argv: string[]): CliResult {
  const [command, ...rest] = argv;
  if (argv.includes("--help") || argv.includes("-h")) {
    const named = argv.find((arg) => commandHelpTexts[arg] !== undefined);
    const output = named !== undefined ? commandHelpTexts[named]! : ROOT_USAGE;
    return { output, exitCode: 0 };
  }
  if (argv.includes("--version") || argv.includes("-v")) {
    return { output: pkg.version, exitCode: 0 };
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
