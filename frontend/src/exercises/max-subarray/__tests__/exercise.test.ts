import { describe, it, expect } from "vitest";

import { maxSubArray } from "../exercise.js";

/**
 * T-ALG-MSA-* — the single exported function:
 * maxSubArray(arr) => number, the largest sum of any contiguous subarray.
 */
describe("maxSubArray (T-ALG-MSA)", () => {
  it("T-ALG-MSA-01: finds the max sum across a mix of positive and negative values", () => {
    expect(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
  });

  it("T-ALG-MSA-02: an all-negative array returns its largest single element", () => {
    expect(maxSubArray([-3, -1, -2])).toBe(-1);
  });

  it("T-ALG-MSA-03: an all-positive array sums the whole array", () => {
    expect(maxSubArray([1, 2, 3, 4])).toBe(10);
  });

  it("T-ALG-MSA-04: a single-element array returns that element", () => {
    expect(maxSubArray([5])).toBe(5);
  });

  it("T-ALG-MSA-05: an empty array returns 0", () => {
    expect(maxSubArray([])).toBe(0);
  });

  it("T-ALG-MSA-06: restarts the running sum after a large negative dip", () => {
    expect(maxSubArray([5, 4, -1, 7, 8])).toBe(23);
  });
});
