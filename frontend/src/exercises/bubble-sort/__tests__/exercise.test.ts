import { describe, it, expect } from "vitest";

import { bubbleSort } from "../exercise.js";

/**
 * T-ALG-BSORT-* — the single exported function: bubbleSort(arr) => ascending array.
 */
describe("bubbleSort (T-ALG-BSORT)", () => {
  it("T-ALG-BSORT-01: sorts an unsorted array ascending", () => {
    expect(bubbleSort([5, 3, 1, 4, 2])).toEqual([1, 2, 3, 4, 5]);
  });

  it("T-ALG-BSORT-02: leaves an already-sorted array unchanged", () => {
    expect(bubbleSort([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-BSORT-03: sorts a reverse-sorted array", () => {
    expect(bubbleSort([4, 3, 2, 1])).toEqual([1, 2, 3, 4]);
  });

  it("T-ALG-BSORT-04: handles duplicates", () => {
    expect(bubbleSort([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
  });

  it("T-ALG-BSORT-05: sorts a single-element array", () => {
    expect(bubbleSort([42])).toEqual([42]);
  });

  it("T-ALG-BSORT-06: returns an empty array for empty input", () => {
    expect(bubbleSort([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    bubbleSort(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
