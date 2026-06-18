import { describe, it, expect } from "vitest";

import { createStepEngine } from "../stepEngine";

const TOTAL_STEPS = 5;

/**
 * T-VIZ-* — Generic step engine.
 * createStepEngine(totalSteps: number) => {
 *   currentStep, totalSteps, stepForward(), stepBack(), reset()
 * }
 * Steps are clamped to [0, totalSteps - 1].
 */
describe("createStepEngine (T-VIZ)", () => {
  it("T-VIZ-01: step engine initializes at step 0", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    expect(engine.currentStep).toBe(0);
  });

  it("T-VIZ-02: step forward increments step", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    engine.stepForward();
    expect(engine.currentStep).toBe(1);
  });

  it("T-VIZ-03: step forward at last step does not overflow", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    for (let i = 0; i < TOTAL_STEPS + 2; i += 1) {
      engine.stepForward();
    }
    expect(engine.currentStep).toBe(TOTAL_STEPS - 1);
  });

  it("T-VIZ-04: step back decrements step", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    engine.stepForward();
    engine.stepForward();
    engine.stepBack();
    expect(engine.currentStep).toBe(1);
  });

  it("T-VIZ-05: step back at step 0 does not underflow", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    engine.stepBack();
    expect(engine.currentStep).toBe(0);
  });

  it("T-VIZ-06: reset returns to step 0", () => {
    const engine = createStepEngine(TOTAL_STEPS);
    engine.stepForward();
    engine.stepForward();
    engine.stepForward();
    engine.reset();
    expect(engine.currentStep).toBe(0);
  });
});
