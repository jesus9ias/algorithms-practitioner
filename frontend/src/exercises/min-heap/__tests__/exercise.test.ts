import { describe, it, expect } from "vitest";

import { buildMinHeap } from "../exercise.js";

/** True when `arr`, read as a complete binary tree, satisfies the min-heap property. */
function isMinHeap(arr: readonly number[]): boolean {
  for (let i = 0; i < arr.length; i += 1) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < arr.length && arr[i] > arr[left]) return false;
    if (right < arr.length && arr[i] > arr[right]) return false;
  }
  return true;
}

/** True when `a` and `b` contain the same values with the same multiplicity. */
function sameMultiset(a: readonly number[], b: readonly number[]): boolean {
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.length === sortedB.length && sortedA.every((v, i) => v === sortedB[i]);
}

describe("buildMinHeap (T-EX-MINHEAP)", () => {
  it("T-EX-MINHEAP-01: returns an empty array for empty input", () => {
    expect(buildMinHeap([])).toEqual([]);
  });

  it("T-EX-MINHEAP-02: a single element is already a valid heap", () => {
    expect(buildMinHeap([7])).toEqual([7]);
  });

  it("T-EX-MINHEAP-03: an already-valid heap is left unchanged", () => {
    expect(buildMinHeap([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("T-EX-MINHEAP-04: rearranges an unordered array into min-heap order", () => {
    const result = buildMinHeap([9, 4, 7, 1, 8, 5, 2, 3]);
    expect(result).toEqual([1, 3, 2, 4, 8, 5, 7, 9]);
    expect(isMinHeap(result)).toBe(true);
    expect(sameMultiset(result, [9, 4, 7, 1, 8, 5, 2, 3])).toBe(true);
  });

  it("T-EX-MINHEAP-05: produces a valid heap for a second unordered array", () => {
    const result = buildMinHeap([5, 3, 8, 1, 2]);
    expect(result).toEqual([1, 2, 8, 3, 5]);
    expect(isMinHeap(result)).toBe(true);
  });

  it("T-EX-MINHEAP-06: handles duplicate values without unnecessary swaps", () => {
    const result = buildMinHeap([4, 4, 4, 4]);
    expect(isMinHeap(result)).toBe(true);
    expect(sameMultiset(result, [4, 4, 4, 4])).toBe(true);
  });

  it("T-EX-MINHEAP-07: handles negative values", () => {
    const result = buildMinHeap([-1, -5, 3, 0]);
    expect(isMinHeap(result)).toBe(true);
    expect(result[0]).toBe(-5);
    expect(sameMultiset(result, [-1, -5, 3, 0])).toBe(true);
  });

  it("T-EX-MINHEAP-08: does not mutate the input array", () => {
    const input = [3, 1, 2];
    buildMinHeap(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
