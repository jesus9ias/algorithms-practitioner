import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { spiralOrder } from "../exercise.js";

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const input = { values: [], matrix };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("matrix-spiral viz (T-VIZEX-MS, T-INT-MS)", () => {
  it("T-VIZEX-MS: emits one step per matrix cell", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(9);
    expect(steps[0]).toMatchObject({ row: 0, col: 0, value: 1, segment: "top" });
  });

  it("T-VIZEX-MS: empty matrix produces no steps", () => {
    expect(buildSteps({ values: [], matrix: [] }).steps).toEqual([]);
  });

  it("T-INT-MS: viz result equals the spiralOrder result", () => {
    expect(buildSteps(input).result).toEqual(spiralOrder(matrix));
  });
});

describe("matrix-spiral describeStep (T-DESC-MS)", () => {
  const viz = createViz(input);

  it("T-DESC-MS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-MS: first step appends the top-left cell", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "visit",
      params: { value: 1, row: 0, col: 0, position: 1 },
    });
  });

  it("T-DESC-MS: last step appends the centre cell", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "visit",
      params: { value: 5, row: 1, col: 1, position: 9 },
    });
  });
});

describe("matrix-spiral codeLines (T-CODELINES-MS)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-MS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-MS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
