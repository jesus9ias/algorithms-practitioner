import { describe, it, expect } from "vitest";

import { filterExercises, searchExercises } from "../filters";
import { ExerciseCategory, ExerciseLevel, LearnedStatus } from "../constants";
import exercisesData from "../../data/exercises.json";
import type { Exercise } from "../types";

const exercises = exercisesData as unknown as Exercise[];

const ids = (list: Exercise[]): string[] => list.map((e) => e.id).sort();

describe("filterExercises (T-FILT)", () => {
  it("T-FILT-01: filter by single category returns correct subset", () => {
    const result = filterExercises(exercises, {
      categories: [ExerciseCategory.SEARCHING],
    });
    expect(ids(result)).toEqual(["binary-search", "binary-search-rotated"]);
  });

  it("T-FILT-02: filter by level returns correct subset", () => {
    const result = filterExercises(exercises, { levels: [ExerciseLevel.EASY] });
    expect(ids(result)).toEqual(["binary-search", "bubble-sort", "climbing-stairs", "count-bits", "date-difference", "fibonacci", "inorder-traversal", "linked-list", "palindrome-check", "remove-duplicates-dll", "remove-duplicates-sll", "reverse-string", "running-average", "single-number", "two-sum", "valid-parentheses"]);
  });

  it("T-FILT-03: filter by learned returns only learned IDs", () => {
    const result = filterExercises(exercises, {
      status: LearnedStatus.LEARNED,
      learnedIds: ["binary-search"],
    });
    expect(ids(result)).toEqual(["binary-search"]);
  });

  it("T-FILT-04: combined category + level filter", () => {
    const result = filterExercises(exercises, {
      categories: [ExerciseCategory.TREES],
      levels: [ExerciseLevel.MEDIUM],
    });
    expect(ids(result)).toEqual(["binary-tree", "level-order-traversal"]);
  });

  it("T-FILT-05: no-match filter returns empty array", () => {
    const result = filterExercises(exercises, {
      categories: [ExerciseCategory.DATES],
      levels: [ExerciseLevel.HARD],
    });
    expect(result).toEqual([]);
  });
});

describe("searchExercises (T-SEARCH)", () => {
  it("T-SEARCH-01: search matches name substring", () => {
    const result = searchExercises(exercises, "binary", "en");
    expect(ids(result)).toEqual(["binary-search", "binary-search-rotated", "binary-tree", "count-bits", "inorder-traversal", "level-order-traversal", "min-heap"]);
  });

  it("T-SEARCH-02: search is case-insensitive", () => {
    const result = searchExercises(exercises, "LINKED", "en");
    expect(ids(result)).toEqual(["linked-list", "remove-duplicates-cll", "remove-duplicates-dll", "remove-duplicates-sll"]);
  });

  it("T-SEARCH-03: search returns empty on no match", () => {
    const result = searchExercises(exercises, "xyznonexistent", "en");
    expect(result).toEqual([]);
  });
});
