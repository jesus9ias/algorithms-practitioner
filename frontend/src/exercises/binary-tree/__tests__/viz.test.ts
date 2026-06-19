import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { binarySearchTreeInorder } from "../exercise.js";

const input = { values: [5, 3, 7, 1, 4] };

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
