import { describe, it, expect } from "vitest";

import en from "../en.json";
import es from "../es.json";
import { resolve } from "../index";

/** Recursively collects the dotted key paths of a nested string record. */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      keys.push(...flattenKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function flattenValues(obj: Record<string, unknown>): unknown[] {
  const values: unknown[] = [];
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === "object") {
      values.push(...flattenValues(value as Record<string, unknown>));
    } else {
      values.push(value);
    }
  }
  return values;
}

describe("i18n (T-I18N)", () => {
  it("T-I18N-01: English and Spanish files have identical key sets", () => {
    const enKeys = flattenKeys(en as Record<string, unknown>).sort();
    const esKeys = flattenKeys(es as Record<string, unknown>).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it("T-I18N-02: no key has an empty string value", () => {
    const allValues = [
      ...flattenValues(en as Record<string, unknown>),
      ...flattenValues(es as Record<string, unknown>),
    ];
    for (const value of allValues) {
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it("T-I18N-03: resolve returns correct string for known key", () => {
    expect(resolve("nav.home", "en")).toBe("Home");
  });

  it("T-I18N-04: resolve returns fallback (the key itself) for unknown key", () => {
    expect(resolve("exercises.unknown.name", "en")).toBe("exercises.unknown.name");
  });
});
