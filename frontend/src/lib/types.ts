import type {
  ExerciseCategory,
  ExerciseLevel,
  InputKind,
  Theme,
  Language,
  ViewMode,
} from "./constants";

/** Discriminated result type used by all validation and parsing functions. */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

/** A user-visible string available in both supported languages. */
export interface LocalizedText {
  readonly en: string;
  readonly es: string;
}

/** A reference link attached to an exercise. */
export interface ExerciseLink {
  readonly url: string;
  readonly label: LocalizedText;
}

/** A single entry in the exercise registry (exercises.json). */
export interface Exercise {
  readonly id: string;
  readonly slug: string;
  /**
   * Four-part classification code: TYPE–STRUCT–OBJ–VAR.
   * Internal only — not shown to the user. See spec.md § Serial Code Nomenclature
   * for the full table of allowed values. Not guaranteed unique across exercises;
   * the `id` remains the unique key. Duplicates must be flagged and reviewed.
   */
  readonly serialCode: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly category: ExerciseCategory;
  readonly level: ExerciseLevel;
  readonly isNew: boolean;
  readonly addedAt: string;
  readonly links: readonly ExerciseLink[];
  readonly codeFile: string;
  /** Path to the plain-text pseudo-code file, relative to `/src/exercises/`. Optional. */
  readonly pseudoFile?: string;
  /**
   * Kind of input this exercise consumes. Optional; absent means `NUMBERS`
   * (an integer-array exercise). Text exercises set `STRING`.
   */
  readonly inputKind?: InputKind;
  /**
   * Integer-array seed for numeric exercises, raw text for `STRING`/`BRACKETS`/
   * `TEXT` ones, a 2D integer matrix for `MATRIX` ones, or a bare integer for
   * `SCALAR` ones.
   */
  readonly defaultInput: readonly number[] | string | readonly (readonly number[])[] | number;
  readonly defaultTarget?: number;
  /**
   * Bilingual templates for the step-detail log, keyed by the `key` a viz's
   * `describeStep` returns. Values may contain `{placeholder}` tokens filled
   * from the descriptor's `params`.
   */
  readonly stepMessages: Readonly<Record<string, LocalizedText>>;
}

/** A user-saved custom input for an exercise. */
export interface SavedInput {
  readonly label: string;
  /**
   * Integer array for numeric exercises, raw text for `STRING`/`BRACKETS`/`TEXT`
   * ones, a 2D integer matrix for `MATRIX` ones, or a bare integer for `SCALAR`
   * ones.
   */
  readonly value: readonly number[] | string | readonly (readonly number[])[] | number;
  readonly target?: number;
}

/** User preferences persisted under StorageKey.PREFS. */
export interface Prefs {
  readonly theme: Theme;
  readonly language: Language;
  readonly viewMode: ViewMode;
}

/** Full exportable/importable application state. */
export interface AppState {
  readonly algo_learned: readonly string[];
  readonly algo_inputs: Readonly<Record<string, readonly SavedInput[]>>;
  readonly algo_prefs: Prefs;
  /**
   * Per-exercise code-block expanded state (exercise ID → expanded). Optional:
   * absent on import means older files predating the feature, and an absent
   * per-exercise entry means the block is collapsed (the default).
   */
  readonly algo_code_open?: Readonly<Record<string, boolean>>;
}

/** Helpers for building Result values. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error };
}
