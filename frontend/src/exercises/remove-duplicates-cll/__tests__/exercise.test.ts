import { describe, it, expect } from "vitest";

import { removeDuplicatesCLL } from "../exercise.js";

function toArray(head: { value: number; next: any } | null): number[] {
  if (head === null) return [];
  const result: number[] = [];
  let node = head;
  do {
    result.push(node.value);
    node = node.next;
  } while (node !== head);
  return result;
}

describe("removeDuplicatesCLL (T-ALG-CLL)", () => {
  it("T-ALG-CLL-01: removes duplicates, returns list with first occurrences", () => {
    expect(toArray(removeDuplicatesCLL([1, 2, 1, 3, 2]))).toEqual([1, 2, 3]);
  });

  it("T-ALG-CLL-02: returns null for empty input", () => {
    expect(removeDuplicatesCLL([])).toBeNull();
  });

  it("T-ALG-CLL-03: returns the same list when there are no duplicates", () => {
    expect(toArray(removeDuplicatesCLL([4, 5, 6]))).toEqual([4, 5, 6]);
  });

  it("T-ALG-CLL-04: returns a single-node list when all values are the same", () => {
    expect(toArray(removeDuplicatesCLL([7, 7, 7]))).toEqual([7]);
  });

  it("T-ALG-CLL-05: works with a single-element list", () => {
    expect(toArray(removeDuplicatesCLL([9]))).toEqual([9]);
  });

  it("T-ALG-CLL-06: preserves the original order of first occurrences", () => {
    expect(toArray(removeDuplicatesCLL([3, 1, 2, 1, 3]))).toEqual([3, 1, 2]);
  });

  it("T-ALG-CLL-07: last node points back to head after deduplication", () => {
    const head = removeDuplicatesCLL([1, 2, 1, 3, 2]);
    let tail = head;
    while (tail!.next !== head) tail = tail!.next;
    expect(tail!.next).toBe(head);
  });
});
