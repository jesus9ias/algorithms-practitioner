import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { decodeString } from "../exercise.js";

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

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

describe("decode-string codeLines (T-CODELINES-DS)", () => {
  // Exercises all four scan actions: digit, open, char, close.
  const input = { values: [], text: "2[a3[b]]" };
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-DS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-DS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
