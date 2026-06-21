import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { binarySearchTreeInorder } from "../exercise.js";

const input = { values: [5, 3, 7, 1, 4] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("binary-tree viz (T-VIZEX-BST, T-INT-BST)", () => {
  it("T-VIZEX-BST: produces one step per (distinct) node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.values.length);
  });

  it("T-INT-BST: viz result equals the binarySearchTreeInorder result", () => {
    expect(buildSteps(input).result).toEqual(binarySearchTreeInorder(input.values));
  });
});

describe("binary-tree describeStep (T-DESC-BST)", () => {
  const viz = createViz(input);
  const inorder = binarySearchTreeInorder(input.values);

  it("T-DESC-BST: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BST: first step visits the smallest value", () => {
    expect(viz.describeStep(1)).toEqual({ key: "visit", params: { value: 1 } });
  });

  it("T-DESC-BST: one descriptor per node, visiting in ascending order", () => {
    const described = inorder.map((_, i) => viz.describeStep(i + 1));
    expect(described).toEqual(
      inorder.map((value) => ({ key: "visit", params: { value } }))
    );
  });
});

describe("binary-tree codeLines (T-CODELINES-BST)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-BST-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-BST-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
