import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { decodeString } from "../exercise.js";

describe("decode-string viz (T-VIZEX-DS, T-INT-DS)", () => {
  it("T-VIZEX-DS: emits one step per scanned character", () => {
    const input = { values: [], text: "2[a3[b]]" };
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.text.length);
  });

  it("T-INT-DS: viz result equals the decodeString result", () => {
    const input = { values: [], text: "2[a3[b]]" };
    expect(buildSteps(input).result).toBe(decodeString(input.text));
  });

  it("T-INT-DS: handles input without brackets", () => {
    const input = { values: [], text: "abc" };
    expect(buildSteps(input).result).toBe(decodeString(input.text));
  });
});

describe("decode-string describeStep (T-DESC-DS)", () => {
  const input = { values: [], text: "2[a]" };
  const viz = createViz(input);

  it("T-DESC-DS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-DS: first step reads the digit", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "readDigit",
      params: { digit: "2", count: 2 },
    });
  });

  it("T-DESC-DS: the '[' step opens a group", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "openGroup",
      params: { count: 2 },
    });
  });

  it("T-DESC-DS: a letter step appends the character", () => {
    expect(viz.describeStep(3)).toEqual({
      key: "appendChar",
      params: { char: "a", current: "a" },
    });
  });

  it("T-DESC-DS: the ']' step closes the group", () => {
    expect(viz.describeStep(4)).toEqual({
      key: "closeGroup",
      params: { segment: "a", count: 2, current: "aa" },
    });
  });

  it("T-DESC-DS: one descriptor per character", () => {
    const described = input.text
      .split("")
      .map((_, i) => viz.describeStep(i + 1));
    expect(described.every((d) => d !== null)).toBe(true);
    expect(described.length).toBe(input.text.length);
  });
});
