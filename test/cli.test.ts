import { describe, expect, test } from "bun:test";
import { converter, differenceEuclidean, displayable, parse } from "culori";
import { main } from "@/cli";

const toOklch = converter("oklch");

function stepsOf(output: string): { step: number; l: number; c: number; h: number }[] {
  return [...output.matchAll(/--color-[a-z]+-(\d+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)].map(
    (m) => ({ step: Number(m[1]), l: Number(m[2]), c: Number(m[3]), h: Number(m[4]) }),
  );
}

describe("tailwind_tools CLI seam", () => {
  test("hex base color prints a @theme palette with all 11 steps", () => {
    const { output, exitCode } = main(["palette", "#ff0000"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("@theme {");
    expect(output.trim().endsWith("}")).toBe(true);

    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(output).toContain(`--color-red-${step}:`);
    }
  });

  test("the Base color appears verbatim at 500", () => {
    const { output } = main(["palette", "#ff0000"]);
    const emitted = stepsOf(output).find((s) => s.step === 500)!;
    const input = toOklch(parse("#ff0000")!);

    expect(Math.abs(emitted.l - input.l)).toBeLessThan(0.001);
    expect(Math.abs(emitted.c - (input.c ?? 0))).toBeLessThan(0.001);
    expect(Math.abs(emitted.h - (input.h ?? 0))).toBeLessThan(0.001);
  });

  test("lightness is strictly monotonic and every step is distinct and in gamut", () => {
    const { output } = main(["palette", "#ff0000"]);
    const steps = stepsOf(output);

    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1]!;
      expect(steps[i]!.l).toBeLessThan(prev.l);
    }
    expect(new Set(steps.map((s) => `${s.l} ${s.c} ${s.h}`)).size).toBe(11);

    for (const s of steps) {
      expect(displayable({ mode: "oklch", ...s })).toBe(true);
    }
  });

  test("every value prints at three decimals", () => {
    const { output } = main(["palette", "#ff0000"]);
    const lines = output.split("\n").filter((l) => l.includes("oklch"));

    expect(lines.length).toBe(11);
    for (const line of lines) {
      expect(line).toMatch(/oklch\(\d+\.\d{3} \d+\.\d{3} \d+\.\d{3}\);/);
    }
  });

  test("accepts every CSS color format and keeps oklch untouched", () => {
    const inputs = [
      "#ff0000",
      "rgb(255 0 0)",
      "hsl(0 100% 50%)",
      "red",
      "oklch(0.637 0.237 25.331)",
    ];

    for (const input of inputs) {
      const { output, exitCode } = main(["palette", input]);
      expect(exitCode).toBe(0);

      const steps = stepsOf(output);
      expect(steps.length).toBe(11);
      for (const s of steps) {
        expect(displayable({ mode: "oklch", ...s })).toBe(true);
      }

      if (input.startsWith("oklch")) {
        const emitted = steps.find((s) => s.step === 500)!;
        const original = toOklch(parse(input)!);
        expect(Math.abs(emitted.l - original.l)).toBeLessThan(0.001);
        expect(Math.abs(emitted.c - original.c)).toBeLessThan(0.001);
        expect(Math.abs(emitted.h - (original.h ?? 0))).toBeLessThan(0.001);
      }
    }
  });

  describe("errors", () => {
    test("missing color argument exits non-zero with a quoted example", () => {
      const { output, exitCode } = main(["palette"]);

      expect(exitCode).toBe(1);
      expect(output).toContain("Usage:");
      expect(output).toContain(`tailwind_tools palette '#ff0000'`);
    });

    test("unparseable color exits non-zero with the input in the message", () => {
      const { output, exitCode } = main(["palette", "notacolor"]);

      expect(exitCode).toBe(1);
      expect(output).toContain("notacolor");
      expect(output).toContain("Usage:");
    });

    test("too-light and too-dark bases exit non-zero with the reason", () => {
      const light = main(["palette", "#ffffff"]);
      expect(light.exitCode).toBe(1);
      expect(light.output).toContain("too light");

      const dark = main(["palette", "#000000"]);
      expect(dark.exitCode).toBe(1);
      expect(dark.output).toContain("too dark");
    });

    test("unknown flags and extra arguments exit non-zero", () => {
      expect(main(["palette", "#ff0000", "--foo"]).exitCode).toBe(1);
      expect(main(["palette", "#ff0000", "#00ff00"]).exitCode).toBe(1);
    });
  });

  test("extreme bases compress spacing but keep every step distinct", () => {
    for (const base of ["oklch(0.9 0.1 300)", "oklch(0.25 0.1 300)", "oklch(0.05 0.1 300)"]) {
      const { output, exitCode } = main(["palette", base]);
      expect(exitCode).toBe(0);

      const steps = stepsOf(output);
      expect(steps.length).toBe(11);
      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1]!;
        expect(steps[i]!.l).toBeLessThan(prev.l);
      }
      expect(new Set(steps.map((s) => s.l)).size).toBe(11);
      for (const s of steps) {
        expect(displayable({ mode: "oklch", ...s })).toBe(true);
      }
    }
  });

  test("a gray base produces a gray ramp under the gray name", () => {
    const { output, exitCode } = main(["palette", "#808080"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("--color-gray-500:");

    const steps = stepsOf(output);
    for (const s of steps) {
      expect(s.c).toBe(0);
      expect(displayable({ mode: "oklch", ...s })).toBe(true);
    }
  });
});

