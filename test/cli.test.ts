import { describe, expect, test } from "bun:test";
import { converter, displayable, parse } from "culori";
import { main } from "@/cli";

const toOklch = converter("oklch");

function stepsOf(output: string): { step: number; l: number; c: number; h: number }[] {
  return [...output.matchAll(/--color-[a-z]+-(\d+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)].map(
    (m) => ({ step: Number(m[1]), l: Number(m[2]), c: Number(m[3]), h: Number(m[4]) }),
  );
}

describe("tailshade CLI seam", () => {
  test("hex base color prints a @theme palette with all 11 steps", () => {
    const { output, exitCode } = main(["#ff0000"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("@theme {");
    expect(output.trim().endsWith("}")).toBe(true);

    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(output).toContain(`--color-red-${step}:`);
    }
  });

  test("the Base color appears verbatim at 500", () => {
    const { output } = main(["#ff0000"]);
    const emitted = stepsOf(output).find((s) => s.step === 500)!;
    const input = toOklch(parse("#ff0000")!);

    expect(Math.abs(emitted.l - input.l)).toBeLessThan(0.001);
    expect(Math.abs(emitted.c - (input.c ?? 0))).toBeLessThan(0.001);
    expect(Math.abs(emitted.h - (input.h ?? 0))).toBeLessThan(0.001);
  });

  test("lightness is strictly monotonic and every step is distinct and in gamut", () => {
    const { output } = main(["#ff0000"]);
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
    const { output } = main(["#ff0000"]);
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
      const { output, exitCode } = main([input]);
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
      const { output, exitCode } = main([]);

      expect(exitCode).toBe(1);
      expect(output).toContain("Usage:");
      expect(output).toContain(`tailshade '#ff0000'`);
    });

    test("unparseable color exits non-zero with the input in the message", () => {
      const { output, exitCode } = main(["notacolor"]);

      expect(exitCode).toBe(1);
      expect(output).toContain("notacolor");
      expect(output).toContain("Usage:");
    });

    test("too-light and too-dark bases exit non-zero with the reason", () => {
      const light = main(["#ffffff"]);
      expect(light.exitCode).toBe(1);
      expect(light.output).toContain("too light");

      const dark = main(["#000000"]);
      expect(dark.exitCode).toBe(1);
      expect(dark.output).toContain("too dark");
    });

    test("unknown flags and extra arguments exit non-zero", () => {
      expect(main(["--foo"]).exitCode).toBe(1);
      expect(main(["#ff0000", "#00ff00"]).exitCode).toBe(1);
    });
  });

  test("extreme bases compress spacing but keep every step distinct", () => {
    for (const base of ["oklch(0.9 0.1 300)", "oklch(0.25 0.1 300)", "oklch(0.05 0.1 300)"]) {
      const { output, exitCode } = main([base]);
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
    const { output, exitCode } = main(["#808080"]);

    expect(exitCode).toBe(0);
    expect(output).toContain("--color-gray-500:");

    const steps = stepsOf(output);
    for (const s of steps) {
      expect(s.c).toBe(0);
      expect(displayable({ mode: "oklch", ...s })).toBe(true);
    }
  });
});
