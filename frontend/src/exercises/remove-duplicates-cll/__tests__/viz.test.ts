import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { removeDuplicatesCLL } from "../exercise.js";

function toArray(head: { value: number; next: any } | null): number[] {
  if (head === null) return [];
  const result: number[] = [];
  let node = head;
  do {
    result.push(node.value);
    node = node.next;
  } while (node !== head);
  return result;
}

const input = { values: [1, 2, 1, 3, 2] };

describe("remove-duplicates-cll buildSteps (T-VIZEX-CLL)", () => {
  it("T-VIZEX-CLL-01: produces one step per node", () => {
    const { steps } = buildSteps(input);
    expect(steps).toHaveLength(input.values.length);
  });

  it("T-VIZEX-CLL-02: marks duplicates correctly", () => {
    const { steps } = buildSteps(input);
    expect(steps[0].isDuplicate).toBe(false); // 1 first time
    expect(steps[1].isDuplicate).toBe(false); // 2 first time
    expect(steps[2].isDuplicate).toBe(true);  // 1 duplicate
    expect(steps[3].isDuplicate).toBe(false); // 3 first time
    expect(steps[4].isDuplicate).toBe(true);  // 2 duplicate
  });

  it("T-VIZEX-CLL-03: viz result matches the list returned by the exercise (T-INT-CLL)", () => {
    const { result } = buildSteps(input);
    expect([...result]).toEqual(toArray(removeDuplicatesCLL([...input.values])));
  });
});

describe("remove-duplicates-cll describeStep (T-DESC-CLL)", () => {
  const viz = createViz(input);

  it("T-DESC-CLL-01: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-CLL-02: first occurrence emits keep key", () => {
    expect(viz.describeStep(1)).toEqual({ key: "keep", params: { value: 1 } });
  });

  it("T-DESC-CLL-03: duplicate emits skip key", () => {
    expect(viz.describeStep(3)).toEqual({ key: "skip", params: { value: 1 } });
  });

  it("T-DESC-CLL-04: totalSteps equals node count plus one initial step", () => {
    expect(viz.totalSteps).toBe(input.values.length + 1);
  });
});