describe("chroma taper", () => {
  test("emitted chroma follows the v4-derived taper ratios for a moderate base", () => {
    // Base chroma 0.1 stays under the gamut limit at every step lightness for
    // this hue, so the emitted chroma exposes the taper curve directly.
    // Expected values: floor3(0.1 * v4 ratio) per step.
    const { output, exitCode } = main(["palette", "oklch(0.6 0.1 29)"]);
    expect(exitCode).toBe(0);

    const chroma = new Map(stepsOf(output).map((s) => [s.step, s.c]));
    const expected: Record<number, number> = {
      50: 0.008,
      100: 0.02,
      200: 0.039,
      300: 0.065,
      400: 0.09,
      500: 0.1,
      600: 0.098,
      700: 0.086,
      800: 0.07,
      900: 0.056,
      950: 0.04,
    };
    for (const [step, c] of Object.entries(expected)) {
      expect(chroma.get(Number(step))).toBe(c);
    }
  });

  test("v4's own red-500 approximates v4's red ramp within tolerance", () => {
    const { output, exitCode } = main(["palette", "oklch(0.637 0.237 25.331)"]);
    expect(exitCode).toBe(0);

    // Tailwind v4's hand-tuned red ramp (theme.css): [L, C] per step.
    const v4Red: Record<number, [number, number]> = {
      50: [0.971, 0.013],
      100: [0.936, 0.032],
      200: [0.885, 0.062],
      300: [0.808, 0.114],
      400: [0.704, 0.191],
      500: [0.637, 0.237],
      600: [0.577, 0.245],
      700: [0.505, 0.213],
      800: [0.444, 0.177],
      900: [0.396, 0.141],
      950: [0.258, 0.092],
    };

    for (const s of stepsOf(output)) {
      const [l, c] = v4Red[s.step]!;
      expect(Math.abs(s.l - l)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(s.c - c)).toBeLessThanOrEqual(0.05);
    }
  });

  test("chroma peaks at 500, whispers at 50, stays moderate at 950", () => {
    const { output } = main(["palette", "#ff0000"]);
    const steps = stepsOf(output);
    const chroma = new Map(steps.map((s) => [s.step, s.c]));
    const c50 = chroma.get(50)!;
    const c500 = chroma.get(500)!;
    const c950 = chroma.get(950)!;

    expect(c50).toBeLessThan(c500 * 0.15);
    expect(c950).toBeGreaterThan(c500 * 0.25);
    expect(c950).toBeLessThan(c500);
    for (const s of steps) {
      expect(c500).toBeGreaterThanOrEqual(s.c);
    }
  });
});

