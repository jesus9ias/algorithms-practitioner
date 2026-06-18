import { describe, it, expect } from "vitest";

import { binarySearch } from "../exercise.js";

/**
 * T-ALG-BS-* — the single exported function: binarySearch(arr, target) => index.
 */
describe("binarySearch (T-ALG-BS)", () => {
  it("T-ALG-BS-01: finds an existing target", () => {
    expect(binarySearch([1, 3, 5, 7, 9], 7)).toBe(3);
  });

  it("T-ALG-BS-02: returns -1 for a missing target", () => {
    expect(binarySearch([1, 3, 5, 7, 9], 4)).toBe(-1);
  });

  it("T-ALG-BS-03: works on a single-element array", () => {
    expect(binarySearch([5], 5)).toBe(0);
  });

  it("finds the first and last elements (edge cases)", () => {
    expect(binarySearch([1, 3, 5, 7, 9], 1)).toBe(0);
    expect(binarySearch([1, 3, 5, 7, 9], 9)).toBe(4);
  });
});
