import { describe, it, expect } from "vitest";

import { singleNumber } from "../exercise.js";

/**
 * T-ALG-SN-* — the single exported function: singleNumber(arr) => value.
 */
describe("singleNumber (T-ALG-SN)", () => {
  it("T-ALG-SN-01: finds the unpaired value among duplicated pairs", () => {
    expect(singleNumber([4, 1, 2, 1, 2])).toBe(4);
  });

  it("T-ALG-SN-02: works with a single element", () => {
    expect(singleNumber([7])).toBe(7);
  });

  it("T-ALG-SN-03: returns 0 for an empty array", () => {
    expect(singleNumber([])).toBe(0);
  });

  it("handles negative values and an unpaired value at either end", () => {
    expect(singleNumber([-3, 5, -3, 5, 9])).toBe(9);
    expect(singleNumber([1, 2, 2, 3, 3])).toBe(1);
  });
});
