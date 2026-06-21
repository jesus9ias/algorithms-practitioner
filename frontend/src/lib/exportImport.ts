import { StorageKey } from "./constants";
import { ok, err } from "./types";
import type { Result, AppState } from "./types";
import {
  validateLearned,
  validatePrefs,
  validateInputs,
  validateCodeOpen,
} from "./validation/localStorage";

/**
 * Serializes the full application state to a JSON string for download. The
 * `algo_code_open` key is included only when present; `JSON.stringify` drops it
 * when undefined, keeping exports clean for callers that don't track it.
 */
export function exportState(state: AppState): string {
  const payload = {
    [StorageKey.LEARNED]: state.algo_learned,
    [StorageKey.INPUTS]: state.algo_inputs,
    [StorageKey.PREFS]: state.algo_prefs,
    [StorageKey.CODE_OPEN]: state.algo_code_open,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parses and fully validates an imported JSON string. Every key must be present
 * and well-typed; otherwise an error result is returned and no partial state is
 * produced (the caller applies state only on `ok`).
 */
export function importState(raw: string): Result<AppState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Import file is not valid JSON.");
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return err("Import file must be an object.");
  }
  const record = parsed as Record<string, unknown>;

  if (
    !(StorageKey.LEARNED in record) ||
    !(StorageKey.INPUTS in record) ||
    !(StorageKey.PREFS in record)
  ) {
    return err("Import file is missing required keys.");
  }

  const learned = validateLearned(record[StorageKey.LEARNED]);
  if (!learned.ok) {
    return err(learned.error);
  }

  const inputs = validateInputs(record[StorageKey.INPUTS]);
  if (!inputs.ok) {
    return err(inputs.error);
  }

  const prefs = validatePrefs(record[StorageKey.PREFS]);
  if (!prefs.ok) {
    return err(prefs.error);
  }

  // `algo_code_open` is optional for backward compatibility: files produced
  // before the code-block toggle existed simply omit it. When present, it must
  // validate like every other key.
  let codeOpen: Record<string, boolean> | undefined;
  if (StorageKey.CODE_OPEN in record) {
    const result = validateCodeOpen(record[StorageKey.CODE_OPEN]);
    if (!result.ok) {
      return err(result.error);
    }
    codeOpen = result.value;
  }

  return ok({
    algo_learned: learned.value,
    algo_inputs: inputs.value,
    algo_prefs: prefs.value,
    ...(codeOpen !== undefined ? { algo_code_open: codeOpen } : {}),
  });
}
