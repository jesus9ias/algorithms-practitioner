import { describe, it, expect } from "vitest";

import { quickSort } from "../exercise.js";

/**
 * T-ALG-QS-* — the single exported function: quickSort(arr) => ascending array.
 */
describe("quickSort (T-ALG-QS)", () => {
  it("T-ALG-QS-01: sorts an unsorted array ascending", () => {
    expect(quickSort([5, 2, 8, 1, 9, 3, 7])).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it("T-ALG-QS-02: leaves an already-sorted array unchanged", () => {
    expect(quickSort([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-QS-03: sorts a reverse-sorted array", () => {
    expect(quickSort([4, 3, 2, 1])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-QS-04: handles duplicates", () => {
    expect(quickSort([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
  });

  it("T-ALG-QS-05: sorts a single-element array", () => {
    expect(quickSort([42])).toEqual([42]);
  });

  it("T-ALG-QS-06: returns an empty array for empty input", () => {
    expect(quickSort([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    quickSort(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
