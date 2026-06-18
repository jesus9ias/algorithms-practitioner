import { describe, it, expect } from "vitest";

import { computeProgress } from "../progress";

/**
 * T-PROG-* — Progress bar logic.
 * computeProgress(learned: readonly string[], total: number)
 *   => { percent: number; label: string }
 */
describe("computeProgress (T-PROG)", () => {
  it("T-PROG-01: 0 learned, 3 total -> 0%", () => {
    expect(computeProgress([], 3)).toEqual({ percent: 0, label: "0 / 3" });
  });

  it("T-PROG-02: 2 learned, 3 total -> 67%", () => {
    expect(computeProgress(["a", "b"], 3)).toEqual({ percent: 67, label: "2 / 3" });
  });

  it("T-PROG-03: all learned -> 100%", () => {
    expect(computeProgress(["a", "b", "c"], 3)).toEqual({ percent: 100, label: "3 / 3" });
  });
});
