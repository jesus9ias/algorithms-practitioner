import { describe, it, expect } from "vitest";

import { reverseLinkedList } from "../exercise.js";

/**
 * T-ALG-LL-* — the single exported function: reverseLinkedList(values) => values.
 */
describe("reverseLinkedList (T-ALG-LL)", () => {
  it("T-ALG-LL-01: reverses a multi-element list", () => {
    expect(reverseLinkedList([4, 2, 7])).toEqual([7, 2, 4]);
  });

  it("T-ALG-LL-02: reverses a single-element list", () => {
    expect(reverseLinkedList([1])).toEqual([1]);
  });

  it("T-ALG-LL-03: reverses an empty list", () => {
    expect(reverseLinkedList([])).toEqual([]);
  });

  it("does not mutate the input array (edge case)", () => {
    const input = [1, 2, 3];
    reverseLinkedList(input);
    expect(input).toEqual([1, 2, 3]);
  });
});
