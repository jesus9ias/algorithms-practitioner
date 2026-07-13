import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { levelOrderTraversal } from "../exercise.js";

const input = { values: [1, 2, 3, 4, 5, 6, 7] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("level-order-traversal viz (T-VIZEX-LOT, T-INT-LOT)", () => {
  it("T-VIZEX-LOT: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.values.length);
  });

  it("T-INT-LOT: viz result equals the levelOrderTraversal result", () => {
    expect(buildSteps(input).result).toEqual(levelOrderTraversal(input.values));
  });

  it("T-INT-LOT-02: viz result groups a ragged tree the same way as levelOrderTraversal", () => {
    const raggedInput = { values: [10, 20, 30, 40, 50] };
    expect(buildSteps(raggedInput).result).toEqual(levelOrderTraversal(raggedInput.values));
  });
});

describe("level-order-traversal describeStep (T-DESC-LOT)", () => {
  const viz = createViz(input);

  it("T-DESC-LOT: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-LOT: first step visits the root at level 0", () => {
    expect(viz.describeStep(1)).toEqual({ key: "visit", params: { value: 1, level: 0 } });
  });

  it("T-DESC-LOT: one descriptor per node, visiting in array-index (BFS) order", () => {
    const expectedLevels = [0, 1, 1, 2, 2, 2, 2];
    const described = input.values.map((value, i) => viz.describeStep(i + 1));
    expect(described).toEqual(
      input.values.map((value, i) => ({ key: "visit", params: { value, level: expectedLevels[i] } }))
    );
  });
});

describe("level-order-traversal codeLines (T-CODELINES-LOT)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-LOT-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-LOT-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
