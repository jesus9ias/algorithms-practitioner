import { describe, it, expect } from "vitest";

import { reverseString } from "../exercise.js";

/**
 * T-ALG-RS-* — the single exported function:
 * reverseString(s) => the characters of s in reverse order.
 */
describe("reverseString (T-ALG-RS)", () => {
  it("T-ALG-RS-01: reverses a simple word", () => {
    expect(reverseString("hello")).toBe("olleh");
  });

  it("T-ALG-RS-02: reverses an even-length string", () => {
    expect(reverseString("abcd")).toBe("dcba");
  });

  it("T-ALG-RS-03: an odd-length string keeps its middle character in place", () => {
    expect(reverseString("abcba")).toBe("abcba");
  });

  it("T-ALG-RS-04: a single character is returned unchanged", () => {
    expect(reverseString("a")).toBe("a");
  });

  it("T-ALG-RS-05: an empty string is returned unchanged", () => {
    expect(reverseString("")).toBe("");
  });

  it("T-ALG-RS-06: preserves spaces and punctuation", () => {
    expect(reverseString("hi, mom!")).toBe("!mom ,ih");
  });

  it("T-ALG-RS-07: does not mutate a palindrome's meaning", () => {
    expect(reverseString("racecar")).toBe("racecar");
  });
});
