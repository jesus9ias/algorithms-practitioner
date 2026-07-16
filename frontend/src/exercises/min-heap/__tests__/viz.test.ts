import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { buildMinHeap } from "../exercise.js";

const input = { values: [9, 4, 7, 1, 8, 5, 2, 3] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("min-heap viz (T-VIZEX-MH, T-INT-MH)", () => {
  it("T-VIZEX-MH: produces a non-empty trace ending on a fully settled heap", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("done");
    expect([...last.array]).toEqual([1, 3, 2, 4, 8, 5, 7, 9]);
  });

  it("T-INT-MH: viz result equals the buildMinHeap result", () => {
    expect(buildSteps(input).result).toEqual(buildMinHeap(input.values));
  });

  it("T-VIZEX-MH-02: an empty input produces only the terminal done step", () => {
    const { steps, result } = buildSteps({ values: [] });
    expect(steps).toEqual([{ array: [], roles: [], kind: "done", params: {} }]);
    expect(result).toEqual([]);
  });
});

describe("min-heap describeStep (T-DESC-MH)", () => {
  const viz = createViz(input);

  it("T-DESC-MH: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-MH: the first algorithm step begins sifting the last parent node", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "start",
      params: { index: 3, value: 1 },
    });
  });

  it("T-DESC-MH: the last step reports the heap fully built", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: {} });
  });
});

describe("min-heap codeLines (T-CODELINES-MH)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-MH-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-MH-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
