import { clear, circle, text, line, rect, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Lines executed when the DFS loop pops one node and confirms it is not a
 * stale duplicate: mark it visited, read it into the result, then scan its
 * row (descending) and push every unvisited neighbor. Each step visits one
 * node. 1-based; kept in lockstep with exercise.js and exercise.pseudo.
 */
const VISIT_STEP_LINES: CodeLines = {
  js: [20, 21, 22, 25, 26, 28, 29, 30],
  pseudo: [11, 12, 13, 15, 16, 18, 19, 20],
};

export interface DfsGraphStep {
  readonly node: number;
  readonly newlyPushed: readonly number[];
  readonly stackAfter: readonly number[];
}

/**
 * An edge between two nodes, with the direction(s) it was found in the
 * adjacency matrix. `"both"` means the matrix has the edge in both
 * directions (an undirected/mutual connection); `"forward"`/`"backward"`
 * mean it was found in only one direction (a genuinely directed edge), which
 * the renderer marks with an arrowhead so direction is visible on screen —
 * without it, two matrices that differ only in edge direction can look
 * identical but traverse differently. Mirrors bfs-graph's edge model exactly
 * (2026-07-14 fix), since both exercises share the same node-link archetype.
 */
export interface GraphEdge {
  readonly a: number;
  readonly b: number;
  readonly direction: "forward" | "backward" | "both";
}

interface LaidOutNode {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

const VIEW_W = 640;
const CIRCLE_CX = VIEW_W / 2;
const CIRCLE_CY = 160;
const CIRCLE_R = 120;
const NODE_R = 20;
const STACK_LABEL_Y = 330;
const STACK_Y = 340;
const STACK_CHIP_W = 46;
const STACK_CHIP_H = 32;
const STACK_CHIP_GAP = 10;
const STACK_X = 12;
const VIEW_H = STACK_Y + STACK_CHIP_H + 16;

const ARROW_GAP = 3;
const ARROW_LENGTH = 9;
const ARROW_SPREAD = Math.PI / 7;

/**
 * Draws a small chevron at `to`'s edge (just outside the node circle),
 * pointing from `from` to `to`, using two short line segments — no new SVG
 * primitive is needed beyond the existing `line` helper.
 */
function arrowhead(from: LaidOutNode, to: LaidOutNode): SVGLineElement[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) {
    return [];
  }
  const ux = dx / dist;
  const uy = dy / dist;
  const tipX = to.x - ux * (NODE_R + ARROW_GAP);
  const tipY = to.y - uy * (NODE_R + ARROW_GAP);
  const backAngle = Math.atan2(uy, ux) + Math.PI;

  const wing = (angleOffset: number): SVGLineElement => {
    const angle = backAngle + angleOffset;
    return line({
      x1: tipX,
      y1: tipY,
      x2: tipX + ARROW_LENGTH * Math.cos(angle),
      y2: tipY + ARROW_LENGTH * Math.sin(angle),
      stroke: "var(--viz-stroke)",
      "stroke-width": 1.5,
    });
  };

  return [wing(ARROW_SPREAD), wing(-ARROW_SPREAD)];
}

/**
 * Places nodes evenly around a circle — a general graph has no natural
 * hierarchy to lay out by, unlike a tree.
 */
function layoutNodes(nodeCount: number): LaidOutNode[] {
  return Array.from({ length: nodeCount }, (_, index) => {
    const angle = (2 * Math.PI * index) / nodeCount - Math.PI / 2;
    return {
      index,
      x: CIRCLE_CX + CIRCLE_R * Math.cos(angle),
      y: CIRCLE_CY + CIRCLE_R * Math.sin(angle),
    };
  });
}

/**
 * Pure step model for graph DFS. Independently simulates the same
 * iterative stack-based traversal as `dfsGraph` (it does not import the
 * exercise function), recording one step per node popped and confirmed
 * unvisited — the node itself and the neighbors it newly pushes — so tests
 * can assert the result matches `dfsGraph`. Stale duplicate pops (a node
 * pushed more than once before its first visit) perform no step, mirroring
 * the exercise function's own `continue` guard. Also returns the graph's
 * edge list (one entry per connected pair, tagged with its direction) for
 * rendering, identical to bfs-graph's edge model.
 */
export function buildSteps(input: VizInput): {
  steps: DfsGraphStep[];
  result: number[];
  nodeCount: number;
  edges: readonly GraphEdge[];
} {
  const matrix = (input.matrix ?? []).map((row) => [...row]);
  const nodeCount = matrix.length;

  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodeCount; i += 1) {
    for (let j = i + 1; j < nodeCount; j += 1) {
      const forward = Boolean(matrix[i][j]);
      const backward = Boolean(matrix[j][i]);
      if (forward && backward) {
        edges.push({ a: i, b: j, direction: "both" });
      } else if (forward) {
        edges.push({ a: i, b: j, direction: "forward" });
      } else if (backward) {
        edges.push({ a: i, b: j, direction: "backward" });
      }
    }
  }

  const steps: DfsGraphStep[] = [];
  const result: number[] = [];

  if (nodeCount === 0) {
    return { steps, result, nodeCount, edges };
  }

  const visited = new Array(nodeCount).fill(false);
  const stack: number[] = [0];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited[node]) {
      continue;
    }
    visited[node] = true;
    result.push(node);

    const newlyPushed: number[] = [];
    for (let neighbor = nodeCount - 1; neighbor >= 0; neighbor -= 1) {
      if (matrix[node][neighbor] && !visited[neighbor]) {
        stack.push(neighbor);
        newlyPushed.push(neighbor);
      }
    }

    steps.push({ node, newlyPushed, stackAfter: [...stack] });
  }

  return { steps, result, nodeCount, edges };
}

