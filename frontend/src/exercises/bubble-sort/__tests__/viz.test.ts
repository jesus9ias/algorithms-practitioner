import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { bubbleSort } from "../exercise.js";

const input = { values: [5, 3, 1, 4, 2] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("bubbleSort viz (T-VIZEX-BSORT, T-INT-BSORT)", () => {
  it("T-VIZEX-BSORT: produces a non-empty trace ending on the fully sorted array", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("done");
    expect([...last.array]).toEqual([1, 2, 3, 4, 5]);
  });

  it("T-INT-BSORT: viz result equals the bubbleSort result", () => {
    expect(buildSteps(input).result).toEqual(bubbleSort(input.values));
  });
});

describe("bubbleSort describeStep (T-DESC-BSORT)", () => {
  const viz = createViz(input);

  it("T-DESC-BSORT: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BSORT: the first algorithm step swaps the first adjacent pair", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "swap",
      params: { left: 5, right: 3 },
    });
  });

  it("T-DESC-BSORT: the last step reports the array fully sorted", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: {} });
  });
});

describe("bubbleSort codeLines (T-CODELINES-BSORT)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-BSORT-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-BSORT-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
