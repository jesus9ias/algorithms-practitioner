import { describe, it, expect } from "vitest";

import { binarySearchTreeInorder } from "../exercise.js";

/**
 * T-ALG-BST-* — the single exported function:
 * binarySearchTreeInorder(values) => values in ascending order.
 */
describe("binarySearchTreeInorder (T-ALG-BST)", () => {
  it("T-ALG-BST-01: returns sorted values via in-order traversal", () => {
    expect(binarySearchTreeInorder([5, 3, 7, 1, 4])).toEqual([1, 3, 4, 5, 7]);
  });

  it("T-ALG-BST-02: ignores duplicate values", () => {
    expect(binarySearchTreeInorder([5, 3, 3, 5])).toEqual([3, 5]);
  });

  it("T-ALG-BST-03: handles a single value", () => {
    expect(binarySearchTreeInorder([42])).toEqual([42]);
  });

  it("T-ALG-BST-04: handles empty input", () => {
    expect(binarySearchTreeInorder([])).toEqual([]);
  });
});
