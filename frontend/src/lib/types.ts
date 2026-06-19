import type {
  ExerciseCategory,
  ExerciseLevel,
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
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly category: ExerciseCategory;
  readonly level: ExerciseLevel;
  readonly isNew: boolean;
  readonly addedAt: string;
  readonly links: readonly ExerciseLink[];
  readonly codeFile: string;
  readonly defaultInput: readonly number[];
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
  readonly value: readonly number[];
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
}

/** Helpers for building Result values. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error };
}
