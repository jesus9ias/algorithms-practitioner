import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { isPalindrome } from "../exercise.js";

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("palindrome-check viz (T-VIZEX-PC, T-INT-PC)", () => {
  it("T-VIZEX-PC: one match step per matching pair, plus a terminal done step", () => {
    const input = { values: [], text: "abba" };
    const { steps } = buildSteps(input);
    // "abba" matches (0,3) and (1,2), then a done step.
    expect(steps.length).toBe(3);
    expect(steps[0].action).toBe("match");
    expect(steps[1].action).toBe("match");
    expect(steps[2].action).toBe("done");
  });

  it("T-VIZEX-PC: an odd-length palindrome's walk ends on the untouched middle character", () => {
    const input = { values: [], text: "aba" };
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(2);
    expect(steps[1]).toMatchObject({ left: 1, right: 1, action: "done" });
  });

  it("T-VIZEX-PC: the scan short-circuits on the first mismatch", () => {
    const input = { values: [], text: "abcxba" };
    const { steps } = buildSteps(input);
    // Matches (0,5) and (1,4), then a mismatch at (2,3) — no done step.
    expect(steps.length).toBe(3);
    expect(steps[0].action).toBe("match");
    expect(steps[1].action).toBe("match");
    expect(steps[2]).toMatchObject({ left: 2, right: 3, action: "mismatch" });
  });

  it("T-INT-PC: viz result equals the isPalindrome result (palindrome)", () => {
    const input = { values: [], text: "racecar" };
    expect(buildSteps(input).result).toBe(isPalindrome(input.text));
  });

  it("T-INT-PC: viz result equals the isPalindrome result (non-palindrome)", () => {
    const input = { values: [], text: "hello" };
    expect(buildSteps(input).result).toBe(isPalindrome(input.text));
  });

  it("T-INT-PC: viz result equals the isPalindrome result (empty string)", () => {
    const input = { values: [], text: "" };
    expect(buildSteps(input).result).toBe(isPalindrome(input.text));
  });
});

describe("palindrome-check describeStep (T-DESC-PC)", () => {
  it("T-DESC-PC: step 0 has no log row", () => {
    const viz = createViz({ values: [], text: "aba" });
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-PC: a match reports both positions and characters", () => {
    const viz = createViz({ values: [], text: "aba" });
    expect(viz.describeStep(1)).toEqual({
      key: "match",
      params: { left: 0, right: 2, leftChar: "a", rightChar: "a" },
    });
  });

  it("T-DESC-PC: a mismatch reports both positions and characters", () => {
    const viz = createViz({ values: [], text: "abcxba" });
    expect(viz.describeStep(3)).toEqual({
      key: "mismatch",
      params: { left: 2, right: 3, leftChar: "c", rightChar: "x" },
    });
  });

  it("T-DESC-PC: an odd-length palindrome finishes on the middle character", () => {
    const viz = createViz({ values: [], text: "aba" });
    expect(viz.describeStep(2)).toEqual({
      key: "doneMiddle",
      params: { index: 1, char: "b" },
    });
  });

  it("T-DESC-PC: an even-length palindrome finishes crossed", () => {
    const viz = createViz({ values: [], text: "abba" });
    expect(viz.describeStep(3)).toEqual({ key: "doneCrossed", params: {} });
  });
});

describe("palindrome-check codeLines (T-CODELINES-PC)", () => {
  const input = { values: [], text: "abcxba" };
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-PC-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-PC-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
