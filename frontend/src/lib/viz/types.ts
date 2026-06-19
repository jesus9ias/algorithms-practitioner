/** Normalized input handed to every exercise visualization. */
export interface VizInput {
  readonly values: readonly number[];
  readonly target?: number;
}

/**
 * Language-neutral description of a single step, resolved to text by the host.
 * `key` selects a template from the exercise's `stepMessages` map in
 * `exercises.json`; `params` are interpolated into it (e.g. `{ mid: 5 }`).
 */
export interface StepDescriptor {
  readonly key: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

/**
 * Shared contract every per-exercise visualization implements. The viz owns its
 * own step model internally; the host only needs the step count, a way to render
 * a given step into an <svg>, and a per-step descriptor for the detail log.
 * Rendering uses safe DOM construction only.
 */
export interface ExerciseViz {
  readonly totalSteps: number;
  /** The final result of the exercise function for the current input. */
  readonly result: number | readonly number[];
  renderStep(svg: SVGSVGElement, stepIndex: number): void;
  /**
   * Descriptor for the step's detail-log row, or `null` when the step has no row
   * (e.g. the initial pre-algorithm state at step 0). Pure: depends only on the
   * step index and the viz's own step model.
   */
  describeStep(stepIndex: number): StepDescriptor | null;
}

/** Factory each exercise exports to build its viz from an input. */
export type VizFactory = (input: VizInput) => ExerciseViz;
