import { describe, it, expect } from "vitest";

import { twoSum } from "../exercise.js";

/**
 * T-ALG-2SUM-* — the single exported function:
 * twoSum(arr, target) => the two indices whose values add up to target.
 */
describe("twoSum (T-ALG-2SUM)", () => {
  it("T-ALG-2SUM-01: returns the indices of the pair that sums to the target", () => {
    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
  });

  it("T-ALG-2SUM-02: finds a pair that is not adjacent", () => {
    expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
  });

  it("T-ALG-2SUM-03: supports duplicate values as the pair", () => {
    expect(twoSum([3, 3], 6)).toEqual([0, 1]);
  });

  it("T-ALG-2SUM-04: supports negative numbers", () => {
    expect(twoSum([-3, 4, 3, 90], 0)).toEqual([0, 2]);
  });

  it("T-ALG-2SUM-05: returns an empty array when no pair sums to the target", () => {
    expect(twoSum([1, 2, 3], 100)).toEqual([]);
  });

  it("T-ALG-2SUM-06: returns an empty array for empty input", () => {
    expect(twoSum([], 5)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [2, 7, 11, 15];
    twoSum(input, 9);
    expect(input).toEqual([2, 7, 11, 15]);
  });
});
