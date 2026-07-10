import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { inorderTraversal } from "../exercise.js";

const input = { values: [1, 2, 3, 4, 5, 6, 7] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("inorder-traversal viz (T-VIZEX-ITRV, T-INT-ITRV)", () => {
  it("T-VIZEX-ITRV: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.values.length);
  });

  it("T-INT-ITRV: viz result equals the inorderTraversal result", () => {
    expect(buildSteps(input).result).toEqual(inorderTraversal(input.values));
  });
});

describe("inorder-traversal describeStep (T-DESC-ITRV)", () => {
  const viz = createViz(input);
  const inorder = inorderTraversal(input.values);

  it("T-DESC-ITRV: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-ITRV: first step visits the first in-order value", () => {
    expect(viz.describeStep(1)).toEqual({ key: "visit", params: { value: 4 } });
  });

  it("T-DESC-ITRV: one descriptor per node, visiting in in-order sequence", () => {
    const described = inorder.map((_, i) => viz.describeStep(i + 1));
    expect(described).toEqual(
      inorder.map((value) => ({ key: "visit", params: { value } }))
    );
  });
});

describe("inorder-traversal codeLines (T-CODELINES-ITRV)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-ITRV-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-ITRV-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
