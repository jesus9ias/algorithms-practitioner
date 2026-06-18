import { describe, it, expect } from "vitest";

import { parseIntegerArray } from "../userInput";
import { MAX_INPUT_LENGTH } from "../../constants";

/**
 * T-INP-* — User input validation.
 * parseIntegerArray(raw: string): Result<number[]>
 * Accepts only a JSON array of integers, non-empty, within MAX_INPUT_LENGTH.
 */
describe("parseIntegerArray (T-INP)", () => {
  it("T-INP-01: valid integer array passes", () => {
    const result = parseIntegerArray("[1, 3, 5, 7]");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([1, 3, 5, 7]);
    }
  });

  it("T-INP-02: script tag is rejected", () => {
    const result = parseIntegerArray("<script>alert(1)</script>");
    expect(result.ok).toBe(false);
  });

  it("T-INP-03: object instead of array is rejected", () => {
    const result = parseIntegerArray("{a:1}");
    expect(result.ok).toBe(false);
  });

  it("T-INP-04: floats are rejected when integers expected", () => {
    const result = parseIntegerArray("[1.5, 2.5]");
    expect(result.ok).toBe(false);
  });

  it("T-INP-05: empty array is rejected", () => {
    const result = parseIntegerArray("[]");
    expect(result.ok).toBe(false);
  });

  it("T-INP-06: array exceeding max length is rejected", () => {
    const oversized = JSON.stringify(new Array(MAX_INPUT_LENGTH + 1).fill(0));
    const result = parseIntegerArray(oversized);
    expect(result.ok).toBe(false);
  });
});
