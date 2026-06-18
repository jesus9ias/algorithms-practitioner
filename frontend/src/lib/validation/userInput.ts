import { MAX_INPUT_LENGTH, MIN_INPUT_LENGTH } from "../constants";
import { ok, err } from "../types";
import type { Result } from "../types";

/**
 * Parses a raw string into a validated array of integers.
 *
 * Accepts only a JSON array whose elements are all safe integers. Rejects
 * anything else (objects, floats, empty arrays, oversized arrays, and any
 * non-JSON payload such as script injection attempts). No `eval`/`Function`
 * is used — parsing goes exclusively through `JSON.parse`.
 */
export function parseIntegerArray(raw: string): Result<number[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Input is not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    return err("Input must be an array.");
  }

  if (parsed.length < MIN_INPUT_LENGTH) {
    return err("Input array must not be empty.");
  }

  if (parsed.length > MAX_INPUT_LENGTH) {
    return err(`Input array must not exceed ${MAX_INPUT_LENGTH} elements.`);
  }

  for (const element of parsed) {
    if (typeof element !== "number" || !Number.isInteger(element)) {
      return err("Input array must contain integers only.");
    }
  }

  return ok(parsed as number[]);
}

/**
 * Parses an optional integer target (used by search-style exercises).
 * An empty string yields `undefined` (no target). Any non-integer is rejected.
 */
export function parseIntegerTarget(raw: string): Result<number | undefined> {
  if (raw.trim() === "") {
    return ok(undefined);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Target is not valid.");
  }

  if (typeof parsed !== "number" || !Number.isInteger(parsed)) {
    return err("Target must be an integer.");
  }

  return ok(parsed);
}
