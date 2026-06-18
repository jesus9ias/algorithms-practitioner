import type { Exercise } from "../lib/types";
import exercisesJson from "./exercises.json";

/** Typed, read-only view of the exercise registry. */
export const exercises: readonly Exercise[] = exercisesJson as unknown as Exercise[];

/** Set of all known exercise IDs, used for validation and routing. */
export const exerciseIds: ReadonlySet<string> = new Set(exercises.map((e) => e.id));

/** Looks up an exercise by its slug. Returns undefined for unknown slugs. */
export function findExerciseBySlug(slug: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.slug === slug);
}
