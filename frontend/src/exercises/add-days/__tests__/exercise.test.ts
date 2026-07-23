import { describe, it, expect } from "vitest";

import { addDays } from "../exercise.js";

/**
 * T-ALG-AD-* — the single exported function: addDays(input) => resulting ISO date.
 */
describe("addDays (T-ALG-AD)", () => {
  it("T-ALG-AD-01: adds days across a leap-year February rollover", () => {
    expect(addDays("2024-02-25,10")).toBe("2024-03-06");
  });

  it("T-ALG-AD-02: adding 0 days returns the same date", () => {
    expect(addDays("2024-06-01,0")).toBe("2024-06-01");
  });

  it("T-ALG-AD-03: subtracts days for a negative offset", () => {
    expect(addDays("2024-01-03,-5")).toBe("2023-12-29");
  });

  it("T-ALG-AD-04: adding days rolls over a non-leap February", () => {
    expect(addDays("2023-02-25,5")).toBe("2023-03-02");
  });

  it("T-ALG-AD-05: adds days across a year boundary", () => {
    expect(addDays("2023-12-30,3")).toBe("2024-01-02");
  });

  it("T-ALG-AD-06: subtracting days rolls back onto a leap day", () => {
    expect(addDays("2024-03-01,-1")).toBe("2024-02-29");
  });
});
