import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { coinChange } from "../exercise.js";

const input = { values: [1, 2, 5], target: 5 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("coin-change viz (T-VIZEX-CC, T-INT-CC)", () => {
  it("T-VIZEX-CC-01: produces the expected dp trace for coins [1, 2, 5], amount 5", () => {
    const { steps, result } = buildSteps(input);
    expect(steps).toHaveLength(12);
    expect(steps[0]).toEqual({
      kind: "init",
      index: 0,
      coin: null,
      candidate: null,
      before: null,
      after: 0,
      dp: [0, null, null, null, null, null],
    });
    expect(steps[steps.length - 1]).toEqual({
      kind: "done",
      index: 5,
      coin: null,
      candidate: null,
      before: 1,
      after: 1,
      dp: [0, 1, 1, 2, 2, 1],
    });
    expect(result).toBe(1);
  });

  it("T-VIZEX-CC-02: a coin that improves dp[i] is an update step", () => {
    const { steps } = buildSteps(input);
    expect(steps[1]).toEqual({
      kind: "update",
      index: 1,
      coin: 1,
      candidate: 1,
      before: null,
      after: 1,
      dp: [0, 1, null, null, null, null],
    });
  });

  it("T-VIZEX-CC-03: a coin that does not improve dp[i] is a noChange step", () => {
    const { steps } = buildSteps(input);
    const step = steps.find((s) => s.kind === "noChange" && s.index === 3 && s.coin === 2);
    expect(step).toEqual({
      kind: "noChange",
      index: 3,
      coin: 2,
      candidate: 2,
      before: 2,
      after: 2,
      dp: [0, 1, 1, 2, null, null],
    });
  });

  it("T-VIZEX-CC-04: amount 0 short-circuits to init + done, result 0", () => {
    const { steps, result } = buildSteps({ values: [1, 2, 5], target: 0 });
    expect(steps).toHaveLength(2);
    expect(steps[0].kind).toBe("init");
    expect(steps[1]).toEqual({ kind: "done", index: 0, coin: null, candidate: null, before: 0, after: 0, dp: [0] });
    expect(result).toBe(0);
  });

  it("T-VIZEX-CC-05: an unreachable amount reports result -1", () => {
    const { result } = buildSteps({ values: [2], target: 3 });
    expect(result).toBe(-1);
  });

  it("T-INT-CC: viz result equals the coinChange result", () => {
    expect(buildSteps(input).result).toEqual(coinChange(input.values, input.target));
    expect(buildSteps({ values: [1, 2, 5], target: 11 }).result).toEqual(coinChange([1, 2, 5], 11));
  });
});

describe("coin-change describeStep (T-DESC-CC)", () => {
  const viz = createViz(input);

  it("T-DESC-CC-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-CC-02: the first step reports the base case", () => {
    expect(viz.describeStep(1)).toEqual({ key: "init", params: { value: 0 } });
  });

  it("T-DESC-CC-03: an update step reports the full candidate arithmetic", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "update",
      params: { index: 1, coin: 1, subIndex: 0, candidate: 1, before: "∞", after: 1 },
    });
  });

  it("T-DESC-CC-04: a noChange step reports why dp[i] stayed the same", () => {
    expect(viz.describeStep(6)).toEqual({
      key: "noChange",
      params: { index: 3, coin: 2, subIndex: 1, candidate: 2, before: 2 },
    });
  });

  it("T-DESC-CC-05: the last step reports the found result", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "doneFound",
      params: { amount: 5, result: 1 },
    });
  });

  it("T-DESC-CC-06: an impossible amount reports doneImpossible", () => {
    const impossibleViz = createViz({ values: [2], target: 3 });
    expect(impossibleViz.describeStep(impossibleViz.totalSteps - 1)).toEqual({
      key: "doneImpossible",
      params: { amount: 3 },
    });
  });
});

describe("coin-change codeLines (T-CODELINES-CC)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-CC-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-CC-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });

  it("T-CODELINES-CC-03: the done step highlights the final lookup lines", () => {
    expect(viz.codeLines(viz.totalSteps - 1)).toEqual({ js: [27], pseudo: [13, 14, 15] });
  });
});
