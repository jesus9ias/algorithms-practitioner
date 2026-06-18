import { FIRST_STEP_INDEX } from "../constants";

/**
 * Generic step engine consumed by each exercise's visualization module.
 * Tracks a current step clamped to [0, totalSteps - 1]. It holds no rendering
 * logic — state only — keeping the state and UI layers separate.
 */
export interface StepEngine {
  readonly currentStep: number;
  readonly totalSteps: number;
  /** Advances one step, clamped at the last step. Returns the new step. */
  stepForward(): number;
  /** Goes back one step, clamped at 0. Returns the new step. */
  stepBack(): number;
  /** Jumps to a specific step (clamped). Returns the new step. */
  goTo(step: number): number;
  /** Returns to the first step. */
  reset(): number;
}

function clamp(step: number, totalSteps: number): number {
  const lastIndex = Math.max(FIRST_STEP_INDEX, totalSteps - 1);
  if (step < FIRST_STEP_INDEX) {
    return FIRST_STEP_INDEX;
  }
  if (step > lastIndex) {
    return lastIndex;
  }
  return step;
}

export function createStepEngine(totalSteps: number): StepEngine {
  let current = FIRST_STEP_INDEX;

  return {
    get currentStep(): number {
      return current;
    },
    get totalSteps(): number {
      return totalSteps;
    },
    stepForward(): number {
      current = clamp(current + 1, totalSteps);
      return current;
    },
    stepBack(): number {
      current = clamp(current - 1, totalSteps);
      return current;
    },
    goTo(step: number): number {
      current = clamp(step, totalSteps);
      return current;
    },
    reset(): number {
      current = FIRST_STEP_INDEX;
      return current;
    },
  };
}
