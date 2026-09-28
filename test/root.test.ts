import { describe, expect, test } from "bun:test";
import pkg from "../package.json" with { type: "json" };
import { main } from "@/cli";

describe("root routing", () => {
  test("the palette command prints the same palette as the old bare form", () => {
    const { output, exitCode } = main(["palette", "#ff0000"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("@theme {");
    expect(output).toContain("--color-red-500:");
  });

  test("a bare base color no longer runs", () => {
    const { output, exitCode } = main(["#ff0000"]);

    expect(exitCode).toBe(1);
    expect(output).not.toContain("--color-");
  });

  test("no arguments prints root usage and exits non-zero", () => {
    const { output, exitCode } = main([]);

    expect(exitCode).toBe(1);
    expect(output).toContain("tailwind_tools: expected a command");
    expect(output).toContain("Usage: tailwind_tools <command>");
    expect(output).toContain("Commands:");
    expect(output).toContain("palette");
  });

  test("an unknown command exits non-zero naming the token", () => {
    const { output, exitCode } = main(["nosuch"]);

    expect(exitCode).toBe(1);
    expect(output).toContain("unknown command 'nosuch'");
    expect(output).toContain("Usage: tailwind_tools <command>");
  });

  test("only lowercase palette dispatches", () => {
    const { output, exitCode } = main(["Palette", "#ff0000"]);

    expect(exitCode).toBe(1);
    expect(output).toContain("unknown command 'Palette'");
    expect(output).not.toContain("--color-");
  });

  test("a leading unknown flag is not dispatched into palette", () => {
    const { output, exitCode } = main(["--step", "700", "palette", "#ff0000"]);

    expect(exitCode).toBe(1);
    expect(output).toContain("unknown flag '--step'");
    expect(output).not.toContain("--color-");
  });

  test("a color literal as the first token hints the palette form", () => {
    for (const color of ["#ff0000", "oklch(0.6 0.1 29)", "rgba(0, 0, 0)"]) {
      const { output, exitCode } = main([color]);
      expect(exitCode).toBe(1);
      expect(output).toContain("looks like a base color");
      expect(output).toContain(`tailwind_tools palette '${color}'`);
      expect(output).not.toContain("--color-");
    }
  });

  test("non-parsing shapes and bare words are unknown commands", () => {
    for (const token of ["teal", "foo(", "#ggg"]) {
      const { output, exitCode } = main([token]);
      expect(exitCode).toBe(1);
      expect(output).toContain(`unknown command '${token}'`);
      expect(output).not.toContain("looks like a base color");
    }
  });
});

describe("version", () => {
  test("--version and -v print the package version and exit zero", () => {
    for (const flag of ["--version", "-v"]) {
      const { output, exitCode } = main([flag]);
      expect(exitCode).toBe(0);
      expect(output).toBe(pkg.version);
    }
  });

  test("--version works alongside a command", () => {
    for (const argv of [
      ["palette", "--version"],
      ["palette", "-v"],
    ]) {
      const { output, exitCode } = main(argv);
      expect(exitCode).toBe(0);
      expect(output).toBe(pkg.version);
    }
  });

  test("root usage documents the version flag", () => {
    const { output } = main([]);

    expect(output).toContain("--version");
  });
});

describe("root help routing", () => {
  test("--help and -h print usage and exit zero", () => {
    for (const flag of ["--help", "-h"]) {
      const root = main([flag]);
      expect(root.exitCode).toBe(0);
      expect(root.output).toContain("Usage: tailwind_tools <command>");
      expect(root.output).toContain("palette");
      expect(root.output).not.toContain("Example:");

      const palette = main(["palette", flag]);
      expect(palette.exitCode).toBe(0);
      expect(palette.output).toContain("Example: tailwind_tools palette '#ff0000'");
    }
  });

  test("help with palette anywhere prints palette usage and exits zero", () => {
    const forms = [
      ["palette", "--help"],
      ["--help", "palette"],
      ["palette", "-h"],
      ["-h", "palette"],
    ];
    for (const argv of forms) {
      const { output, exitCode } = main(argv);
      expect(exitCode).toBe(0);
      expect(output).toContain("Usage: tailwind_tools palette");
      expect(output).toContain("Example: tailwind_tools palette '#ff0000'");
    }
  });

  test("help without a command prints root usage, no hint", () => {
    const { output, exitCode } = main(["--help", "#ff0000"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("Usage: tailwind_tools <command>");
    expect(output).not.toContain("looks like a base color");
  });

  test("--help wins over other arguments", () => {
    const { output, exitCode } = main(["palette", "#ff0000", "--help"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
    expect(output).not.toContain("--color-");
  });
});
