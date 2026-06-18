import { describe, it, expect } from "vitest";

import { buildSteps } from "../viz";
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
