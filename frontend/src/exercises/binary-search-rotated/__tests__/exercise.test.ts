import { describe, it, expect } from "vitest";

import { searchRotated } from "../exercise.js";

/**
 * T-ALG-BSR-* — the single exported function: searchRotated(arr, target) => index.
 */
describe("searchRotated (T-ALG-BSR)", () => {
  it("T-ALG-BSR-01: finds a target in the right (unrotated) half", () => {
    expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 5)).toBe(1);
  });

  it("T-ALG-BSR-02: finds a target in the left (rotated) half", () => {
    expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)).toBe(4);
  });

  it("T-ALG-BSR-03: returns -1 for a missing target", () => {
    expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)).toBe(-1);
  });

  it("T-ALG-BSR-04: works on a single-element array", () => {
    expect(searchRotated([5], 5)).toBe(0);
    expect(searchRotated([5], 1)).toBe(-1);
  });

  it("works on an unrotated (already-sorted) array", () => {
    expect(searchRotated([1, 3, 5, 7, 9], 9)).toBe(4);
  });

  it("finds the pivot value itself", () => {
    expect(searchRotated([6, 7, 0, 1, 2, 4, 5], 0)).toBe(2);
  });
});
