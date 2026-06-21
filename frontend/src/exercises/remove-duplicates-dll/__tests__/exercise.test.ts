import { describe, it, expect } from "vitest";

import { removeDuplicatesDLL } from "../exercise.js";

function toArray(head: { value: number; prev: any; next: any } | null): number[] {
  const result: number[] = [];
  let node = head;
  while (node !== null) {
    result.push(node.value);
    node = node.next;
  }
  return result;
}

function toPrevArray(head: { value: number; prev: any; next: any } | null): number[] {
  if (head === null) return [];
  let tail = head;
  while (tail.next !== null) tail = tail.next;
  const result: number[] = [];
  let node: { value: number; prev: any; next: any } | null = tail;
  while (node !== null) {
    result.push(node.value);
    node = node.prev;
  }
  return result;
}

describe("removeDuplicatesDLL (T-ALG-DLL)", () => {
  it("T-ALG-DLL-01: removes duplicates, returns list with first occurrences", () => {
    expect(toArray(removeDuplicatesDLL([1, 2, 1, 3, 2]))).toEqual([1, 2, 3]);
  });

  it("T-ALG-DLL-02: returns null for empty input", () => {
    expect(removeDuplicatesDLL([])).toBeNull();
  });

  it("T-ALG-DLL-03: returns the same list when there are no duplicates", () => {
    expect(toArray(removeDuplicatesDLL([4, 5, 6]))).toEqual([4, 5, 6]);
  });

  it("T-ALG-DLL-04: returns a single-node list when all values are the same", () => {
    expect(toArray(removeDuplicatesDLL([7, 7, 7]))).toEqual([7]);
  });

  it("T-ALG-DLL-05: works with a single-element list", () => {
    expect(toArray(removeDuplicatesDLL([9]))).toEqual([9]);
  });

  it("T-ALG-DLL-06: preserves the original order of first occurrences", () => {
    expect(toArray(removeDuplicatesDLL([3, 1, 2, 1, 3]))).toEqual([3, 1, 2]);
  });

  it("T-ALG-DLL-07: prev pointers are consistent after deduplication", () => {
    const head = removeDuplicatesDLL([1, 2, 1, 3, 2]);
    expect(toPrevArray(head)).toEqual([3, 2, 1]);
  });
});
