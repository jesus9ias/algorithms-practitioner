/**
 * Domain enums. Per spec.md ("No magic numbers"): every categorical value the
 * application reasons about is declared here, never inlined as a string literal.
 */

/** Exercise category. Values are persisted in exercises.json. */
export enum ExerciseCategory {
  GENERAL = "GENERAL",
  TEXT = "TEXT",
  DATES = "DATES",
  LISTS = "LISTS",
  MATRICES = "MATRICES",
  TREES = "TREES",
  GRAPHS = "GRAPHS",
  SORTING = "SORTING",
  SEARCHING = "SEARCHING",
  HASHING = "HASHING",
  DYNAMIC_PROGRAMMING = "DYNAMIC_PROGRAMMING",
  RECURSION = "RECURSION",
  BIT_MANIPULATION = "BIT_MANIPULATION",
  HEAPS = "HEAPS",
}

/**
 * Kind of input/output an exercise works with. Declared so the shared infra can
 * branch on it instead of inlining string literals. Defaults to `NUMBERS` when
 * an exercise omits it, keeping the original integer-array model unchanged.
 */
export enum InputKind {
  NUMBERS = "NUMBERS",
  STRING = "STRING",
  BRACKETS = "BRACKETS",
  MATRIX = "MATRIX",
  TEXT = "TEXT",
  SCALAR = "SCALAR",
}

/** Exercise difficulty (LeetCode-style, 3 tiers). */
export enum ExerciseLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

/** Color theme. Applied via the `data-theme` attribute on <html>. */
export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

/** UI language. */
export enum Language {
  EN = "en",
  ES = "es",
}

/** Active code view on the exercise page. */
export enum CodeMode {
  JS = "js",
  PSEUDO = "pseudo",
}

/** Home page exercise layout. */
export enum ViewMode {
  GRID = "grid",
  LIST = "list",
}

/** Learned-status filter option on the home page. */
export enum LearnedStatus {
  ALL = "all",
  LEARNED = "learned",
  UNLEARNED = "unlearned",
}
