import { describe, it, expect } from "vitest";

import { climbingStairs } from "../exercise.js";

/**
 * T-ALG-CS-* — the single exported function:
 * climbingStairs(n) => the number of distinct ways to reach the top.
 */
describe("climbingStairs (T-ALG-CS)", () => {
  it("T-ALG-CS-01: climbingStairs(0) is 1 (trivial: no stairs, one way)", () => {
    expect(climbingStairs(0)).toBe(1);
  });

  it("T-ALG-CS-02: climbingStairs(1) is 1", () => {
    expect(climbingStairs(1)).toBe(1);
  });

  it("T-ALG-CS-03: climbingStairs(2) is 2", () => {
    expect(climbingStairs(2)).toBe(2);
  });

  it("T-ALG-CS-04: climbingStairs(3) is 3", () => {
    expect(climbingStairs(3)).toBe(3);
  });

  it("T-ALG-CS-05: climbingStairs(5) is 8", () => {
    expect(climbingStairs(5)).toBe(8);
  });

  it("T-ALG-CS-06: climbingStairs(10) is 89", () => {
    expect(climbingStairs(10)).toBe(89);
  });

  it("T-ALG-CS-07: negative n returns 1 with no looping", () => {
    expect(climbingStairs(-4)).toBe(1);
  });
});
