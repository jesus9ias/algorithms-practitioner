import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { reverseLinkedList } from "../exercise.js";

const input = { values: [4, 2, 7] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("linked-list viz (T-VIZEX-LL, T-INT-LL)", () => {
  it("T-VIZEX-LL: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.values.length);
  });

  it("T-INT-LL: viz result equals the reverseLinkedList result", () => {
    expect(buildSteps(input).result).toEqual(reverseLinkedList(input.values));
  });
});

describe("linked-list describeStep (T-DESC-LL)", () => {
  const viz = createViz(input);

  it("T-DESC-LL: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-LL: first step prepends the first node's value", () => {
    expect(viz.describeStep(1)).toEqual({ key: "prepend", params: { value: 4 } });
  });

  it("T-DESC-LL: one descriptor per node, each prepending its value", () => {
    const described = input.values.map((_, i) => viz.describeStep(i + 1));
    expect(described).toEqual(
      input.values.map((value) => ({ key: "prepend", params: { value } }))
    );
  });
});

describe("linked-list codeLines (T-CODELINES-LL)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-LL-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-LL-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
