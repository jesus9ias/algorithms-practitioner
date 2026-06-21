import { describe, it, expect } from "vitest";

import {
  validateLearned,
  validatePrefs,
  validateCodeOpen,
  parseStored,
} from "../localStorage";

/**
 * T-LS-* — localStorage validation.
 * validateLearned(value: unknown): Result<string[]>
 * validatePrefs(value: unknown): Result<Prefs>
 * parseStored<T>(raw: string | null, validate): Result<T>
 */
describe("validateLearned (T-LS-01..04)", () => {
  it("T-LS-01: valid algo_learned passes validation", () => {
    const result = validateLearned(["binary-search"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(["binary-search"]);
    }
  });

  it("T-LS-02: non-array algo_learned fails validation", () => {
    const result = validateLearned("binary-search");
    expect(result.ok).toBe(false);
  });

  it("T-LS-03: array with non-string values fails", () => {
    const result = validateLearned([1, 2, 3]);
    expect(result.ok).toBe(false);
  });

  it("T-LS-04: unknown exercise IDs in learned list fail", () => {
    const result = validateLearned(["not-a-real-id"]);
    expect(result.ok).toBe(false);
  });
});

describe("validatePrefs (T-LS-05..06)", () => {
  it("T-LS-05: valid algo_prefs passes validation", () => {
    const result = validatePrefs({ theme: "dark", language: "en", viewMode: "grid" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ theme: "dark", language: "en", viewMode: "grid" });
    }
  });

  it("T-LS-06: algo_prefs with invalid theme value fails", () => {
    const result = validatePrefs({ theme: "blue", language: "en", viewMode: "grid" });
    expect(result.ok).toBe(false);
  });
});

describe("validateCodeOpen (T-LS-08..10)", () => {
  it("T-LS-08: valid algo_code_open passes validation", () => {
    const result = validateCodeOpen({ "binary-search": true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ "binary-search": true });
    }
  });

  it("T-LS-09: algo_code_open with non-boolean value fails", () => {
    const result = validateCodeOpen({ "binary-search": 1 });
    expect(result.ok).toBe(false);
  });

  it("T-LS-10: algo_code_open with unknown exercise ID fails", () => {
    const result = validateCodeOpen({ "not-a-real-id": true });
    expect(result.ok).toBe(false);
  });
});

describe("parseStored (T-LS-07)", () => {
  it("T-LS-07: tampered JSON string triggers reset", () => {
    const result = parseStored("{{not json}}", validateLearned);
    expect(result.ok).toBe(false);
  });
});
