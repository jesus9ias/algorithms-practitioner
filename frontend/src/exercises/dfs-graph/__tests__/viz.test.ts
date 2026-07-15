import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { dfsGraph } from "../exercise.js";

const matrix = [
  [0, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 0],
  [1, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 1],
  [0, 0, 1, 0, 1, 0],
];
const input = { values: [], matrix };

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

describe("dfs-graph viz (T-VIZEX-DFSG, T-INT-DFSG)", () => {
  it("T-VIZEX-DFSG: emits one step per confirmed (non-duplicate) node visit", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(6);
    expect(steps[0]).toMatchObject({ node: 0, newlyPushed: [2, 1] });
    expect(steps[5]).toMatchObject({ node: 2, newlyPushed: [] });
  });

  it("T-VIZEX-DFSG: builds one edge per connected pair, tagged mutual when symmetric", () => {
    const { edges } = buildSteps(input);
    expect(edges).toContainEqual({ a: 0, b: 1, direction: "both" });
    expect(edges).toContainEqual({ a: 0, b: 2, direction: "both" });
    expect(edges.length).toBe(6);
  });

  it("T-VIZEX-DFSG: tags a one-directional edge with its actual direction", () => {
    // 0 -> 1 only (matrix[1][0] is 0): a directed edge, not mutual.
    const directedMatrix = [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ];
    const { edges } = buildSteps({ values: [], matrix: directedMatrix });
    expect(edges).toContainEqual({ a: 0, b: 1, direction: "forward" });
    expect(edges).toContainEqual({ a: 1, b: 2, direction: "both" });
    expect(edges).toContainEqual({ a: 0, b: 3, direction: "backward" });
  });

  it("T-VIZEX-DFSG: empty matrix produces no steps", () => {
    expect(buildSteps({ values: [], matrix: [] }).steps).toEqual([]);
  });

  it("T-INT-DFSG: viz result equals the dfsGraph result", () => {
    expect(buildSteps(input).result).toEqual(dfsGraph(matrix));
  });
});

describe("dfs-graph describeStep (T-DESC-DFSG)", () => {
  const viz = createViz(input);

  it("T-DESC-DFSG: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-DFSG: first step visits node 0 and pushes 2 and 1", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "visit",
      params: { node: 0, pushed: "2, 1" },
    });
  });

  it("T-DESC-DFSG: last step visits node 2 with no new neighbors", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "visit",
      params: { node: 2, pushed: "—" },
    });
  });
});

describe("dfs-graph codeLines (T-CODELINES-DFSG)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-DFSG-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-DFSG-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
