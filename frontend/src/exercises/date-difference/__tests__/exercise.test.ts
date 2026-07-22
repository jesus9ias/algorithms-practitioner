import { describe, it, expect } from "vitest";

import { dateDifference } from "../exercise.js";

/**
 * T-ALG-DD-* — the single exported function: dateDifference(input) => days.
 */
describe("dateDifference (T-ALG-DD)", () => {
  it("T-ALG-DD-01: computes the day span across a leap-year February", () => {
    expect(dateDifference("2024-01-15,2024-03-22")).toBe(67);
  });

  it("T-ALG-DD-02: returns 0 for two identical dates", () => {
    expect(dateDifference("2024-06-01,2024-06-01")).toBe(0);
  });

  it("T-ALG-DD-03: is order-independent (absolute difference)", () => {
    expect(dateDifference("2024-03-22,2024-01-15")).toBe(67);
  });

  it("T-ALG-DD-04: crosses a leap day (Feb 29, 2024)", () => {
    expect(dateDifference("2024-02-28,2024-03-01")).toBe(2);
  });

  it("T-ALG-DD-05: crosses a year boundary", () => {
    expect(dateDifference("2023-12-31,2024-01-01")).toBe(1);
  });

  it("T-ALG-DD-06: does not count Feb 29 in a non-leap year", () => {
    expect(dateDifference("2023-02-28,2023-03-01")).toBe(1);
  });
});
