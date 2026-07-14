import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { bfsGraph } from "../exercise.js";

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

describe("bfs-graph viz (T-VIZEX-BFSG, T-INT-BFSG)", () => {
  it("T-VIZEX-BFSG: emits one step per visited node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(6);
    expect(steps[0]).toMatchObject({ node: 0, newlyEnqueued: [1, 2] });
  });

  it("T-VIZEX-BFSG: builds one edge per connected pair, tagged mutual when symmetric", () => {
    const { edges } = buildSteps(input);
    expect(edges).toContainEqual({ a: 0, b: 1, direction: "both" });
    expect(edges).toContainEqual({ a: 0, b: 2, direction: "both" });
    expect(edges.length).toBe(6);
  });

  it("T-VIZEX-BFSG: tags a one-directional edge with its actual direction", () => {
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

  it("T-VIZEX-BFSG: empty matrix produces no steps", () => {
    expect(buildSteps({ values: [], matrix: [] }).steps).toEqual([]);
  });

  it("T-INT-BFSG: viz result equals the bfsGraph result", () => {
    expect(buildSteps(input).result).toEqual(bfsGraph(matrix));
  });
});

describe("bfs-graph describeStep (T-DESC-BFSG)", () => {
  const viz = createViz(input);

  it("T-DESC-BFSG: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BFSG: first step visits node 0 and enqueues 1 and 2", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "visit",
      params: { node: 0, enqueued: "1, 2" },
    });
  });

  it("T-DESC-BFSG: last step visits node 5 with no new neighbors", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "visit",
      params: { node: 5, enqueued: "—" },
    });
  });
});

describe("bfs-graph codeLines (T-CODELINES-BFSG)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-BFSG-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-BFSG-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
