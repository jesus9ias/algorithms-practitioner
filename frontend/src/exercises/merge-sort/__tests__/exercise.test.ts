import { describe, it, expect } from "vitest";

import { mergeSort } from "../exercise.js";

/**
 * T-ALG-MSORT-* — the single exported function: mergeSort(arr) => ascending array.
 */
describe("mergeSort (T-ALG-MSORT)", () => {
  it("T-ALG-MSORT-01: sorts an unsorted array ascending", () => {
    expect(mergeSort([5, 2, 8, 1, 9, 3])).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it("T-ALG-MSORT-02: leaves an already-sorted array unchanged", () => {
    expect(mergeSort([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-MSORT-03: sorts a reverse-sorted array", () => {
    expect(mergeSort([4, 3, 2, 1])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-MSORT-04: handles duplicates", () => {
    expect(mergeSort([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
  });

  it("T-ALG-MSORT-05: sorts a single-element array", () => {
    expect(mergeSort([42])).toEqual([42]);
  });

  it("T-ALG-MSORT-06: returns an empty array for empty input", () => {
    expect(mergeSort([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    mergeSort(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
