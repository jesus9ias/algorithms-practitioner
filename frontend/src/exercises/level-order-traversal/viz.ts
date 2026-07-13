import { clear, circle, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Lines executed when the BFS loop dequeues one node: read its value into the
 * current level row, then compute and enqueue its in-range children. Each
 * step visits one node. 1-based; kept in lockstep with exercise.js and
 * exercise.pseudo.
 */
const VISIT_STEP_LINES: CodeLines = {
  js: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  pseudo: [11, 12, 13, 14, 15, 16, 17, 18],
};

interface LaidOutNode {
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  /** BFS visit order, which equals the node's original array index for this level-order layout. */
  readonly order: number;
  readonly parentIndex: number | null;
}

const VIEW_W = 640;
const VIEW_H = 280;
const RADIUS = 22;
const LEVEL_H = 70;
const TOP_Y = 40;

/**
 * Positions each node by its heap-array index alone: depth from
 * `floor(log2(index + 1))`, spread evenly left-to-right within that depth's
 * row. This renders the standard "complete binary tree" shape, distinct from
 * `binary-tree`/`inorder-traversal`'s in-order-indexed layout, to visually
 * reinforce that this exercise walks by level, not by subtree.
 */
function layoutNodes(values: readonly number[]): LaidOutNode[] {
  return values.map((value, index) => {
    const depth = Math.floor(Math.log2(index + 1));
    const levelStart = 2 ** depth - 1;
    const levelSize = 2 ** depth;
    const positionInLevel = index - levelStart;
    const colW = VIEW_W / (levelSize + 1);
    return {
      value,
      x: colW * (positionInLevel + 1),
      y: TOP_Y + depth * LEVEL_H,
      depth,
      order: index,
      parentIndex: index === 0 ? null : Math.floor((index - 1) / 2),
    };
  });
}

/**
 * Pure step model for the level-order (BFS) traversal of the level-order
 * tree. Independently simulates the breadth-first walk (it does not import
 * the exercise function) and returns the levels grouping plus laid-out nodes
 * for rendering, so tests can assert the result matches `levelOrderTraversal`.
 */
export function buildSteps(input: VizInput): {
  steps: number[];
  result: number[][];
  nodes: LaidOutNode[];
} {
  const values = input.values;
  const nodes = layoutNodes(values);

  const result: number[][] = [];
  let queue: number[] = values.length > 0 ? [0] : [];
  while (queue.length > 0) {
    const level: number[] = [];
    const nextQueue: number[] = [];
    for (const index of queue) {
      level.push(values[index]);
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < values.length) {
        nextQueue.push(left);
      }
      if (right < values.length) {
        nextQueue.push(right);
      }
    }
    result.push(level);
    queue = nextQueue;
  }

  // Visit order equals array-index order: a child index is always greater
  // than its parent's, so BFS over this level-order layout is the identity
  // permutation of `values`.
  const steps = values.slice();
  return { steps, result, nodes };
}

/** Complete-binary-tree (heap-shape) visualization: nodes positioned by depth and breadth-index, visited level by level via a queue. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { nodes, result } = buildSteps(input);
  const total = Math.max(nodes.length, 1);

  return {
    totalSteps: total + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the built tree before the traversal starts; no log row.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= nodes.length) {
        return null;
      }
      const node = nodes[walkIndex];
      return { key: "visit", params: { value: node.value, level: node.depth } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the built tree before the traversal starts; nothing runs.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= nodes.length) {
        return null;
      }
      return VISIT_STEP_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      // stepIndex 0 = initial undecorated state; algorithm walk starts at index 1
      const walkIndex = stepIndex - 1;
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      nodes.forEach((n) => {
        if (n.parentIndex !== null) {
          const parent = nodes[n.parentIndex];
          g.appendChild(
            line({
              x1: parent.x,
              y1: parent.y,
              x2: n.x,
              y2: n.y,
              stroke: "var(--viz-stroke)",
              "stroke-width": 2,
            })
          );
        }
      });

      nodes.forEach((n) => {
        const visited = walkIndex >= 0 && n.order <= walkIndex;
        const active = walkIndex >= 0 && n.order === walkIndex;
        let fill = "var(--viz-cell)";
        if (visited) fill = "var(--viz-range)";
        if (active) fill = "var(--viz-mid)";

        g.appendChild(
          circle({
            cx: n.x,
            cy: n.y,
            r: RADIUS,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(String(n.value), {
            x: n.x,
            y: n.y + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 16,
            "font-weight": 600,
          })
        );
      });

      svg.appendChild(g);
    },
  };
};
