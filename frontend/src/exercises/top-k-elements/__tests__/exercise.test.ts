import { describe, it, expect } from "vitest";

import { topKElements } from "../exercise.js";

/**
 * T-ALG-TKE-* — the single exported function:
 * topKElements(arr, k) => the k largest values, largest first.
 */
describe("topKElements (T-ALG-TKE)", () => {
  it("T-ALG-TKE-01: returns the k largest values, largest first", () => {
    expect(topKElements([3, 10, 12, 2, 8, 15, 1, 7], 3)).toEqual([15, 12, 10]);
  });

  it("T-ALG-TKE-02: returns an empty array for empty input", () => {
    expect(topKElements([], 3)).toEqual([]);
  });

  it("T-ALG-TKE-03: k <= 0 returns an empty array", () => {
    expect(topKElements([1, 2, 3], 0)).toEqual([]);
    expect(topKElements([1, 2, 3], -2)).toEqual([]);
  });

  it("T-ALG-TKE-04: k greater than the array length returns every value sorted descending", () => {
    expect(topKElements([4, 2, 9], 10)).toEqual([9, 4, 2]);
  });

  it("T-ALG-TKE-05: handles duplicate values", () => {
    expect(topKElements([5, 5, 5, 5], 2)).toEqual([5, 5]);
  });

  it("T-ALG-TKE-06: a single element with k = 1", () => {
    expect(topKElements([7], 1)).toEqual([7]);
  });

  it("T-ALG-TKE-07: handles negative values", () => {
    expect(topKElements([-1, -5, 3, 0, -2], 2)).toEqual([3, 0]);
  });

  it("T-ALG-TKE-08: k = 1 returns only the maximum", () => {
    expect(topKElements([4, 1, 9, 2], 1)).toEqual([9]);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    topKElements(input, 2);
    expect(input).toEqual([3, 1, 2]);
  });
});
