import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { topKFrequent } from "../exercise.js";

const input = { values: [1, 1, 1, 2, 2, 3], target: 2 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("top-k-frequent viz (T-VIZEX-TKF, T-INT-TKF)", () => {
  it("T-VIZEX-TKF: produces a non-empty trace ending on a done step", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].kind).toBe("done");
  });

  it("T-INT-TKF: viz result equals the topKFrequent result", () => {
    expect(buildSteps(input).result).toEqual(topKFrequent(input.values, input.target));
  });
});

describe("top-k-frequent describeStep (T-DESC-TKF)", () => {
  const viz = createViz(input);

  it("T-DESC-TKF: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-TKF: the first step counts the first element", () => {
    expect(viz.describeStep(1)).toEqual({ key: "count", params: { value: 1, count: 1 } });
  });

  it("T-DESC-TKF: the last step reports completion with the collected count", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: { count: 2 } });
  });
});

describe("top-k-frequent codeLines (T-CODELINES-TKF)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-TKF-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-TKF-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
