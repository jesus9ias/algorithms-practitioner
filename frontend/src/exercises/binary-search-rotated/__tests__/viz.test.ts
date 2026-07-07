import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { searchRotated } from "../exercise.js";

const input = { values: [4, 5, 6, 7, 0, 1, 2], target: 0 };
const missInput = { values: [4, 5, 6, 7, 0, 1, 2], target: 3 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("binary-search-rotated viz (T-VIZEX-BSR, T-INT-BSR)", () => {
  it("T-VIZEX-BSR: produces a non-empty trace ending on the found index", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.found).toBe(true);
    expect(last.mid).toBe(4);
  });

  it("T-INT-BSR: viz result equals the searchRotated result", () => {
    expect(buildSteps(input).result).toBe(searchRotated(input.values, input.target));
  });

  it("T-VIZEX-BSR-MISS: adds a terminal notFound step when the target is absent", () => {
    const { steps, result } = buildSteps(missInput);
    expect(result).toBe(-1);
    const last = steps[steps.length - 1];
    expect(last.notFound).toBe(true);
    expect(last.found).toBe(false);
    expect(last.mid).toBe(-1);
  });
});

describe("binary-search-rotated describeStep (T-DESC-BSR)", () => {
  const viz = createViz(input);

  it("T-DESC-BSR: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BSR: first step skips the sorted half that doesn't contain the target", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "skipSortedHalf",
      params: { from: 4, to: 7, target: 0 },
    });
  });

  it("T-DESC-BSR: second step narrows into the sorted half containing the target", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "searchSortedHalf",
      params: { from: 0, to: 1, target: 0 },
    });
  });

  it("T-DESC-BSR: last step reports the found index", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "found",
      params: { mid: 0, index: 4 },
    });
  });

  it("T-DESC-BSR-MISS: last step reports the target was not found", () => {
    const missViz = createViz(missInput);
    expect(missViz.describeStep(missViz.totalSteps - 1)).toEqual({
      key: "notFound",
      params: { target: 3 },
    });
  });
});

describe("binary-search-rotated codeLines (T-CODELINES-BSR)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-BSR-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-BSR-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-BSR-03: the notFound step highlights the final return", () => {
    const missViz = createViz(missInput);
    expect(missViz.codeLines(missViz.totalSteps - 1)).toEqual({
      js: [14, 35],
      pseudo: [5, 22],
    });
  });
});
