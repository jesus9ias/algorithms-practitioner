import { describe, it, expect } from "vitest";

import { coinChange } from "../exercise.js";

/**
 * T-ALG-CC-* — the single exported function:
 * coinChange(coins, amount) => minimum number of coins to make amount, or -1.
 */
describe("coinChange (T-ALG-CC)", () => {
  it("T-ALG-CC-01: coinChange([1, 2, 5], 11) is 3 (5 + 5 + 1)", () => {
    expect(coinChange([1, 2, 5], 11)).toBe(3);
  });

  it("T-ALG-CC-02: coinChange([2], 3) is -1 (odd amount, only even coin)", () => {
    expect(coinChange([2], 3)).toBe(-1);
  });

  it("T-ALG-CC-03: coinChange([1], 0) is 0 (base case, no loop runs)", () => {
    expect(coinChange([1], 0)).toBe(0);
  });

  it("T-ALG-CC-04: coinChange([], 5) is -1 (no coins to try)", () => {
    expect(coinChange([], 5)).toBe(-1);
  });

  it("T-ALG-CC-05: coinChange([1], 5) is 5 (only single-unit coin available)", () => {
    expect(coinChange([1], 5)).toBe(5);
  });

  it("T-ALG-CC-06: coinChange([1, 3, 4], 6) is 2 (3 + 3, beats 4 + 1 + 1)", () => {
    expect(coinChange([1, 3, 4], 6)).toBe(2);
  });
});
