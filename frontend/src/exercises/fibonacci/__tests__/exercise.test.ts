import { describe, it, expect } from "vitest";

import { fibonacci } from "../exercise.js";

/**
 * T-ALG-FIB-* — the single exported function:
 * fibonacci(n) => the n-th Fibonacci number.
 */
describe("fibonacci (T-ALG-FIB)", () => {
  it("T-ALG-FIB-01: fibonacci(0) is 0", () => {
    expect(fibonacci(0)).toBe(0);
  });

  it("T-ALG-FIB-02: fibonacci(1) is 1", () => {
    expect(fibonacci(1)).toBe(1);
  });

  it("T-ALG-FIB-03: fibonacci(2) is 1", () => {
    expect(fibonacci(2)).toBe(1);
  });

  it("T-ALG-FIB-04: fibonacci(4) is 3", () => {
    expect(fibonacci(4)).toBe(3);
  });

  it("T-ALG-FIB-05: fibonacci(10) is 55", () => {
    expect(fibonacci(10)).toBe(55);
  });

  it("T-ALG-FIB-06: negative n returns 0 with no recursion", () => {
    expect(fibonacci(-5)).toBe(0);
  });
});
