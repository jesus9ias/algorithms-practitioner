/** Normalized input handed to every exercise visualization. */
export interface VizInput {
  readonly values: readonly number[];
  readonly target?: number;
}

/**
 * Shared contract every per-exercise visualization implements. The viz owns its
 * own step model internally; the host only needs the step count and a way to
 * render a given step into an <svg>. Rendering uses safe DOM construction only.
 */
export interface ExerciseViz {
  readonly totalSteps: number;
  /** The final result of the exercise function for the current input. */
  readonly result: number | readonly number[];
  renderStep(svg: SVGSVGElement, stepIndex: number): void;
  /** Optional human-readable caption key/text for the given step. */
  caption?(stepIndex: number): string;
}

/** Factory each exercise exports to build its viz from an input. */
export type VizFactory = (input: VizInput) => ExerciseViz;
