import { describe, it, expect } from "vitest";

import { bfsGraph } from "../exercise.js";

describe("bfsGraph (T-ALG-BFSG)", () => {
  it("T-ALG-BFSG-01: connected graph visits every node breadth-first from node 0", () => {
    const matrix = [
      [0, 1, 1, 0, 0, 0],
      [1, 0, 0, 1, 1, 0],
      [1, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 1],
      [0, 0, 1, 0, 1, 0],
    ];
    expect(bfsGraph(matrix)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("T-ALG-BFSG-02: empty matrix returns an empty array", () => {
    expect(bfsGraph([])).toEqual([]);
  });

  it("T-ALG-BFSG-03: single node with no edges visits only itself", () => {
    expect(bfsGraph([[0]])).toEqual([0]);
  });

  it("T-ALG-BFSG-04: nodes unreachable from node 0 are never visited", () => {
    const matrix = [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 0],
    ];
    expect(bfsGraph(matrix)).toEqual([0, 1]);
  });

  it("T-ALG-BFSG-05: a fully connected triangle visits in index order", () => {
    const matrix = [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ];
    expect(bfsGraph(matrix)).toEqual([0, 1, 2]);
  });

  it("T-ALG-BFSG-06: an asymmetric (directed) matrix only follows outgoing edges", () => {
    const matrix = [
      [0, 0],
      [1, 0],
    ];
    expect(bfsGraph(matrix)).toEqual([0]);
  });

  it("T-ALG-BFSG-07: adding one directed edge (0 -> 3) changes reachability and order", () => {
    // Same 0-1, 1<->2 edges as the matrix below, but 3 -> 0 is one-directional
    // (node 3 points into 0, not the other way), so 3 stays unreachable from 0.
    const oneWay = [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ];
    expect(bfsGraph(oneWay)).toEqual([0, 1, 2]);

    // Making 0 <-> 3 mutual (adding matrix[0][3] = 1) makes node 3 reachable
    // directly from 0, changing both which nodes are visited and their order.
    const mutual = [
      [0, 1, 0, 1],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ];
    expect(bfsGraph(mutual)).toEqual([0, 1, 3, 2]);
  });
});