describe("--name override", () => {
  test("--name replaces the auto-detected name", () => {
    const { output, exitCode } = main(["palette", "#ff0000", "--name", "brand"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("--color-brand-500:");
    expect(output).not.toContain("--color-red-");
  });

  test("--name values are kebab-cased", () => {
    const { output, exitCode } = main(["palette", "#ff0000", "--name", "My Brand Color!"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("--color-my-brand-color-500:");
  });

  test("without the flag, nearest-name detection is unchanged", () => {
    const { output } = main(["palette", "#ff0000"]);

    expect(output).toContain("--color-red-500:");
    expect(output).not.toContain("--color-brand-");
  });

  test("--name with a missing or unusable value exits non-zero", () => {
    expect(main(["palette", "#ff0000", "--name"]).exitCode).toBe(1);
    expect(main(["palette", "#ff0000", "--name", "###"]).exitCode).toBe(1);
  });

  test("usage documents the shadowing footgun and the --name escape hatch", () => {
    const { output } = main(["palette", "--help"]);

    expect(output).toContain("--name");
    expect(output).toContain("shadow");
  });
});

describe("--step anchor", () => {
  test("places the base color verbatim at the specified step", () => {
    const { output, exitCode } = main(["palette", "#111410", "--step", "700"]);
    expect(exitCode).toBe(0);

    const emitted = stepsOf(output).find((s) => s.step === 700)!;
    const input = toOklch(parse("#111410")!);

    expect(Math.abs(emitted.l - input.l)).toBeLessThan(0.001);
    expect(Math.abs(emitted.c - (input.c ?? 0))).toBeLessThan(0.001);
    expect(Math.abs(emitted.h - (input.h ?? 0))).toBeLessThan(0.001);
  });

  test("hex format round-trips the base color at the specified step", () => {
    const { output, exitCode } = main(["palette", "#111410", "--step", "700", "--format", "hex"]);
    expect(exitCode).toBe(0);
    expect(output).toContain("700: #111410;");
  });

  test("lightness is strictly monotonic across all 11 steps for arbitrary anchors", () => {
    for (const [color, step] of [
      ["#e0f2fe", "50"],
      ["#111410", "700"],
      ["#020617", "950"],
    ] as const) {
      const { output, exitCode } = main(["palette", color, "--step", step]);
      expect(exitCode).toBe(0);

      const steps = stepsOf(output);
      expect(steps.length).toBe(11);
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i]!.l).toBeLessThan(steps[i - 1]!.l);
      }
      expect(new Set(steps.map((s) => `${s.l} ${s.c} ${s.h}`)).size).toBe(11);
      for (const s of steps) {
        expect(displayable({ mode: "oklch", ...s })).toBe(true);
      }
    }
  });

  test("missing, non-integer, or out-of-range step exits non-zero", () => {
    expect(main(["palette", "#ff0000", "--step"]).exitCode).toBe(1);
    expect(main(["palette", "#ff0000", "--step", "foo"]).exitCode).toBe(1);
    expect(main(["palette", "#ff0000", "--step", "550"]).exitCode).toBe(1);
    expect(main(["palette", "#ff0000", "--step", "1000"]).exitCode).toBe(1);
  });

  test("colors outside valid lightness bounds for anchor exit non-zero", () => {
    const light = main(["palette", "#ffffff", "--step", "700"]);
    expect(light.exitCode).toBe(1);
    expect(light.output).toContain("too light");

    const dark = main(["palette", "#000000", "--step", "50"]);
    expect(dark.exitCode).toBe(1);
    expect(dark.output).toContain("too dark");
  });

  test("--step composes with --name, --v3, --format, and --preview", () => {
    const { output, exitCode } = main([
      "palette",
      "#111410",
      "--step",
      "700",
      "--name",
      "brand",
      "--v3",
      "--format",
      "hex",
      "--preview",
    ]);
    expect(exitCode).toBe(0);
    expect(output).toContain("brand:");
    expect(output).toContain('700: "#111410",');
    expect(output).toContain(`${String.fromCharCode(27)}[48;2;`);
  });

  test("usage documents --step", () => {
    const { output } = main(["palette", "--help"]);
    expect(output).toContain("--step");
  });
});

describe("v3 export", () => {
  test("--v3 emits a valid config snippet nesting the palette under theme.extend.colors", () => {
    const { output, exitCode } = main(["palette", "#ff0000", "--v3"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("module.exports = {");
    expect(output).toContain("theme:");
    expect(output).toContain("extend:");
    expect(output).toContain("colors:");
    expect(output).toContain("red:");
    expect(() => new Bun.Transpiler({ loader: "js" }).transformSync(output)).not.toThrow();
  });

  test("the v3 export carries the same oklch values as the v4 output, shades in order", () => {
    const v3 = main(["palette", "#ff0000", "--v3"]).output;
    const v4 = main(["palette", "#ff0000"]).output;

    for (const s of stepsOf(v4)) {
      const f = (n: number) => n.toFixed(3);
      const re = new RegExp(`${s.step}: "oklch\\(${f(s.l)} ${f(s.c)} ${f(s.h)}\\)"`);
      expect(v3).toMatch(re);
    }
  });

  test("--name composes with --v3", () => {
    const { output } = main(["palette", "#ff0000", "--v3", "--name", "brand"]);

    expect(output).toContain("brand:");
    expect(output).not.toContain("red:");
  });

  test("v3 output is pipe-clean", () => {
    const ESC = String.fromCharCode(27);
    expect(main(["palette", "#ff0000", "--v3"]).output).not.toContain(`${ESC}[`);
  });

  test("--json and --ts are rejected as unknown flags", () => {
    expect(main(["palette", "#ff0000", "--json"]).exitCode).toBe(1);
    expect(main(["palette", "#ff0000", "--ts"]).exitCode).toBe(1);
  });
});

describe("--format notation", () => {
  test("--format hex changes values in both output modes", () => {
    const v4 = main(["palette", "#ff0000", "--format", "hex"]).output;

    expect(v4).toMatch(/--color-red-500: #[0-9a-f]{6};/);
    expect(v4).not.toContain("oklch(");

    const v3 = main(["palette", "#ff0000", "--v3", "--format", "hex"]).output;
    expect(v3).toMatch(/500: "#[0-9a-f]{6}",/);
    expect(v3).not.toContain("oklch(");
  });

  test("--format rgb and --format hsl change values likewise", () => {
    const rgb = main(["palette", "#ff0000", "--format", "rgb"]).output;
    expect(rgb).toMatch(/--color-red-500: rgb\(\d+, \d+, \d+\);/);

    const hsl = main(["palette", "#ff0000", "--format", "hsl"]).output;
    expect(hsl).toMatch(/--color-red-500: hsl\([\d.]+, \d+(\.\d+)?%, \d+(\.\d+)?%\);/);
  });

  test("every notation round-trips the 500 step to the Base color", () => {
    const base = parse("#ff0000")!;

    for (const scheme of ["hex", "rgb", "hsl"] as const) {
      const output = main(["palette", "#ff0000", "--format", scheme]).output;
      const m = output.match(/--color-red-500: (.+);/);
      const parsed = parse(m![1]!);
      const distance = differenceEuclidean("rgb")(base, parsed!);
      expect(distance).toBeLessThan(0.02);
    }
  });

  test("--format with a missing or unknown scheme exits non-zero", () => {
    expect(main(["palette", "#ff0000", "--format"]).exitCode).toBe(1);
    const bad = main(["palette", "#ff0000", "--format", "cmyk"]);
    expect(bad.exitCode).toBe(1);
    expect(bad.output).toContain("cmyk");
  });

  test("--format composes with --name and --v3", () => {
    const { output } = main(["palette", "#ff0000", "--v3", "--format", "hex", "--name", "brand"]);

    expect(output).toContain("brand:");
    expect(output).toMatch(/500: "#[0-9a-f]{6}",/);
  });

  test("usage documents --format and its schemes", () => {
    const { output } = main(["palette", "--help"]);

    expect(output).toContain("--format");
    expect(output).toContain("hex");
  });
});

describe("--preview swatch strip", () => {
  test("--preview prepends an ANSI strip; the output below it is byte-identical", () => {
    const withPreview = main(["palette", "#ff0000", "--preview"]).output;
    const without = main(["palette", "#ff0000"]).output;

    expect(withPreview.endsWith(without)).toBe(true);
    const strip = withPreview.slice(0, withPreview.length - without.length);
    expect(strip).toContain(`${String.fromCharCode(27)}[48;2;`);
  });

  test("the strip labels every step in plain text, 50 through 950", () => {
    const withPreview = main(["palette", "#ff0000", "--preview"]).output;
    const without = main(["palette", "#ff0000"]).output;
    const strip = withPreview.slice(0, withPreview.length - without.length);

    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(strip).toContain(`${step}`);
    }
    expect(strip.indexOf("950")).toBeGreaterThan(strip.indexOf("500"));
    expect(strip.indexOf("500")).toBeGreaterThan(strip.indexOf("50"));
  });

  test("without --preview, no output mode contains ANSI escapes", () => {
    const ESC = String.fromCharCode(27);
    const outputs = [
      main(["palette", "#ff0000"]).output,
      main(["palette", "#ff0000", "--v3"]).output,
      main(["palette", "#ff0000", "--format", "hex"]).output,
      main(["palette", "#ff0000", "--v3", "--format", "rgb"]).output,
    ];
    for (const output of outputs) {
      expect(output).not.toContain(`${ESC}[`);
    }
  });

  test("--preview composes with --v3 and --name", () => {
    const withPreview = main(["palette", "#ff0000", "--v3", "--name", "brand", "--preview"]).output;
    const without = main(["palette", "#ff0000", "--v3", "--name", "brand"]).output;

    expect(withPreview.endsWith(without)).toBe(true);
    expect(withPreview).toContain("brand:");
  });

  test("usage documents --preview", () => {
    const { output } = main(["palette", "--help"]);

    expect(output).toContain("--preview");
  });
});

describe("--help", () => {
  test("--help and -h print usage and exit zero", () => {
    for (const flag of ["--help", "-h"]) {
      const root = main([flag]);
      expect(root.exitCode).toBe(0);
      expect(root.output).toContain("Usage: tailwind_tools <command>");

      const palette = main(["palette", flag]);
      expect(palette.exitCode).toBe(0);
      expect(palette.output).toContain("Example: tailwind_tools palette '#ff0000'");
    }
  });

  test("--help wins over other arguments", () => {
    const { output, exitCode } = main(["palette", "#ff0000", "--help"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
    expect(output).not.toContain("--color-");
  });

  test("a missing color still exits non-zero (distinct from --help)", () => {
    expect(main(["palette"]).exitCode).toBe(1);
  });
});

describe("--color flag", () => {
  test("--color prints the same palette as the adjacent form", () => {
    const viaFlag = main(["palette", "--color", "#ff0000", "--step", "700"]);
    const viaSlot = main(["palette", "#ff0000", "--step", "700"]);

    expect(viaFlag.exitCode).toBe(0);
    expect(viaFlag.output).toBe(viaSlot.output);
  });

  test("--color composes with every existing flag", () => {
    const { output, exitCode } = main([
      "palette",
      "--color",
      "#111410",
      "--step",
      "700",
      "--name",
      "brand",
      "--v3",
      "--format",
      "hex",
      "--preview",
    ]);

    expect(exitCode).toBe(0);
    expect(output).toContain('700: "#111410",');
    expect(output).toContain("brand:");
    expect(output).toContain(`${String.fromCharCode(27)}[48;2;`);
  });

  test("--color with a missing or flag-shaped value exits non-zero", () => {
    const missing = main(["palette", "--color"]);
    expect(missing.exitCode).toBe(1);
    expect(missing.output).toContain("--color requires a value");

    expect(main(["palette", "--color", "--step"]).exitCode).toBe(1);

    const bad = main(["palette", "--color", "notacolor"]);
    expect(bad.exitCode).toBe(1);
    expect(bad.output).toContain("notacolor");
  });

  test("--color twice exits non-zero with no winner, even when values match", () => {
    const twice = main(["palette", "--color", "#ff0000", "--color", "#ff0000"]);

    expect(twice.exitCode).toBe(1);
    expect(twice.output).toContain("--color given twice");
    expect(twice.output).not.toContain("--color-");
    expect(main(["palette", "--color", "#ff0000", "--color", "#00ff00"]).exitCode).toBe(1);
  });

  test("a color next to palette and --color both exit non-zero", () => {
    const both = main(["palette", "#000000", "--color", "#ff0000"]);

    expect(both.exitCode).toBe(1);
    expect(both.output).toContain("got a color next to palette and --color");
    expect(both.output).not.toContain("--color-");
  });

  test("no base color at all exits non-zero quoting both forms", () => {
    const none = main(["palette"]);

    expect(none.exitCode).toBe(1);
    expect(none.output).toContain("expected a base color");
    expect(none.output).toContain(`tailwind_tools palette '<color>'`);
    expect(none.output).toContain(`tailwind_tools palette --color '<color>'`);
  });

  test("a color after flags is the missing-base-color error, not a positional", () => {
    const { output, exitCode } = main(["palette", "--step", "700", "#ff0000"]);

    expect(exitCode).toBe(1);
    expect(output).toContain("expected a base color");
    expect(output).not.toContain("--color-");
  });
});

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

  test("root --help and -h print root usage and exit zero", () => {
    for (const flag of ["--help", "-h"]) {
      const { output, exitCode } = main([flag]);
      expect(exitCode).toBe(0);
      expect(output).toContain("Usage: tailwind_tools <command>");
      expect(output).toContain("palette");
      expect(output).not.toContain("Example:");
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
