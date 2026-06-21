import { describe, it, expect } from "vitest";

import { removeDuplicatesSLL } from "../exercise.js";

function toArray(head: { value: number; next: any } | null): number[] {
  const result: number[] = [];
  let node = head;
  while (node !== null) {
    result.push(node.value);
    node = node.next;
  }
  return result;
}

describe("removeDuplicatesSLL (T-ALG-SLL)", () => {
  it("T-ALG-SLL-01: removes duplicates, returns list with first occurrences", () => {
    expect(toArray(removeDuplicatesSLL([1, 2, 1, 3, 2]))).toEqual([1, 2, 3]);
  });

  it("T-ALG-SLL-02: returns null for empty input", () => {
    expect(removeDuplicatesSLL([])).toBeNull();
  });

  it("T-ALG-SLL-03: returns the same list when there are no duplicates", () => {
    expect(toArray(removeDuplicatesSLL([4, 5, 6]))).toEqual([4, 5, 6]);
  });

  it("T-ALG-SLL-04: returns a single-node list when all values are the same", () => {
    expect(toArray(removeDuplicatesSLL([7, 7, 7]))).toEqual([7]);
  });

  it("T-ALG-SLL-05: works with a single-element list", () => {
    expect(toArray(removeDuplicatesSLL([9]))).toEqual([9]);
  });

  it("T-ALG-SLL-06: preserves the original order of first occurrences", () => {
    expect(toArray(removeDuplicatesSLL([3, 1, 2, 1, 3]))).toEqual([3, 1, 2]);
  });
});
