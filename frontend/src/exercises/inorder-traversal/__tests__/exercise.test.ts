import { describe, it, expect } from "vitest";

import { inorderTraversal } from "../exercise.js";

/**
 * T-ALG-ITRV-* — the single exported function:
 * inorderTraversal(values) => values in in-order (left, node, right) order.
 */
describe("inorderTraversal (T-ALG-ITRV)", () => {
  it("T-ALG-ITRV-01: walks a perfect 7-node tree in-order", () => {
    expect(inorderTraversal([1, 2, 3, 4, 5, 6, 7])).toEqual([4, 2, 5, 1, 6, 3, 7]);
  });

  it("T-ALG-ITRV-02: handles a single value", () => {
    expect(inorderTraversal([42])).toEqual([42]);
  });

  it("T-ALG-ITRV-03: handles empty input", () => {
    expect(inorderTraversal([])).toEqual([]);
  });

  it("T-ALG-ITRV-04: walks a ragged (non-perfect) tree in-order", () => {
    expect(inorderTraversal([10, 20, 30, 40, 50])).toEqual([40, 20, 50, 10, 30]);
  });
});
