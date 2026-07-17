import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { topKElements } from "../exercise.js";

const input = { values: [3, 10, 12, 2, 8, 15, 1, 7], target: 3 };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("top-k-elements viz (T-VIZEX-TKE, T-INT-TKE)", () => {
  it("T-VIZEX-TKE: produces one step per input element plus a terminal done step", () => {
    const { steps } = buildSteps(input);
    expect(steps).toHaveLength(input.values.length + 1);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("done");
    expect([...last.heap]).toEqual([10, 15, 12]);
  });

  it("T-VIZEX-TKE-02: inserts while under k, then evicts the smallest on overflow", () => {
    const { steps } = buildSteps(input);
    expect(steps.slice(0, 3).map((s) => s.kind)).toEqual(["insert", "insert", "insert"]);
    expect(steps.slice(3, 8).map((s) => s.kind)).toEqual([
      "evict",
      "evict",
      "evict",
      "evict",
      "evict",
    ]);
    expect(steps[3].evicted).toBe(2);
    expect(steps[7].evicted).toBe(7);
  });

  it("T-INT-TKE: viz result equals the topKElements result", () => {
    expect(buildSteps(input).result).toEqual(topKElements([...input.values], input.target));
  });

  it("T-VIZEX-TKE-03: an empty input produces only the terminal done step", () => {
    const { steps, result } = buildSteps({ values: [], target: 3 });
    expect(steps).toEqual([{ kind: "done", params: { k: 3, count: 0 }, index: -1, heap: [], evicted: null }]);
    expect(result).toEqual([]);
  });

  it("T-VIZEX-TKE-04: k <= 0 evicts every push, leaving an empty heap and result", () => {
    const { steps, result } = buildSteps({ values: [1, 2, 3], target: 0 });
    expect(steps.every((s) => s.kind === "done" || s.kind === "evict")).toBe(true);
    expect(steps[steps.length - 1].heap).toEqual([]);
    expect(result).toEqual([]);
  });
});

describe("top-k-elements describeStep (T-DESC-TKE)", () => {
  const viz = createViz(input);

  it("T-DESC-TKE: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-TKE: the first step inserts the first value", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "insert",
      params: { value: 3, k: 3, size: 1 },
    });
  });

  it("T-DESC-TKE: the fourth step evicts on overflow", () => {
    expect(viz.describeStep(4)).toEqual({
      key: "evict",
      params: { value: 2, evicted: 2, k: 3, size: 3 },
    });
  });

  it("T-DESC-TKE: the last step reports the final heap size", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "done",
      params: { k: 3, count: 3 },
    });
  });
});

describe("top-k-elements codeLines (T-CODELINES-TKE)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-TKE-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-TKE-02: the terminal done step highlights nothing", () => {
    expect(viz.codeLines(viz.totalSteps - 1)).toBeNull();
  });

  it("T-CODELINES-TKE-03: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
