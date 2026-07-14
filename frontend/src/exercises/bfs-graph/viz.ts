import { clear, circle, text, line, rect, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Lines executed when the BFS loop dequeues one node: read it into the
 * result, then scan its row and enqueue every unvisited neighbor. Each step
 * visits one node. 1-based; kept in lockstep with exercise.js and
 * exercise.pseudo.
 */
const VISIT_STEP_LINES: CodeLines = {
  js: [21, 22, 23, 25, 26, 27, 28],
  pseudo: [12, 13, 14, 16, 17, 18, 19],
};

export interface BfsGraphStep {
  readonly node: number;
  readonly newlyEnqueued: readonly number[];
  readonly queueAfter: readonly number[];
}

/**
 * An edge between two nodes, with the direction(s) it was found in the
 * adjacency matrix. `"both"` means the matrix has the edge in both
 * directions (an undirected/mutual connection); `"forward"`/`"backward"`
 * mean it was found in only one direction (a genuinely directed edge), which
 * the renderer marks with an arrowhead so direction is visible on screen —
 * without it, two matrices that differ only in edge direction can look
 * identical but traverse differently.
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
const QUEUE_LABEL_Y = 330;
const QUEUE_Y = 340;
const QUEUE_CHIP_W = 46;
const QUEUE_CHIP_H = 32;
const QUEUE_CHIP_GAP = 10;
const QUEUE_X = 12;
const VIEW_H = QUEUE_Y + QUEUE_CHIP_H + 16;

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
 * Pure step model for graph BFS. Independently simulates the same
 * explicit-queue traversal as `bfsGraph` (it does not import the exercise
 * function), recording one step per node dequeued — the node itself and the
 * neighbors it newly enqueues — so tests can assert the result matches
 * `bfsGraph`. Also returns the graph's edge list (one entry per connected
 * pair, tagged with its direction) for rendering.
 */
export function buildSteps(input: VizInput): {
  steps: BfsGraphStep[];
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

  const steps: BfsGraphStep[] = [];
  const result: number[] = [];

  if (nodeCount === 0) {
    return { steps, result, nodeCount, edges };
  }

  const visited = new Array(nodeCount).fill(false);
  const queue: number[] = [0];
  visited[0] = true;

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const newlyEnqueued: number[] = [];
    for (let neighbor = 0; neighbor < nodeCount; neighbor += 1) {
      if (matrix[node][neighbor] && !visited[neighbor]) {
        visited[neighbor] = true;
        queue.push(neighbor);
        newlyEnqueued.push(neighbor);
      }
    }

    steps.push({ node, newlyEnqueued, queueAfter: [...queue] });
  }

  return { steps, result, nodeCount, edges };
}

/**
 * Graph BFS visualization: nodes placed evenly around a circle with all
 * edges drawn between them, plus a live queue strip beneath the circle
 * showing which nodes are discovered but not yet processed. Each step
 * dequeues and colors one node.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result, nodeCount, edges } = buildSteps(input);
  const positions = layoutNodes(nodeCount);
  const total = Math.max(steps.length, 1);

  return {
    totalSteps: total + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the built graph before BFS starts; no log row.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= steps.length) {
        return null;
      }
      const step = steps[walkIndex];
      return {
        key: "visit",
        params: {
          node: step.node,
          enqueued: step.newlyEnqueued.length > 0 ? step.newlyEnqueued.join(", ") : "—",
        },
      };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the built graph before BFS starts; nothing runs.
      const walkIndex = stepIndex - 1;
      if (walkIndex < 0 || walkIndex >= steps.length) {
        return null;
      }
      return VISIT_STEP_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      // stepIndex 0 = initial undecorated state; the BFS walk starts at index 1.
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
      const pending = new Set(currentStep ? currentStep.queueAfter : []);

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

      // Queue strip — nodes discovered but not yet dequeued.
      g.appendChild(
        text("queue", {
          x: QUEUE_X,
          y: QUEUE_LABEL_Y,
          fill: "var(--viz-muted)",
          "font-size": 13,
          "font-weight": 600,
        })
      );
      const queueNow = currentStep ? currentStep.queueAfter : [];
      if (queueNow.length === 0) {
        g.appendChild(
          text("(empty)", {
            x: QUEUE_X,
            y: QUEUE_Y + 20,
            fill: "var(--viz-muted)",
            "font-size": 13,
          })
        );
      } else {
        queueNow.forEach((node, idx) => {
          const x = QUEUE_X + idx * (QUEUE_CHIP_W + QUEUE_CHIP_GAP);
          g.appendChild(
            rect({
              x,
              y: QUEUE_Y,
              width: QUEUE_CHIP_W,
              height: QUEUE_CHIP_H,
              rx: 6,
              fill: "var(--viz-compare)",
              stroke: "var(--viz-stroke)",
              "stroke-width": 1.5,
            })
          );
          g.appendChild(
            text(String(node), {
              x: x + QUEUE_CHIP_W / 2,
              y: QUEUE_Y + QUEUE_CHIP_H / 2 + 5,
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
