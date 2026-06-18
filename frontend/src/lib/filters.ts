import { ExerciseCategory, ExerciseLevel, LearnedStatus } from "./constants";
import type { Exercise } from "./types";
import { localize } from "../i18n";
import type { LanguageCode } from "../i18n";

/** Criteria for filtering the exercise list. All fields are additive (AND). */
export interface FilterCriteria {
  readonly categories?: readonly ExerciseCategory[];
  readonly levels?: readonly ExerciseLevel[];
  readonly status?: LearnedStatus;
  readonly learnedIds?: readonly string[];
  readonly newOnly?: boolean;
}

/**
 * Filters exercises by category, level, learned status, and the "new" flag.
 * Combined criteria use AND logic. Empty/absent criteria are ignored.
 */
export function filterExercises(
  exercises: readonly Exercise[],
  criteria: FilterCriteria
): Exercise[] {
  const learned = new Set(criteria.learnedIds ?? []);

  return exercises.filter((exercise) => {
    if (criteria.categories && criteria.categories.length > 0) {
      if (!criteria.categories.includes(exercise.category)) {
        return false;
      }
    }

    if (criteria.levels && criteria.levels.length > 0) {
      if (!criteria.levels.includes(exercise.level)) {
        return false;
      }
    }

    if (criteria.status === LearnedStatus.LEARNED && !learned.has(exercise.id)) {
      return false;
    }
    if (criteria.status === LearnedStatus.UNLEARNED && learned.has(exercise.id)) {
      return false;
    }

    if (criteria.newOnly === true && !exercise.isNew) {
      return false;
    }

    return true;
  });
}

/** Lowercases and strips diacritics for case- and accent-insensitive search. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Searches exercises by their resolved (i18n) name and description.
 * Case-insensitive and diacritic-insensitive. An empty query returns all.
 */
export function searchExercises(
  exercises: readonly Exercise[],
  query: string,
  lang: LanguageCode
): Exercise[] {
  const needle = normalize(query.trim());
  if (needle === "") {
    return [...exercises];
  }

  return exercises.filter((exercise) => {
    const name = normalize(localize(exercise.name, lang));
    const description = normalize(localize(exercise.description, lang));
    return name.includes(needle) || description.includes(needle);
  });
}
