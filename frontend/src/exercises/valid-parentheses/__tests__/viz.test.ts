import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { isBalanced } from "../exercise.js";

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("valid-parentheses viz (T-VIZEX-VP, T-INT-VP)", () => {
  it("T-VIZEX-VP: a fully scanned input emits one step per character", () => {
    const input = { values: [], text: "a(b[c]{d})e" };
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.text.length);
  });

  it("T-VIZEX-VP: the scan short-circuits on the first mismatch", () => {
    const input = { values: [], text: "(]xyz" };
    const { steps } = buildSteps(input);
    // Stops right after the mismatching ']' at index 1.
    expect(steps.length).toBe(2);
    expect(steps[steps.length - 1].action).toBe("mismatch");
  });

  it("T-INT-VP: viz result equals the isBalanced result (balanced)", () => {
    const input = { values: [], text: "a(b[c]{d})e" };
    expect(buildSteps(input).result).toBe(isBalanced(input.text));
  });

  it("T-INT-VP: viz result equals the isBalanced result (unbalanced)", () => {
    const input = { values: [], text: "([)]" };
    expect(buildSteps(input).result).toBe(isBalanced(input.text));
  });

  it("T-INT-VP: viz result equals the isBalanced result (leftover open)", () => {
    const input = { values: [], text: "(()" };
    expect(buildSteps(input).result).toBe(isBalanced(input.text));
  });
});

describe("valid-parentheses describeStep (T-DESC-VP)", () => {
  // "(a)" exercises push (open), ignore (letter) and match (close) actions.
  const input = { values: [], text: "(a)" };
  const viz = createViz(input);

  it("T-DESC-VP: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-VP: an opening bracket is pushed", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "pushOpen",
      params: { bracket: "(" },
    });
  });

  it("T-DESC-VP: a non-bracket character is ignored", () => {
    expect(viz.describeStep(2)).toEqual({
      key: "ignoreChar",
      params: { char: "a" },
    });
  });

  it("T-DESC-VP: a matching closing bracket is popped", () => {
    expect(viz.describeStep(3)).toEqual({
      key: "matchClose",
      params: { bracket: ")", expected: "(" },
    });
  });

  it("T-DESC-VP: a mismatching closing bracket is reported", () => {
    const mismatch = createViz({ values: [], text: "(]" });
    expect(mismatch.describeStep(2)).toEqual({
      key: "mismatchClose",
      params: { bracket: "]" },
    });
  });
});

describe("valid-parentheses codeLines (T-CODELINES-VP)", () => {
  // Exercises the open, ignore and match scan actions.
  const input = { values: [], text: "a(b[c]{d})e" };
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-VP-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-VP-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
