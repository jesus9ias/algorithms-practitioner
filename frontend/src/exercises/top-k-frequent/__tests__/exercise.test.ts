import { describe, it, expect } from "vitest";

import { topKFrequent } from "../exercise.js";

/**
 * T-ALG-TKF-* — the single exported function:
 * topKFrequent(arr, k) => the k most frequent values, most frequent first.
 */
describe("topKFrequent (T-ALG-TKF)", () => {
  it("T-ALG-TKF-01: returns the k most frequent values, most frequent first", () => {
    expect(topKFrequent([1, 1, 1, 2, 2, 3], 2)).toEqual([1, 2]);
  });

  it("T-ALG-TKF-02: breaks frequency ties in a valid order", () => {
    expect(topKFrequent([4, 4, 1, 2, 2, 3, 3, 3, 1], 3)).toEqual([3, 4, 1]);
  });

  it("T-ALG-TKF-03: k equal to the number of unique values returns all of them", () => {
    const out = topKFrequent([1, 1, 2, 3], 3);
    expect(out).toHaveLength(3);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(out[0]).toBe(1); // value 1 has the highest frequency
  });

  it("T-ALG-TKF-04: k larger than the number of unique values returns every unique value", () => {
    const out = topKFrequent([1, 2, 2], 5);
    expect(out).toHaveLength(2);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it("T-ALG-TKF-05: when all values share the same frequency, any k of them are valid", () => {
    const out = topKFrequent([1, 2, 3], 2);
    expect(out).toHaveLength(2);
    out.forEach((value) => expect([1, 2, 3]).toContain(value));
    expect(new Set(out).size).toBe(2);
  });

  it("T-ALG-TKF-06: returns an empty array for empty input", () => {
    expect(topKFrequent([], 2)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [1, 1, 2];
    topKFrequent(input, 1);
    expect(input).toEqual([1, 1, 2]);
  });
});
