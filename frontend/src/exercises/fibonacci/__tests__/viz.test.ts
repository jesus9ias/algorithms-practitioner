import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { fibonacci } from "../exercise.js";

const input = { values: [], scalar: 4 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("fibonacci viz (T-VIZEX-FIB, T-INT-FIB)", () => {
  it("T-VIZEX-FIB-01: produces the expected call trace for n = 4", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toHaveLength(14);
    expect(steps[0]).toEqual({ index: 4, kind: "call", value: null, memo: [null, null, null, null, null] });
    expect(steps[steps.length - 1]).toEqual({
      index: 4,
      kind: "compute",
      value: 3,
      memo: [0, 1, 1, 2, 3],
      leftIndex: 3,
      rightIndex: 2,
      left: 2,
      right: 1,
    });
    expect(result).toBe(3);
  });

  it("T-VIZEX-FIB-02: reuses a memoized sub-problem via a cacheHit step", () => {
    const { steps } = buildSteps(input);
    expect(steps.some((step) => step.kind === "cacheHit" && step.index === 2 && step.value === 1)).toBe(true);
  });

  it("T-VIZEX-FIB-03: n <= 0 short-circuits to a single step and result 0", () => {
    expect(buildSteps({ values: [], scalar: 0 })).toEqual({
      steps: [{ index: 0, kind: "shortCircuit", value: 0, memo: [0] }],
      result: 0,
    });
    expect(buildSteps({ values: [], scalar: -3 }).result).toBe(0);
  });

  it("T-INT-FIB: viz result equals the fibonacci result", () => {
    expect(buildSteps(input).result).toEqual(fibonacci(4));
    expect(buildSteps({ values: [], scalar: 10 }).result).toEqual(fibonacci(10));
  });
});

describe("fibonacci describeStep (T-DESC-FIB)", () => {
  const viz = createViz(input);

  it("T-DESC-FIB-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-FIB-02: the first step calls fib(4)", () => {
    expect(viz.describeStep(1)).toEqual({ key: "call", params: { index: 4 } });
  });

  it("T-DESC-FIB-03: a base-case step reports its value", () => {
    expect(viz.describeStep(5)).toEqual({ key: "base", params: { index: 1, value: 1 } });
  });

  it("T-DESC-FIB-04: the last step reports the full compute arithmetic", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "compute",
      params: { index: 4, leftIndex: 3, rightIndex: 2, left: 2, right: 1, value: 3 },
    });
  });

  it("T-DESC-FIB-05: n <= 0 reports a shortCircuit row with no params", () => {
    const zeroViz = createViz({ values: [], scalar: 0 });
    expect(zeroViz.describeStep(1)).toEqual({ key: "shortCircuit" });
  });
});

describe("fibonacci codeLines (T-CODELINES-FIB)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-FIB-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-FIB-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-FIB-03: a compute step highlights the recursive sum, memo write and return", () => {
    expect(viz.codeLines(viz.totalSteps - 1)).toEqual({ js: [17, 18, 19], pseudo: [11, 12, 13] });
  });
});
