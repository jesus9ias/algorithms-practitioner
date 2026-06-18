import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type { ExerciseViz, VizFactory, VizInput } from "../../lib/viz/types";

export interface LlStep {
  /** Index (in original order) of the node being reversed at this step. */
  readonly index: number;
  /** The reversed prefix produced so far. */
  readonly reversedSoFar: number[];
}

const VIEW_W = 640;
const VIEW_H = 200;
const NODE_W = 70;
const NODE_H = 50;
const NODE_Y = 50;
const GAP = 40;
const START_X = 20;
const RESULT_Y = 150;

/**
 * Pure step model for the linked-list reversal. Walks the list front-to-back,
 * prepending each node to the reversed prefix; the final prefix is the result,
 * so tests can assert it matches `reverseLinkedList`.
 */
export function buildSteps(input: VizInput): { steps: LlStep[]; result: number[] } {
  const values = [...input.values];
  const steps: LlStep[] = [];
  const reversed: number[] = [];

  values.forEach((value, index) => {
    reversed.unshift(value);
    steps.push({ index, reversedSoFar: [...reversed] });
  });

  return { steps, result: reversed };
}

/** Linked list visualization: a node chain with the reversed prefix below. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const { steps, result } = buildSteps(input);
  const renderable: LlStep[] =
    steps.length > 0 ? steps : [{ index: -1, reversedSoFar: [] }];

  const nodeX = (index: number): number => START_X + index * (NODE_W + GAP);

  return {
    totalSteps: renderable.length,
    result,
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      const totalW = Math.max(VIEW_W, nodeX(values.length) + NODE_W);
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      values.forEach((value, index) => {
        const active = index === step.index;
        const done = index < step.index;
        let fill = "var(--viz-cell)";
        if (done) fill = "var(--viz-range)";
        if (active) fill = "var(--viz-mid)";

        g.appendChild(
          rect({
            x: nodeX(index),
            y: NODE_Y,
            width: NODE_W,
            height: NODE_H,
            rx: 8,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(String(value), {
            x: nodeX(index) + NODE_W / 2,
            y: NODE_Y + NODE_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 18,
            "font-weight": 600,
          })
        );

        if (index < values.length - 1) {
          const x1 = nodeX(index) + NODE_W;
          const x2 = nodeX(index + 1);
          const y = NODE_Y + NODE_H / 2;
          g.appendChild(
            line({ x1, y1: y, x2, y2: y, stroke: "var(--viz-stroke)", "stroke-width": 2 })
          );
          g.appendChild(
            text("→", {
              x: (x1 + x2) / 2,
              y: y - 6,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 16,
            })
          );
        }
      });

      g.appendChild(
        text(`reversed: [${step.reversedSoFar.join(", ")}]`, {
          x: START_X,
          y: RESULT_Y,
          fill: "var(--viz-mid-label)",
          "font-size": 14,
          "font-weight": 600,
        })
      );

      svg.appendChild(g);
    },
  };
};
