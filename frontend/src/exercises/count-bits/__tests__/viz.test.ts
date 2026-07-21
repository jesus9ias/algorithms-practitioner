import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { countBits } from "../exercise.js";

const input = { values: [], scalar: 11 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("count-bits viz (T-VIZEX-CB, T-INT-CB)", () => {
  it("T-VIZEX-CB-01: clears bits lowest-position-first, one step per set bit, plus a terminal done step", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toEqual([
      { bitIndex: 0, count: 1, remaining: 10, kind: "clear" },
      { bitIndex: 1, count: 2, remaining: 8, kind: "clear" },
      { bitIndex: 3, count: 3, remaining: 0, kind: "clear" },
      { bitIndex: -1, count: 3, remaining: 0, kind: "done" },
    ]);
    expect(result).toBe(3);
  });

  it("T-VIZEX-CB-02: n <= 0 produces a single empty step and result 0", () => {
    expect(buildSteps({ values: [], scalar: 0 })).toEqual({
      steps: [{ bitIndex: -1, count: 0, remaining: 0, kind: "empty" }],
      result: 0,
    });
    expect(buildSteps({ values: [], scalar: -4 }).result).toBe(0);
  });

  it("T-INT-CB: viz result equals the countBits result", () => {
    expect(buildSteps(input).result).toBe(countBits(11));
    expect(buildSteps({ values: [], scalar: 255 }).result).toBe(countBits(255));
  });
});

describe("count-bits describeStep (T-DESC-CB)", () => {
  const viz = createViz(input);

  it("T-DESC-CB-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-CB-02: the first step clears bit 0", () => {
    expect(viz.describeStep(1)).toEqual({ key: "clear", params: { index: 0, count: 1 } });
  });

  it("T-DESC-CB-03: the last step reports the final count", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({ key: "done", params: { count: 3 } });
  });

  it("T-DESC-CB-04: n <= 0 reports the empty guard", () => {
    const zeroViz = createViz({ values: [], scalar: 0 });
    expect(zeroViz.describeStep(1)).toEqual({ key: "empty" });
  });
});

describe("count-bits codeLines (T-CODELINES-CB)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-CB-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-CB-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-CB-03: a clear step highlights the loop header, AND-clear and count increment", () => {
    expect(viz.codeLines(1)).toEqual({ js: [18, 19, 20], pseudo: [8, 9, 10] });
  });
});
