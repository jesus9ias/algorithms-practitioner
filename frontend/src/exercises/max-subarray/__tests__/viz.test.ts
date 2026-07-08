import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { maxSubArray } from "../exercise.js";

const input = { values: [1, -2, 3, 4, -5] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("max-subarray viz (T-VIZEX-MSA, T-INT-MSA)", () => {
  it("T-VIZEX-MSA: produces one step per element plus a terminal done step", () => {
    const { steps } = buildSteps(input);
    expect(steps.map((s) => s.kind)).toEqual(["init", "extend", "reset", "extend", "extend", "done"]);
    expect(steps[steps.length - 1]).toMatchObject({ maxSum: 7, maxStart: 2, maxEnd: 3 });
  });

  it("T-INT-MSA: viz result equals the maxSubArray result", () => {
    expect(buildSteps(input).result).toEqual(maxSubArray([...input.values]));
  });

  it("an empty array produces a single 'empty' step and a result of 0", () => {
    const empty = buildSteps({ values: [] });
    expect(empty.steps.map((s) => s.kind)).toEqual(["empty"]);
    expect(empty.result).toBe(0);
  });
});

describe("max-subarray describeStep (T-DESC-MSA)", () => {
  const viz = createViz(input);

  it("T-DESC-MSA: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-MSA: the first step reports the seeded currentSum/maxSum", () => {
    expect(viz.describeStep(1)).toEqual({ key: "init", params: { value: 1 } });
  });

  it("T-DESC-MSA: an extend step reports the running sum", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "extend",
      params: { index: 1, value: -2, sum: -1 },
    });
  });

  it("T-DESC-MSA: a reset step that raises the best sum reports resetNewMax", () => {
    expect(viz.describeStep(3)).toEqual({
      key: "resetNewMax",
      params: { index: 2, value: 3, sum: 3 },
    });
  });

  it("T-DESC-MSA: an extend step that raises the best sum reports extendNewMax", () => {
    expect(viz.describeStep(4)).toEqual({
      key: "extendNewMax",
      params: { index: 3, value: 4, sum: 7 },
    });
  });

  it("T-DESC-MSA: the terminal step reports the best sum and its range", () => {
    expect(viz.describeStep(6)).toEqual({
      key: "done",
      params: { value: 7, start: 2, end: 3 },
    });
  });
});

describe("max-subarray codeLines (T-CODELINES-MSA)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-MSA-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-MSA-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
