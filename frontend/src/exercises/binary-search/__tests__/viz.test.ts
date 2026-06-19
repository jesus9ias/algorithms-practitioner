import { describe, it, expect } from "vitest";

import { buildSteps, createViz } from "../viz";
import { binarySearch } from "../exercise.js";

const input = { values: [1, 3, 5, 7, 9], target: 7 };

describe("binary-search viz (T-VIZEX-BS, T-INT-BS)", () => {
  it("T-VIZEX-BS: produces a non-empty trace ending on the found index", () => {
    const { steps } = buildSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.found).toBe(true);
    expect(last.mid).toBe(3);
  });

  it("T-INT-BS: viz result equals the binarySearch result", () => {
    expect(buildSteps(input).result).toBe(binarySearch(input.values, input.target));
  });
});

describe("binary-search describeStep (T-DESC-BS)", () => {
  const viz = createViz(input);

  it("T-DESC-BS: step 0 has no log row", () => {
    expect(viz.describeStep(0)).toBeNull();
  });

  it("T-DESC-BS: first step compares the middle value to the target", () => {
    expect(viz.describeStep(1)).toEqual({
      key: "compareGreater",
      params: { mid: 5, target: 7 },
    });
  });

  it("T-DESC-BS: last step reports the found index", () => {
    expect(viz.describeStep(viz.totalSteps - 1)).toEqual({
      key: "found",
      params: { mid: 7, index: 3 },
    });
  });
});
