import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { climbingStairs } from "../exercise.js";

const input = { values: [], scalar: 4 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("climbing-stairs viz (T-VIZEX-CS, T-INT-CS)", () => {
  it("T-VIZEX-CS-01: produces the expected dp trace for n = 4", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toHaveLength(6);
    expect(steps[0]).toEqual({ index: 0, kind: "base", value: 1, dp: [1, null, null, null, null] });
    expect(steps[steps.length - 1]).toEqual({
      index: 4,
      kind: "done",
      value: 5,
      dp: [1, 1, 2, 3, 5],
    });
    expect(result).toBe(5);
  });

  it("T-VIZEX-CS-02: a compute step highlights the two prior cells it sums", () => {
    const { steps } = buildSteps(input);
    expect(
      steps.some(
        (step) =>
          step.kind === "compute" &&
          step.index === 2 &&
          step.leftIndex === 1 &&
          step.rightIndex === 0 &&
          step.value === 2
      )
    ).toBe(true);
  });

  it("T-VIZEX-CS-03: n <= 1 short-circuits to a single trivial step and result 1", () => {
    expect(buildSteps({ values: [], scalar: 1 })).toEqual({
      steps: [{ index: 1, kind: "trivial", value: 1, dp: [1] }],
      result: 1,
    });
    expect(buildSteps({ values: [], scalar: 0 })).toEqual({
      steps: [{ index: 0, kind: "trivial", value: 1, dp: [1] }],
      result: 1,
    });
    expect(buildSteps({ values: [], scalar: -3 }).result).toBe(1);
  });

  it("T-INT-CS: viz result equals the climbingStairs result", () => {
    expect(buildSteps(input).result).toEqual(climbingStairs(4));
    expect(buildSteps({ values: [], scalar: 10 }).result).toEqual(climbingStairs(10));
  });
});

describe("climbing-stairs describeStep (T-DESC-CS)", () => {
  const viz = createViz(input);

  it("T-DESC-CS-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-CS-02: the first step seeds dp[0]", () => {
    expect(viz.describeStep(1)).toEqual({ key: "base", params: { index: 0, value: 1 } });
  });

  it("T-DESC-CS-03: a compute step reports the full sum arithmetic", () => {
    expect(viz.describeStep(3)).toEqual({
      key: "compute",
      params: { index: 2, leftIndex: 1, rightIndex: 0, left: 1, right: 1, value: 2 },
    });
  });

  it("T-DESC-CS-04: the last step reports the final result", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: { value: 5 } });
  });

  it("T-DESC-CS-05: n <= 1 reports a trivial row with its value", () => {
    const trivialViz = createViz({ values: [], scalar: 0 });
    expect(trivialViz.describeStep(1)).toEqual({ key: "trivial", params: { index: 0, value: 1 } });
  });
});

describe("climbing-stairs codeLines (T-CODELINES-CS)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-CS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-CS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-CS-03: the done step highlights the final return line", () => {
    expect(viz.codeLines(viz.totalSteps - 1)).toEqual({ js: [21], pseudo: [11] });
  });
});
