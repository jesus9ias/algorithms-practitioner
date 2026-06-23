import { describe, it, expect } from "vitest";

import { runningAverage } from "../exercise.js";

/**
 * T-ALG-RA-* — the single exported function:
 * runningAverage(arr, w) => number[] of per-window averages (2 decimals).
 */
describe("runningAverage (T-ALG-RA)", () => {
  it("T-ALG-RA-01: averages every consecutive window", () => {
    expect(runningAverage([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4]);
  });

  it("T-ALG-RA-02: rounds each average to two decimals", () => {
    expect(runningAverage([4, 2, 8, 1, 9, 3], 4)).toEqual([3.75, 5, 5.25]);
  });

  it("T-ALG-RA-03: a window larger than the array yields an empty list", () => {
    expect(runningAverage([1, 2, 3], 4)).toEqual([]);
  });

  it("T-ALG-RA-04: a window equal to the array length yields a single average", () => {
    expect(runningAverage([2, 4, 6], 3)).toEqual([4]);
  });

  it("T-ALG-RA-05: a window of 1 returns each element as its own average", () => {
    expect(runningAverage([5, 1, 9], 1)).toEqual([5, 1, 9]);
  });

  it("T-ALG-RA-06: an empty array yields an empty list", () => {
    expect(runningAverage([], 3)).toEqual([]);
  });

  it("rounds a repeating decimal to two places", () => {
    // (1 + 2) / 3 windows: averages of [1,1,2] and [1,2,2] are 1.33 and 1.67.
    expect(runningAverage([1, 1, 2, 2], 3)).toEqual([1.33, 1.67]);
  });
});
