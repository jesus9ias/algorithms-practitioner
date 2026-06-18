import { ExerciseCategory, ExerciseLevel } from "./constants";

const CATEGORY_KEYS: Record<ExerciseCategory, string> = {
  [ExerciseCategory.GENERAL]: "categories.general",
  [ExerciseCategory.TEXT]: "categories.text",
  [ExerciseCategory.DATES]: "categories.dates",
  [ExerciseCategory.LISTS]: "categories.lists",
  [ExerciseCategory.MATRICES]: "categories.matrices",
  [ExerciseCategory.TREES]: "categories.trees",
  [ExerciseCategory.GRAPHS]: "categories.graphs",
  [ExerciseCategory.SORTING]: "categories.sorting",
  [ExerciseCategory.SEARCHING]: "categories.searching",
  [ExerciseCategory.HASHING]: "categories.hashing",
  [ExerciseCategory.DYNAMIC_PROGRAMMING]: "categories.dynamicProgramming",
  [ExerciseCategory.RECURSION]: "categories.recursion",
  [ExerciseCategory.BIT_MANIPULATION]: "categories.bitManipulation",
  [ExerciseCategory.HEAPS]: "categories.heaps",
};

const LEVEL_KEYS: Record<ExerciseLevel, string> = {
  [ExerciseLevel.EASY]: "levels.easy",
  [ExerciseLevel.MEDIUM]: "levels.medium",
  [ExerciseLevel.HARD]: "levels.hard",
};

export function categoryKey(category: ExerciseCategory): string {
  return CATEGORY_KEYS[category];
}

export function levelKey(level: ExerciseLevel): string {
  return LEVEL_KEYS[level];
}
