import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { reverseLinkedList } from "../exercise.js";

const input = { values: [4, 2, 7] };

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
