import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { mergeSort } from "../exercise.js";

const input = { values: [5, 2, 8, 1, 9, 3] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("mergeSort viz (T-VIZEX-MSORT, T-INT-MSORT)", () => {
  it("T-VIZEX-MSORT: produces a non-empty trace ending on the fully sorted array", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("done");
    expect([...last.array]).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it("T-INT-MSORT: viz result equals the mergeSort result", () => {
    expect(buildSteps(input).result).toEqual(mergeSort(input.values));
  });
});

describe("mergeSort describeStep (T-DESC-MSORT)", () => {
  const viz = createViz(input);

  it("T-DESC-MSORT: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-MSORT: step 1 describes a takeLeft or takeRight with the correct keys", () => {
    const desc = viz.describeStep(1);
    expect(desc).not.toBeNull();
    expect(["takeLeft", "takeRight", "flushLeft", "flushRight"]).toContain(desc!.key);
  });

  it("T-DESC-MSORT: the last step reports the array fully sorted", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: {} });
  });
});

describe("mergeSort codeLines (T-CODELINES-MSORT)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-MSORT-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-MSORT-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
