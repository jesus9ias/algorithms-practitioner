import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve as resolvePath, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import exercises from "../exercises.json";
import { ExerciseCategory, ExerciseLevel } from "../../lib/constants";

const here = dirname(fileURLToPath(import.meta.url));
const exercisesDir = resolvePath(here, "..", "..", "exercises");

const categoryValues = new Set<string>(Object.values(ExerciseCategory));
const levelValues = new Set<string>(Object.values(ExerciseLevel));

interface LocalizedText {
  en: string;
  es: string;
}

interface RegistryEntry {
  id: string;
  slug: string;
  category: string;
  level: string;
  codeFile: string;
  name: LocalizedText;
  description: LocalizedText;
  links: { url: string; label: LocalizedText }[];
}

function isNonEmptyLocalized(value: LocalizedText): boolean {
  return (
    typeof value?.en === "string" &&
    value.en.length > 0 &&
    typeof value?.es === "string" &&
    value.es.length > 0
  );
}

const registry = exercises as unknown as RegistryEntry[];

describe("exercise registry (T-REG)", () => {
  it("T-REG-01: all exercises have required fields", () => {
    for (const entry of registry) {
      expect(entry.id, "id").toBeTruthy();
      expect(entry.slug, "slug").toBeTruthy();
      expect(entry.category, "category").toBeTruthy();
      expect(entry.level, "level").toBeTruthy();
      expect(entry.codeFile, "codeFile").toBeTruthy();
    }
  });

  it("T-REG-02: all category values are valid enum members", () => {
    for (const entry of registry) {
      expect(categoryValues.has(entry.category)).toBe(true);
    }
  });

  it("T-REG-03: all level values are valid enum members", () => {
    for (const entry of registry) {
      expect(levelValues.has(entry.level)).toBe(true);
    }
  });

  it("T-REG-04: all codeFile paths resolve to existing files", () => {
    for (const entry of registry) {
      const fullPath = resolvePath(exercisesDir, entry.codeFile);
      expect(existsSync(fullPath), `${entry.codeFile} should exist`).toBe(true);
    }
  });

  it("T-REG-05: all exercise IDs are unique", () => {
    const ids = registry.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-REG-06: all localized fields have non-empty en/es", () => {
    for (const entry of registry) {
      expect(isNonEmptyLocalized(entry.name), `${entry.id} name`).toBe(true);
      expect(isNonEmptyLocalized(entry.description), `${entry.id} description`).toBe(true);
      for (const link of entry.links) {
        expect(isNonEmptyLocalized(link.label), `${entry.id} link label`).toBe(true);
      }
    }
  });
});
