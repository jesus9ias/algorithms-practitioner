import { describe, it, expect } from "vitest";

import { buildSteps } from "../viz";
import { binarySearchTreeInorder } from "../exercise.js";

const input = { values: [5, 3, 7, 1, 4] };

describe("binary-tree viz (T-VIZEX-BST, T-INT-BST)", () => {
  it("T-VIZEX-BST: produces one step per (distinct) node", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBe(input.values.length);
  });

  it("T-INT-BST: viz result equals the binarySearchTreeInorder result", () => {
    expect(buildSteps(input).result).toEqual(binarySearchTreeInorder(input.values));
  });
});
