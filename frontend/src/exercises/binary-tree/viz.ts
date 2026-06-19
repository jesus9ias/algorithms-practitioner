import { clear, circle, text, line, group } from "../../lib/viz/svg";
import type {
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

interface BstNode {
  value: number;
  left: BstNode | null;
  right: BstNode | null;
}

interface LaidOutNode {
  value: number;
  x: number;
  y: number;
  order: number;
  parent: LaidOutNode | null;
}

const VIEW_W = 640;
const VIEW_H = 280;
const RADIUS = 22;
const LEVEL_H = 70;
const TOP_Y = 40;

function insert(node: BstNode | null, value: number): BstNode {
  if (node === null) {
    return { value, left: null, right: null };
  }
  if (value < node.value) {
    node.left = insert(node.left, value);
  } else if (value > node.value) {
    node.right = insert(node.right, value);
  }
  return node;
}

/**
 * Pure step model for the BST in-order traversal. Builds the tree and walks it
 * in-order; the visited sequence is the result, so tests can assert it matches
 * `binarySearchTreeInorder`. Also returns laid-out nodes for rendering.
 */
export function buildSteps(input: VizInput): {
  steps: number[];
  result: number[];
  nodes: LaidOutNode[];
} {
  let root: BstNode | null = null;
  for (const value of input.values) {
    root = insert(root, value);
  }

  const nodes: LaidOutNode[] = [];
  let counter = 0;
  const layout = (node: BstNode | null, depth: number, parent: LaidOutNode | null): void => {
    if (node === null) {
      return;
    }
    const current: LaidOutNode = {
      value: node.value,
      x: 0,
      y: TOP_Y + depth * LEVEL_H,
      order: 0,
      parent,
    };
    layout(node.left, depth + 1, current);
    current.order = counter;
    counter += 1;
    nodes.push(current);
    layout(node.right, depth + 1, current);
  };
  layout(root, 0, null);

  const colW = VIEW_W / (nodes.length + 1);
  nodes.forEach((n) => {
    n.x = colW * (n.order + 1);
  });

  const result = nodes.map((n) => n.value);
  return { steps: result, result, nodes };
}

/** BST visualization: nodes by in-order index (x) and depth (y), walked in-order. */
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
      return { key: "visit", params: { value: nodes[walkIndex].value } };
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      // stepIndex 0 = initial undecorated state; algorithm walk starts at index 1
      const walkIndex = stepIndex - 1;
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      nodes.forEach((n) => {
        if (n.parent !== null) {
          g.appendChild(
            line({
              x1: n.parent.x,
              y1: n.parent.y,
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
