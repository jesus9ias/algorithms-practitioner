import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { addDays } from "../exercise.js";

const RAW = "2024-02-25,10";
const input = { values: [], text: RAW };
const START_MS = Date.UTC(2024, 1, 25);
const SHIFTED_MS = Date.UTC(2024, 2, 6);

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("add-days viz (T-VIZEX-AD, T-INT-AD)", () => {
  it("T-VIZEX-AD-01: parses the start date, then shifts, then formats the result", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toEqual([
      { stage: "parse", startMs: START_MS, offsetDays: null, shiftedMs: null, resultDate: null },
      { stage: "shift", startMs: START_MS, offsetDays: 10, shiftedMs: SHIFTED_MS, resultDate: null },
      { stage: "format", startMs: START_MS, offsetDays: 10, shiftedMs: SHIFTED_MS, resultDate: "2024-03-06" },
    ]);
    expect(result).toBe("2024-03-06");
  });

  it("T-VIZEX-AD-02: a negative offset shifts backward", () => {
    expect(buildSteps({ values: [], text: "2024-01-03,-5" }).result).toBe("2023-12-29");
  });

  it("T-INT-AD: viz result equals the addDays result", () => {
    expect(buildSteps(input).result).toBe(addDays(RAW));
  });
});

describe("add-days describeStep (T-DESC-AD)", () => {
  const viz = createViz(input);

  it("T-DESC-AD-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-AD-02: the first step reports the start date", () => {
    expect(viz.describeStep(1)).toEqual({ key: "parse", params: { date: "2024-02-25" } });
  });

  it("T-DESC-AD-03: the second step reports the signed offset", () => {
    expect(viz.describeStep(2)).toEqual({ key: "shift", params: { offset: "+10" } });
  });

  it("T-DESC-AD-04: the last step reports the resulting date", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: { date: "2024-03-06" } });
  });
});

describe("add-days codeLines (T-CODELINES-AD)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-AD-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-AD-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-AD-03: the format step highlights the final return and helper", () => {
    expect(viz.codeLines(3)).toEqual({ js: [18, 35, 36, 37, 38, 39], pseudo: [6, 13, 14] });
  });
});
