import { describe, it, expect } from "vitest";

import { spiralOrder } from "../exercise.js";

describe("spiralOrder (T-ALG-MS)", () => {
  it("T-ALG-MS-01: square matrix in clockwise spiral order", () => {
    expect(
      spiralOrder([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
    ).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);
  });

  it("T-ALG-MS-02: rectangular (wider than tall) matrix", () => {
    expect(
      spiralOrder([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
      ])
    ).toEqual([1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]);
  });

  it("T-ALG-MS-03: empty matrix returns empty array", () => {
    expect(spiralOrder([])).toEqual([]);
  });

  it("T-ALG-MS-04: single row is returned left to right", () => {
    expect(spiralOrder([[1, 2, 3]])).toEqual([1, 2, 3]);
  });

  it("T-ALG-MS-05: single column is returned top to bottom", () => {
    expect(spiralOrder([[1], [2], [3]])).toEqual([1, 2, 3]);
  });

  it("T-ALG-MS-06: 1×1 matrix returns its only element", () => {
    expect(spiralOrder([[5]])).toEqual([5]);
  });
});