/**
 * Graph DFS visualization: nodes placed evenly around a circle with all
 * edges drawn between them, plus a live stack strip beneath the circle
 * showing which nodes are discovered but not yet popped — the LIFO
 * counterpart to bfs-graph's FIFO queue strip. Each step pops and colors one
 * node.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result, nodeCount, edges } = buildSteps(input);
  const positions = layoutNodes(nodeCount);
  const total = Math.max(steps.length, 1);

  return {
    totalSteps: total + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the built graph before DFS starts; no log row.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= steps.length) {
        return null;
      }
      const step = steps[walkIndex];
      return {
        key: "visit",
        params: {
          node: step.node,
          pushed: step.newlyPushed.length > 0 ? step.newlyPushed.join(", ") : "—",
        },
      };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the built graph before DFS starts; nothing runs.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= steps.length) {
        return null;
      }
      return VISIT_STEP_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      // stepIndex 0 = initial undecorated state; the DFS walk starts at index 1.
      const walkIndex = stepIndex - 1;
      const isLast = stepIndex >= total;
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${Math.max(VIEW_H, 1)}`);
      clear(svg);
      const g = group();

      // Edges — drawn once, beneath the nodes, all the same color. A
      // one-directional edge gets an arrowhead at its target end so the
      // traversal direction is visible instead of implied by the matrix alone.
      edges.forEach((edge) => {
        const nodeA = positions[edge.a];
        const nodeB = positions[edge.b];
        g.appendChild(
          line({
            x1: nodeA.x,
            y1: nodeA.y,
            x2: nodeB.x,
            y2: nodeB.y,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        if (edge.direction === "forward") {
          arrowhead(nodeA, nodeB).forEach((w) => g.appendChild(w));
        } else if (edge.direction === "backward") {
          arrowhead(nodeB, nodeA).forEach((w) => g.appendChild(w));
        }
      });

      const visitedCount = walkIndex >= 0 ? Math.min(walkIndex + 1, steps.length) : 0;
      const currentStep =
        walkIndex >= 0 && steps.length > 0 ? steps[Math.min(walkIndex, steps.length - 1)] : null;
      const pending = new Set(currentStep ? currentStep.stackAfter : []);

      positions.forEach((n) => {
        const visitOrder = result.indexOf(n.index);
        const visited = visitOrder >= 0 && visitOrder < visitedCount;
        const active = visitOrder >= 0 && visitOrder === visitedCount - 1;

        let fill = "var(--viz-cell)";
        if (pending.has(n.index)) fill = "var(--viz-compare)";
        if (visited) fill = "var(--viz-range)";
        if (active) fill = isLast ? "var(--viz-found)" : "var(--viz-mid)";

        g.appendChild(
          circle({
            cx: n.x,
            cy: n.y,
            r: NODE_R,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(String(n.index), {
            x: n.x,
            y: n.y + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
      });

      // Stack strip — nodes discovered but not yet popped. Rendered
      // left-to-right as bottom-to-top of the stack, so the rightmost chip
      // is the one popped next (LIFO), the opposite processing order from
      // bfs-graph's queue strip (FIFO, leftmost popped next).
      g.appendChild(
        text("stack", {
          x: STACK_X,
          y: STACK_LABEL_Y,
          fill: "var(--viz-muted)",
          "font-size": 13,
          "font-weight": 600,
        })
      );
      const stackNow = currentStep ? currentStep.stackAfter : [];
      if (stackNow.length === 0) {
        g.appendChild(
          text("(empty)", {
            x: STACK_X,
            y: STACK_Y + 20,
            fill: "var(--viz-muted)",
            "font-size": 13,
          })
        );
      } else {
        stackNow.forEach((node, idx) => {
          const x = STACK_X + idx * (STACK_CHIP_W + STACK_CHIP_GAP);
          const isTop = idx === stackNow.length - 1;
          g.appendChild(
            rect({
              x,
              y: STACK_Y,
              width: STACK_CHIP_W,
              height: STACK_CHIP_H,
              rx: 6,
              fill: "var(--viz-compare)",
              stroke: isTop ? "var(--viz-mid)" : "var(--viz-stroke)",
              "stroke-width": isTop ? 2.5 : 1.5,
            })
          );
          g.appendChild(
            text(String(node), {
              x: x + STACK_CHIP_W / 2,
              y: STACK_Y + STACK_CHIP_H / 2 + 5,
              "text-anchor": "middle",
              fill: "var(--viz-text)",
              "font-size": 14,
              "font-weight": 600,
            })
          );
        });
      }

      svg.appendChild(g);
    },
  };
};
