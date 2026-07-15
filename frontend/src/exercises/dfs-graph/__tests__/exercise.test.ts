import { describe, it, expect } from "vitest";

import { dfsGraph } from "../exercise.js";

describe("dfsGraph (T-ALG-DFSG)", () => {
  it("T-ALG-DFSG-01: connected graph visits every node depth-first from node 0", () => {
    const matrix = [
      [0, 1, 1, 0, 0, 0],
      [1, 0, 0, 1, 1, 0],
      [1, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 1],
      [0, 0, 1, 0, 1, 0],
    ];
    expect(dfsGraph(matrix)).toEqual([0, 1, 3, 4, 5, 2]);
  });

  it("T-ALG-DFSG-02: empty matrix returns an empty array", () => {
    expect(dfsGraph([])).toEqual([]);
  });

  it("T-ALG-DFSG-03: single node with no edges visits only itself", () => {
    expect(dfsGraph([[0]])).toEqual([0]);
  });

  it("T-ALG-DFSG-04: nodes unreachable from node 0 are never visited", () => {
    const matrix = [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 0],
    ];
    expect(dfsGraph(matrix)).toEqual([0, 1]);
  });

  it("T-ALG-DFSG-05: a fully connected triangle visits in index order", () => {
    const matrix = [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ];
    expect(dfsGraph(matrix)).toEqual([0, 1, 2]);
  });

  it("T-ALG-DFSG-06: an asymmetric (directed) matrix only follows outgoing edges", () => {
    const matrix = [
      [0, 0],
      [1, 0],
    ];
    expect(dfsGraph(matrix)).toEqual([0]);
  });

  it("T-ALG-DFSG-07: adding one directed edge (0 -> 3) changes reachability and order, differently from BFS", () => {
    // Same 0-1, 1<->2 edges as the matrix below, but 3 -> 0 is one-directional
    // (node 3 points into 0, not the other way), so 3 stays unreachable from 0.
    const oneWay = [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ];
    expect(dfsGraph(oneWay)).toEqual([0, 1, 2]);

    // Making 0 <-> 3 mutual (adding matrix[0][3] = 1) makes node 3 reachable
    // directly from 0. DFS dives into it depth-first ([0, 1, 2, 3]), a
    // different order from BFS's level-by-level [0, 1, 3, 2] on the same
    // matrix, even though both visit the same set of nodes.
    const mutual = [
      [0, 1, 0, 1],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ];
    expect(dfsGraph(mutual)).toEqual([0, 1, 2, 3]);
  });
});
