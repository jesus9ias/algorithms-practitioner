import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { twoSum } from "../exercise.js";

const input = { values: [2, 7, 11, 15], target: 9 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("two-sum viz (T-VIZEX-2SUM, T-INT-2SUM)", () => {
  it("T-VIZEX-2SUM: produces a non-empty trace ending on a found step", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].kind).toBe("found");
  });

  it("T-VIZEX-2SUM: ends on a done step when no pair sums to the target", () => {
    const { steps } = buildSteps({ values: [1, 2, 3], target: 100 });
    expect(steps[steps.length - 1].kind).toBe("done");
  });

  it("T-INT-2SUM: viz result equals the twoSum result", () => {
    expect(buildSteps(input).result).toEqual(twoSum(input.values, input.target));
  });
});

describe("two-sum describeStep (T-DESC-2SUM)", () => {
  const viz = createViz(input);

  it("T-DESC-2SUM: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-2SUM: the first step checks index 0 for its complement", () => {
    expect(viz.describeStep(1)).toEqual({ key: "check", params: { index: 0, value: 2, complement: 7 } });
  });

  it("T-DESC-2SUM: the last step reports the found pair", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "found",
      params: { matchIndex: 0, index: 1, complement: 2 },
    });
  });
});

describe("two-sum codeLines (T-CODELINES-2SUM)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-2SUM-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-2SUM-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
