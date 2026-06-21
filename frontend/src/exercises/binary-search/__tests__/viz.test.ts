import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { binarySearch } from "../exercise.js";

const input = { values: [1, 3, 5, 7, 9], target: 7 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("binary-search viz (T-VIZEX-BS, T-INT-BS)", () => {
  it("T-VIZEX-BS: produces a non-empty trace ending on the found index", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.found).toBe(true);
    expect(last.mid).toBe(3);
  });

  it("T-INT-BS: viz result equals the binarySearch result", () => {
    expect(buildSteps(input).result).toBe(binarySearch(input.values, input.target));
  });
});

describe("binary-search describeStep (T-DESC-BS)", () => {
  const viz = createViz(input);

  it("T-DESC-BS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BS: first step compares the middle value to the target", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "compareGreater",
      params: { mid: 5, target: 7 },
    });
  });

  it("T-DESC-BS: last step reports the found index", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "found",
      params: { mid: 7, index: 3 },
    });
  });
});

describe("binary-search codeLines (T-CODELINES-BS)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-BS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-BS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
