import { describe, it, expect } from "vitest";

import { exportState, importState } from "../exportImport";
import { StorageKey } from "../constants";
import type { AppState } from "../types";

const validState: AppState = {
  algo_learned: ["binary-search"],
  algo_inputs: {},
  algo_prefs: { theme: "dark", language: "en", viewMode: "grid" },
};

describe("exportState (T-EXP)", () => {
  it("T-EXP-01: export serializes all state keys", () => {
    const json = exportState(validState);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty(StorageKey.LEARNED);
    expect(parsed).toHaveProperty(StorageKey.INPUTS);
    expect(parsed).toHaveProperty(StorageKey.PREFS);
  });
});

describe("importState (T-IMP)", () => {
  it("T-IMP-01: valid import restores all state", () => {
    const json = exportState(validState);
    const result = importState(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(validState);
    }
  });

  it("T-IMP-02: import with missing key fails validation", () => {
    const json = JSON.stringify({
      [StorageKey.LEARNED]: ["binary-search"],
      [StorageKey.INPUTS]: {},
      // algo_prefs missing on purpose
    });
    const result = importState(json);
    expect(result.ok).toBe(false);
  });

  it("T-IMP-03: import with wrong types fails", () => {
    const json = JSON.stringify({
      [StorageKey.LEARNED]: 123,
      [StorageKey.INPUTS]: {},
      [StorageKey.PREFS]: { theme: "dark", language: "en", viewMode: "grid" },
    });
    const result = importState(json);
    expect(result.ok).toBe(false);
  });
});
