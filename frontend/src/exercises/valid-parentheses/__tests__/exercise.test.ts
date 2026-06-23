import { describe, it, expect } from "vitest";

import { isBalanced } from "../exercise.js";

/**
 * T-ALG-VP-* — the single exported function:
 * isBalanced(s) => whether (), [] and {} are balanced and properly nested,
 * ignoring any non-bracket characters.
 */
describe("isBalanced (T-ALG-VP)", () => {
  it("T-ALG-VP-01: a simple matching pair is balanced", () => {
    expect(isBalanced("()")).toBe(true);
  });

  it("T-ALG-VP-02: nested mixed brackets are balanced", () => {
    expect(isBalanced("a(b[c]{d})e")).toBe(true);
  });

  it("T-ALG-VP-03: letters between brackets are ignored", () => {
    expect(isBalanced("(abc)")).toBe(true);
  });

  it("T-ALG-VP-04: interleaved (wrong nesting order) is unbalanced", () => {
    expect(isBalanced("([)]")).toBe(false);
  });

  it("T-ALG-VP-05: an unclosed opening bracket is unbalanced", () => {
    expect(isBalanced("(()")).toBe(false);
  });

  it("T-ALG-VP-06: a closing bracket with no opening is unbalanced", () => {
    expect(isBalanced(")(")).toBe(false);
  });

  it("T-ALG-VP-07: mismatched bracket types are unbalanced", () => {
    expect(isBalanced("(]")).toBe(false);
  });

  it("T-ALG-VP-08: an empty string is balanced", () => {
    expect(isBalanced("")).toBe(true);
  });

  it("T-ALG-VP-09: a string with no brackets is balanced", () => {
    expect(isBalanced("abc")).toBe(true);
  });
});
