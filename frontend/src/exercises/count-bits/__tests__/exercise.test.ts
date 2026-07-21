import { describe, it, expect } from "vitest";

import { countBits } from "../exercise.js";

/**
 * T-ALG-CB-* — the single exported function: countBits(n) => count.
 */
describe("countBits (T-ALG-CB)", () => {
  it("T-ALG-CB-01: counts the set bits of a mixed binary pattern", () => {
    expect(countBits(11)).toBe(3);
  });

  it("T-ALG-CB-02: returns 0 for 0", () => {
    expect(countBits(0)).toBe(0);
  });

  it("T-ALG-CB-03: returns 0 for negative input", () => {
    expect(countBits(-5)).toBe(0);
  });

  it("T-ALG-CB-04: counts a single set bit", () => {
    expect(countBits(1)).toBe(1);
    expect(countBits(16)).toBe(1);
  });

  it("T-ALG-CB-05: counts every bit set", () => {
    expect(countBits(255)).toBe(8);
  });
});
