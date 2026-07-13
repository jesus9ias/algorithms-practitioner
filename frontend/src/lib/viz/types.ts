/** Normalized input handed to every exercise visualization. */
export interface VizInput {
  /** Integer values for numeric exercises (empty for text/matrix exercises). */
  readonly values: readonly number[];
  readonly target?: number;
  /** Raw text for `STRING`/`BRACKETS`-kind exercises; undefined otherwise. */
  readonly text?: string;
  /** Rectangular integer matrix for `MATRIX`-kind exercises; undefined otherwise. */
  readonly matrix?: readonly (readonly number[])[];
  /** Single integer for `SCALAR`-kind exercises; undefined otherwise. */
  readonly scalar?: number;
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
 * 1-based source line numbers that "execute" at a given step, per code mode.
 * Lines may be non-contiguous: a step marks every line involved in it (it
 * answers "what happens in this step", not a single debugger breakpoint).
 * `pseudo` is empty when the exercise has no pseudo-code file.
 */
export interface CodeLines {
  readonly js: readonly number[];
  readonly pseudo: readonly number[];
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
  readonly result: number | readonly number[] | readonly (readonly number[])[] | string | boolean;
  renderStep(svg: SVGSVGElement, stepIndex: number): void;
  /**
   * Descriptor for the step's detail-log row, or `null` when the step has no row
   * (e.g. the initial pre-algorithm state at step 0). Pure: depends only on the
   * step index and the viz's own step model.
   */
  describeStep(stepIndex: number): StepDescriptor | null;
  /**
   * 1-based source lines that "execute" at the given step, per code mode, or
   * `null` when the step highlights nothing (e.g. the initial state at step 0).
   * The host toggles the highlight on the matching code lines. Pure — depends
   * only on the step index. Lines are kept in lockstep with exercise.js and
   * exercise.pseudo and may be non-contiguous.
   */
  codeLines(stepIndex: number): CodeLines | null;
}

/** Factory each exercise exports to build its viz from an input. */
export type VizFactory = (input: VizInput) => ExerciseViz;
