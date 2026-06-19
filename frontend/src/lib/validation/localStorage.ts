import { Theme, Language, ViewMode } from "../constants";
import { ok, err } from "../types";
import type { Result, Prefs, SavedInput } from "../types";
import { exerciseIds } from "../../data/exercises";
import { MAX_INPUT_LENGTH, MIN_INPUT_LENGTH } from "../constants";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}

/**
 * Validates the `algo_learned` value: must be an array of known exercise IDs.
 */
export function validateLearned(value: unknown): Result<string[]> {
  if (!isStringArray(value)) {
    return err("Learned list must be an array of strings.");
  }
  for (const id of value) {
    if (!exerciseIds.has(id)) {
      return err(`Unknown exercise ID in learned list: ${id}`);
    }
  }
  return ok([...value]);
}

/** Validates the `algo_prefs` value against the Theme/Language/ViewMode enums. */
export function validatePrefs(value: unknown): Result<Prefs> {
  if (value === null || typeof value !== "object") {
    return err("Preferences must be an object.");
  }
  const record = value as Record<string, unknown>;

  if (!isEnumValue(Theme, record.theme)) {
    return err("Invalid theme preference.");
  }
  if (!isEnumValue(Language, record.language)) {
    return err("Invalid language preference.");
  }
  if (!isEnumValue(ViewMode, record.viewMode)) {
    return err("Invalid view mode preference.");
  }

  return ok({
    theme: record.theme,
    language: record.language,
    viewMode: record.viewMode,
  });
}

function isValidSavedInput(value: unknown): value is SavedInput {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.label !== "string" || record.label.length === 0) {
    return false;
  }
  // Text exercises persist their input as a bounded string; numeric exercises
  // persist a bounded array of integers.
  if (typeof record.value === "string") {
    if (record.value.length > MAX_INPUT_LENGTH) {
      return false;
    }
  } else if (Array.isArray(record.value)) {
    if (record.value.length < MIN_INPUT_LENGTH || record.value.length > MAX_INPUT_LENGTH) {
      return false;
    }
    if (!record.value.every((n) => typeof n === "number" && Number.isInteger(n))) {
      return false;
    }
  } else {
    return false;
  }
  if (record.target !== undefined && !Number.isInteger(record.target)) {
    return false;
  }
  return true;
}

/**
 * Validates the `algo_inputs` value: a record mapping known exercise IDs to
 * arrays of saved inputs.
 */
export function validateInputs(
  value: unknown
): Result<Record<string, SavedInput[]>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return err("Saved inputs must be an object.");
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, SavedInput[]> = {};

  for (const [id, list] of Object.entries(record)) {
    if (!exerciseIds.has(id)) {
      return err(`Unknown exercise ID in saved inputs: ${id}`);
    }
    if (!Array.isArray(list) || !list.every(isValidSavedInput)) {
      return err(`Invalid saved inputs for exercise: ${id}`);
    }
    out[id] = list as SavedInput[];
  }

  return ok(out);
}

/**
 * Parses a raw stored JSON string and validates it with the given validator.
 * Returns an error result on malformed JSON (T-LS-07) so callers can reset the
 * key to its default value.
 */
export function parseStored<T>(
  raw: string | null,
  validate: (value: unknown) => Result<T>
): Result<T> {
  if (raw === null) {
    return err("No stored value.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Stored value is not valid JSON.");
  }
  return validate(parsed);
}
