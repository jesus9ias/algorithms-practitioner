import { describe, it, expect } from "vitest";

import { isPalindrome } from "../exercise.js";

/**
 * T-ALG-PC-* — the single exported function:
 * isPalindrome(s) => true when s reads the same forwards and backwards.
 */
describe("isPalindrome (T-ALG-PC)", () => {
  it("T-ALG-PC-01: an odd-length palindrome returns true", () => {
    expect(isPalindrome("racecar")).toBe(true);
  });

  it("T-ALG-PC-02: an even-length palindrome returns true", () => {
    expect(isPalindrome("abba")).toBe(true);
  });

  it("T-ALG-PC-03: a non-palindrome returns false", () => {
    expect(isPalindrome("hello")).toBe(false);
  });

  it("T-ALG-PC-04: a single character is a palindrome", () => {
    expect(isPalindrome("a")).toBe(true);
  });

  it("T-ALG-PC-05: an empty string is a palindrome", () => {
    expect(isPalindrome("")).toBe(true);
  });

  it("T-ALG-PC-06: comparison is case-sensitive", () => {
    expect(isPalindrome("Aba")).toBe(false);
  });

  it("T-ALG-PC-07: a mismatch after some matched pairs returns false", () => {
    expect(isPalindrome("abcxba")).toBe(false);
  });
});
