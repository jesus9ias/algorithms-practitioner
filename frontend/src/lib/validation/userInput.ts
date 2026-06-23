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
 * Parses a raw string into a validated rectangular matrix of integers, used by
 * `MATRIX`-kind exercises (e.g. `matrix-spiral`).
 *
 * Accepts only a JSON array of arrays whose elements are all safe integers. The
 * matrix must be non-empty, every row must be non-empty and all rows must share
 * the same length (rectangular N×M), and the total cell count must stay within
 * `MAX_INPUT_LENGTH`. Anything else (objects, jagged rows, floats, non-JSON
 * payloads such as script injection) is rejected. No `eval`/`Function` is used —
 * parsing goes exclusively through `JSON.parse`.
 */
export function parseIntegerMatrix(raw: string): Result<number[][]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Input is not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    return err("Input must be a 2D array.");
  }
  if (parsed.length < MIN_INPUT_LENGTH) {
    return err("Matrix must have at least one row.");
  }

  let width: number | null = null;
  let cells = 0;
  for (const row of parsed) {
    if (!Array.isArray(row)) {
      return err("Each matrix row must be an array.");
    }
    if (row.length < MIN_INPUT_LENGTH) {
      return err("Matrix rows must not be empty.");
    }
    if (width === null) {
      width = row.length;
    } else if (row.length !== width) {
      return err("All matrix rows must have the same length.");
    }
    for (const element of row) {
      if (typeof element !== "number" || !Number.isInteger(element)) {
        return err("Matrix must contain integers only.");
      }
    }
    cells += row.length;
  }

  if (cells > MAX_INPUT_LENGTH) {
    return err(`Matrix must not exceed ${MAX_INPUT_LENGTH} elements.`);
  }

  return ok(parsed as number[][]);
}

/**
 * Validates a raw string for `STRING`-kind exercises in the `n[substring]`
 * run-length format used by `decode-string`. Accepts only ASCII letters,
 * digits and square brackets; the brackets must be balanced, every `[` must be
 * preceded by at least one digit (a repeat count), and digits may appear only
 * as such a count. An empty string is valid (decodes to `""`). No `eval` is
 * used — parsing is a single character scan.
 */
export function parseEncodedString(raw: string): Result<string> {
  if (raw.length > MAX_INPUT_LENGTH) {
    return err(`Input must not exceed ${MAX_INPUT_LENGTH} characters.`);
  }

  let depth = 0;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    const isLetter = (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
    const isDigit = ch >= "0" && ch <= "9";

    if (isLetter) {
      continue;
    }
    if (isDigit) {
      // A run of digits is only meaningful as a repeat count: it must be
      // followed (after the rest of the digits) by an opening bracket.
      let j = i;
      while (j < raw.length && raw[j] >= "0" && raw[j] <= "9") {
        j += 1;
      }
      if (raw[j] !== "[") {
        return err("Digits must be a repeat count directly before '['.");
      }
      i = j - 1; // skip the consumed digits; the loop will land on '['
      continue;
    }
    if (ch === "[") {
      // The char before '[' must be a digit (the count we just validated).
      if (i === 0 || raw[i - 1] < "0" || raw[i - 1] > "9") {
        return err("Every '[' must be preceded by a repeat count.");
      }
      depth += 1;
      continue;
    }
    if (ch === "]") {
      if (depth === 0) {
        return err("Unbalanced ']' in input.");
      }
      depth -= 1;
      continue;
    }
    return err("Input may contain only letters, digits and square brackets.");
  }

  if (depth !== 0) {
    return err("Unbalanced '[' in input.");
  }

  return ok(raw);
}

/**
 * Validates a raw string for `BRACKETS`-kind exercises (bracket-balance checks
 * such as `valid-parentheses`). Accepts ASCII letters, digits, spaces and the
 * six bracket characters `()[]{}` in any arrangement — the brackets need NOT be
 * balanced, since deciding that is the exercise itself. Any other character
 * (e.g. `<`, `>`, quotes) is rejected to keep the input on a safe whitelist. An
 * empty string is valid. No `eval` is used — parsing is a single character scan.
 */
export function parseBracketString(raw: string): Result<string> {
  if (raw.length > MAX_INPUT_LENGTH) {
    return err(`Input must not exceed ${MAX_INPUT_LENGTH} characters.`);
  }

  const BRACKETS = "()[]{}";
  for (const ch of raw) {
    const isLetter = (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
    const isDigit = ch >= "0" && ch <= "9";
    const isSpace = ch === " ";
    if (isLetter || isDigit || isSpace || BRACKETS.includes(ch)) {
      continue;
    }
    return err("Input may contain only letters, digits, spaces and brackets.");
  }

  return ok(raw);
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
