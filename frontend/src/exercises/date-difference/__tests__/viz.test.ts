import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { dateDifference } from "../exercise.js";

const RAW = "2024-01-15,2024-03-22";
const input = { values: [], text: RAW };
const FIRST_MS = Date.UTC(2024, 0, 15);
const SECOND_MS = Date.UTC(2024, 2, 22);

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("date-difference viz (T-VIZEX-DD, T-INT-DD)", () => {
  it("T-VIZEX-DD-01: resolves the first date, then the second, then computes the difference", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toEqual([
      { stage: "parseFirst", firstMs: FIRST_MS, secondMs: null, days: null },
      { stage: "parseSecond", firstMs: FIRST_MS, secondMs: SECOND_MS, days: null },
      { stage: "compute", firstMs: FIRST_MS, secondMs: SECOND_MS, days: 67 },
    ]);
    expect(result).toBe(67);
  });

  it("T-VIZEX-DD-02: order-independent — swapping the dates yields the same result", () => {
    expect(buildSteps({ values: [], text: "2024-03-22,2024-01-15" }).result).toBe(67);
  });

  it("T-INT-DD: viz result equals the dateDifference result", () => {
    expect(buildSteps(input).result).toBe(dateDifference(RAW));
  });
});

describe("date-difference describeStep (T-DESC-DD)", () => {
  const viz = createViz(input);

  it("T-DESC-DD-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-DD-02: the first step reports the first date", () => {
    expect(viz.describeStep(1)).toEqual({ key: "parseFirst", params: { date: "2024-01-15" } });
  });

  it("T-DESC-DD-03: the second step reports the second date", () => {
    expect(viz.describeStep(2)).toEqual({ key: "parseSecond", params: { date: "2024-03-22" } });
  });

  it("T-DESC-DD-04: the last step reports the final day count", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: { days: 67 } });
  });
});

describe("date-difference codeLines (T-CODELINES-DD)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-DD-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-DD-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-DD-03: the compute step highlights the final return", () => {
    expect(viz.codeLines(3)).toEqual({ js: [16], pseudo: [5] });
  });
});
