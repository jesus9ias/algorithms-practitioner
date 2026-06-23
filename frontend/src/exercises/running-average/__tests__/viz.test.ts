import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { runningAverage } from "../exercise.js";

const input = { values: [1, 2, 3, 4, 5], target: 3 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("running-average viz (T-VIZEX-RA, T-INT-RA)", () => {
  it("T-VIZEX-RA: produces one step per window", () => {
    const { steps } = buildSteps(input);
    // Windows for [1,2,3,4,5] with w=3: [0..2], [1..3], [2..4].
    expect(steps.map((s) => s.kind)).toEqual(["firstWindow", "slide", "slide"]);
    expect(steps.map((s) => s.avg)).toEqual([2, 3, 4]);
    expect(steps[steps.length - 1]).toMatchObject({ start: 2, end: 4, added: 5, removed: 2 });
  });

  it("T-INT-RA: viz result equals the runningAverage result", () => {
    expect(buildSteps(input).result).toEqual(runningAverage(input.values, input.target));
  });

  it("a window larger than the array produces no steps and an empty result", () => {
    const empty = buildSteps({ values: [1, 2, 3], target: 4 });
    expect(empty.steps).toHaveLength(0);
    expect(empty.result).toEqual([]);
  });
});

describe("running-average describeStep (T-DESC-RA)", () => {
  const viz = createViz(input);

  it("T-DESC-RA: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-RA: first step reports the first window average", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "firstWindow",
      params: { start: 0, end: 2, sum: 6, avg: "2.00" },
    });
  });

  it("T-DESC-RA: a slide step reports the entering and leaving values", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "slide",
      params: { added: 4, removed: 1, sum: 9, avg: "3.00" },
    });
  });
});

describe("running-average codeLines (T-CODELINES-RA)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-RA-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-RA-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
