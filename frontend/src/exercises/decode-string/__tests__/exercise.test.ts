import { describe, it, expect } from "vitest";

import { decodeString } from "../exercise.js";

/**
 * T-ALG-DS-* — the single exported function:
 * decodeString(s) => the expanded string for the `n[substring]` format.
 */
describe("decodeString (T-ALG-DS)", () => {
  it("T-ALG-DS-01: decodes sequential groups", () => {
    expect(decodeString("3[ab]2[cd]")).toBe("abababcdcd");
  });

  it("T-ALG-DS-02: decodes nested groups inside-out", () => {
    expect(decodeString("2[a3[b]]")).toBe("abbbabbb");
  });

  it("T-ALG-DS-03: preserves text without brackets", () => {
    expect(decodeString("abc")).toBe("abc");
  });

  it("T-ALG-DS-04: handles multi-digit repeat counts", () => {
    expect(decodeString("12[a]")).toBe("aaaaaaaaaaaa");
  });

  it("T-ALG-DS-05: keeps letters outside brackets", () => {
    expect(decodeString("ab2[c]d")).toBe("abccd");
  });

  it("T-ALG-DS-06: returns empty string for empty input", () => {
    expect(decodeString("")).toBe("");
  });

  it("T-ALG-DS-07: handles deeply nested groups", () => {
    expect(decodeString("2[a2[b3[c]]]")).toBe("abcccbcccabcccbccc");
  });
});
