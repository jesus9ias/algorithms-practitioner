import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { quickSort } from "../exercise.js";

const input = { values: [5, 2, 8, 1, 9, 3, 7] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("quicksort viz (T-VIZEX-QS, T-INT-QS)", () => {
  it("T-VIZEX-QS: produces a non-empty trace ending on the fully sorted array", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("done");
    expect([...last.array]).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it("T-INT-QS: viz result equals the quickSort result", () => {
    expect(buildSteps(input).result).toEqual(quickSort(input.values));
  });
});

describe("quicksort describeStep (T-DESC-QS)", () => {
  const viz = createViz(input);

  it("T-DESC-QS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-QS: the first algorithm step selects a pivot for the full range", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "pivot",
      params: { pivot: 7, lo: 0, hi: 6 },
    });
  });

  it("T-DESC-QS: the last step reports the array fully sorted", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: {} });
  });
});

describe("quicksort codeLines (T-CODELINES-QS)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-QS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-QS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
