import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { reverseString } from "../exercise.js";

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("reverse-string viz (T-VIZEX-RS, T-INT-RS)", () => {
  it("T-VIZEX-RS: one swap step per pointer pair, plus a terminal done step", () => {
    const input = { values: [], text: "abcd" };
    const { steps } = buildSteps(input);
    // "abcd" swaps (0,3) and (1,2), then a done step.
    expect(steps.length).toBe(3);
    expect(steps[0].action).toBe("swap");
    expect(steps[1].action).toBe("swap");
    expect(steps[2].action).toBe("done");
  });

  it("T-VIZEX-RS: an odd-length input's walk ends on the untouched middle character", () => {
    const input = { values: [], text: "abc" };
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(2);
    expect(steps[1]).toMatchObject({ left: 1, right: 1, action: "done" });
  });

  it("T-INT-RS: viz result equals the reverseString result (even length)", () => {
    const input = { values: [], text: "abcd" };
    expect(buildSteps(input).result).toBe(reverseString(input.text));
  });

  it("T-INT-RS: viz result equals the reverseString result (odd length)", () => {
    const input = { values: [], text: "abcba" };
    expect(buildSteps(input).result).toBe(reverseString(input.text));
  });

  it("T-INT-RS: viz result equals the reverseString result (empty string)", () => {
    const input = { values: [], text: "" };
    expect(buildSteps(input).result).toBe(reverseString(input.text));
  });
});

describe("reverse-string describeStep (T-DESC-RS)", () => {
  const input = { values: [], text: "ab" };
  const viz = createViz(input);

  it("T-DESC-RS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-RS: a swap reports both positions and characters", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "swap",
      params: { left: 0, right: 1, leftChar: "a", rightChar: "b" },
    });
  });

  it("T-DESC-RS: an even-length walk finishes crossed", () => {
    expect(viz.describeStep(2)).toEqual({ key: "doneCrossed", params: {} });
  });

  it("T-DESC-RS: an odd-length walk finishes on the middle character", () => {
    const middle = createViz({ values: [], text: "aba" });
    expect(middle.describeStep(2)).toEqual({
      key: "doneMiddle",
      params: { index: 1, char: "b" },
    });
  });
});

describe("reverse-string codeLines (T-CODELINES-RS)", () => {
  const input = { values: [], text: "abcd" };
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-RS-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-RS-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
