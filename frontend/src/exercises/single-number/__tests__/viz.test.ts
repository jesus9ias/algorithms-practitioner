import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { singleNumber } from "../exercise.js";

const input = { values: [4, 1, 2, 1, 2] };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("single-number viz (T-VIZEX-SN, T-INT-SN)", () => {
  it("T-VIZEX-SN: produces one scan step per element plus a terminal done step", () => {
    const { steps } = buildSteps(input);
    expect(steps).toHaveLength(input.values.length + 1);
    expect(steps[steps.length - 1].kind).toBe("done");
  });

  it("T-VIZEX-SN: an empty array produces a single empty step and result 0", () => {
    const { steps, result } = buildSteps({ values: [] });
    expect(steps).toEqual([{ index: -1, value: 0, result: 0, kind: "empty" }]);
    expect(result).toBe(0);
  });

  it("T-INT-SN: viz result equals the singleNumber result", () => {
    expect(buildSteps(input).result).toBe(singleNumber([...input.values]));
  });
});

describe("single-number describeStep (T-DESC-SN)", () => {
  const viz = createViz(input);

  it("T-DESC-SN: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-SN: first step XORs in the first element", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "scan",
      params: { index: 0, value: 4, result: 4 },
    });
  });

  it("T-DESC-SN: last step reports the final XORed result", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "done",
      params: { result: 4 },
    });
  });

  it("T-DESC-SN: empty input reports the empty guard", () => {
    const emptyViz = createViz({ values: [] });
    expect(emptyViz.describeStep(1)).toEqual({ key: "empty" });
  });
});

describe("single-number codeLines (T-CODELINES-SN)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-SN-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-SN-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
