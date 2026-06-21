import { StorageKey, Theme, Language, ViewMode } from "../constants";
import type { Prefs, SavedInput, Result } from "../types";
import {
  validateLearned,
  validatePrefs,
  validateInputs,
  validateCodeOpen,
  parseStored,
} from "../validation/localStorage";

/**
 * Thin, validated wrappers around localStorage. Every read goes through a
 * validator; invalid/tampered data is discarded and the default returned, with
 * the caller able to surface a visible warning via the `onReset` callback.
 *
 * State management is intentionally separated from UI: these functions only
 * read/write/reset persisted values and never touch the DOM.
 */

export const DEFAULT_PREFS: Prefs = {
  theme: Theme.LIGHT,
  language: Language.EN,
  viewMode: ViewMode.GRID,
};

type ResetListener = (key: StorageKey) => void;

function safeGetItem(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable or quota exceeded — fail silently for writes */
  }
}

function readValidated<T>(
  key: StorageKey,
  validate: (value: unknown) => Result<T>,
  fallback: T,
  onReset?: ResetListener
): T {
  const raw = safeGetItem(key);
  if (raw === null) {
    return fallback;
  }
  const result = parseStored(raw, validate);
  if (result.ok) {
    return result.value;
  }
  // Invalid/tampered data: reset the key and notify.
  resetKey(key);
  onReset?.(key);
  return fallback;
}

export function resetKey(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readLearned(onReset?: ResetListener): string[] {
  return readValidated(StorageKey.LEARNED, validateLearned, [], onReset);
}

export function writeLearned(ids: readonly string[]): void {
  safeSetItem(StorageKey.LEARNED, JSON.stringify(ids));
}

export function readPrefs(onReset?: ResetListener): Prefs {
  return readValidated(StorageKey.PREFS, validatePrefs, DEFAULT_PREFS, onReset);
}

export function writePrefs(prefs: Prefs): void {
  safeSetItem(StorageKey.PREFS, JSON.stringify(prefs));
}

export function readInputs(onReset?: ResetListener): Record<string, SavedInput[]> {
  return readValidated(StorageKey.INPUTS, validateInputs, {}, onReset);
}

export function writeInputs(inputs: Record<string, readonly SavedInput[]>): void {
  safeSetItem(StorageKey.INPUTS, JSON.stringify(inputs));
}

export function readCodeOpen(onReset?: ResetListener): Record<string, boolean> {
  return readValidated(StorageKey.CODE_OPEN, validateCodeOpen, {}, onReset);
}

export function writeCodeOpen(state: Record<string, boolean>): void {
  safeSetItem(StorageKey.CODE_OPEN, JSON.stringify(state));
}
