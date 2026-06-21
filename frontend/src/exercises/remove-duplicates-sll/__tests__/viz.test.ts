import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { removeDuplicatesSLL } from "../exercise.js";

/** Rendered line count of a sibling source file (Shiki drops one trailing \n). */
function sourceLineCount(relative: string): number {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\n$/, "")
    .split("\n").length;
}

function toArray(head: { value: number; next: any } | null): number[] {
  const result: number[] = [];
  let node = head;
  while (node !== null) {
    result.push(node.value);
    node = node.next;
  }
  return result;
}

const input = { values: [1, 2, 1, 3, 2] };

describe("remove-duplicates-sll buildSteps (T-VIZEX-SLL)", () => {
  it("T-VIZEX-SLL-01: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps).toHaveLength(input.values.length);
  });

  it("T-VIZEX-SLL-02: marks duplicates correctly", () => {
    const { steps } = buildSteps(input);
    expect(steps[0].isDuplicate).toBe(false); // 1 first time
    expect(steps[1].isDuplicate).toBe(false); // 2 first time
    expect(steps[2].isDuplicate).toBe(true);  // 1 duplicate
    expect(steps[3].isDuplicate).toBe(false); // 3 first time
    expect(steps[4].isDuplicate).toBe(true);  // 2 duplicate
  });

  it("T-VIZEX-SLL-03: viz result matches the list returned by the exercise (T-INT-SLL)", () => {
    const { result } = buildSteps(input);
    expect([...result]).toEqual(toArray(removeDuplicatesSLL([...input.values])));
  });
});

describe("remove-duplicates-sll describeStep (T-DESC-SLL)", () => {
  const viz = createViz(input);

  it("T-DESC-SLL-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-SLL-02: first occurrence emits keep key", () => {
    expect(viz.describeStep(1)).toEqual({ key: "keep", params: { value: 1 } });
  });

  it("T-DESC-SLL-03: duplicate emits skip key", () => {
    expect(viz.describeStep(3)).toEqual({ key: "skip", params: { value: 1 } });
  });

  it("T-DESC-SLL-04: totalSteps equals node count plus one initial step", () => {
    expect(viz.totalSteps).toBe(input.values.length + 1);
  });
});

describe("remove-duplicates-sll codeLines (T-CODELINES-SLL)", () => {
  const viz = createViz(input);
  const jsLines = sourceLineCount("../exercise.js");
  const pseudoLines = sourceLineCount("../exercise.pseudo");

  it("T-CODELINES-SLL-01: step 0 highlights nothing", () => {
    expect(viz.codeLines(0)).toBeNull();
  });

  it("T-CODELINES-SLL-02: every step maps to in-range 1-based source lines", () => {
    const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;
    for (let step = 1; step < viz.totalSteps; step += 1) {
      const lines = viz.codeLines(step);
      if (lines === null) continue;
      expect(lines.js.every((n) => inRange(n, jsLines))).toBe(true);
      expect(lines.pseudo.every((n) => inRange(n, pseudoLines))).toBe(true);
    }
  });
});
