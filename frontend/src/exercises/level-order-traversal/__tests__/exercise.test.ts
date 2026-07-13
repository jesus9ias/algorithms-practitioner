import { describe, it, expect } from "vitest";

import { levelOrderTraversal } from "../exercise.js";

/**
 * T-ALG-LOT-* — the single exported function:
 * levelOrderTraversal(values) => node values grouped by depth level (BFS).
 */
describe("levelOrderTraversal (T-ALG-LOT)", () => {
  it("T-ALG-LOT-01: walks a perfect 7-node tree level by level", () => {
    expect(levelOrderTraversal([1, 2, 3, 4, 5, 6, 7])).toEqual([[1], [2, 3], [4, 5, 6, 7]]);
  });

  it("T-ALG-LOT-02: handles a single value", () => {
    expect(levelOrderTraversal([42])).toEqual([[42]]);
  });

  it("T-ALG-LOT-03: handles empty input", () => {
    expect(levelOrderTraversal([])).toEqual([]);
  });

  it("T-ALG-LOT-04: walks a ragged (non-perfect) tree level by level", () => {
    expect(levelOrderTraversal([10, 20, 30, 40, 50])).toEqual([[10], [20, 30], [40, 50]]);
  });
});
