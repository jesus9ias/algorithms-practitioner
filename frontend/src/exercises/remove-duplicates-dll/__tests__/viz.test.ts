import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { removeDuplicatesDLL } from "../exercise.js";

function toArray(head: { value: number; prev: any; next: any } | null): number[] {
  const result: number[] = [];
  let node = head;
  while (node !== null) {
    result.push(node.value);
    node = node.next;
  }
  return result;
}

const input = { values: [1, 2, 1, 3, 2] };

describe("remove-duplicates-dll buildSteps (T-VIZEX-DLL)", () => {
  it("T-VIZEX-DLL-01: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps).toHaveLength(input.values.length);
  });

  it("T-VIZEX-DLL-02: marks duplicates correctly", () => {
    const { steps } = buildSteps(input);
    expect(steps[0].isDuplicate).toBe(false); // 1 first time
    expect(steps[1].isDuplicate).toBe(false); // 2 first time
    expect(steps[2].isDuplicate).toBe(true);  // 1 duplicate
    expect(steps[3].isDuplicate).toBe(false); // 3 first time
    expect(steps[4].isDuplicate).toBe(true);  // 2 duplicate
  });

  it("T-VIZEX-DLL-03: viz result matches the list returned by the exercise (T-INT-DLL)", () => {
    const { result } = buildSteps(input);
    expect([...result]).toEqual(toArray(removeDuplicatesDLL([...input.values])));
  });
});

describe("remove-duplicates-dll describeStep (T-DESC-DLL)", () => {
  const viz = createViz(input);

  it("T-DESC-DLL-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-DLL-02: first occurrence emits keep key", () => {
    expect(viz.describeStep(1)).toEqual({ key: "keep", params: { value: 1 } });
  });

  it("T-DESC-DLL-03: duplicate emits skip key", () => {
    expect(viz.describeStep(3)).toEqual({ key: "skip", params: { value: 1 } });
  });

  it("T-DESC-DLL-04: totalSteps equals node count plus one initial step", () => {
    expect(viz.totalSteps).toBe(input.values.length + 1);
  });
});
