import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type {
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

export interface SllDedupeStep {
  readonly nodeIndex: number;
  readonly value: number;
  readonly isDuplicate: boolean;
}

const VIEW_W = 640;
const VIEW_H = 200;
const NODE_W = 70;
const NODE_H = 50;
const NODE_Y = 50;
const GAP = 40;
const START_X = 20;
const RESULT_Y = 165;

export function buildSteps(
  input: VizInput
): { steps: SllDedupeStep[]; result: readonly number[] } {
  const values = [...input.values];
  const seen = new Set<number>();
  const steps: SllDedupeStep[] = [];
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const isDuplicate = seen.has(values[i]);
    steps.push({ nodeIndex: i, value: values[i], isDuplicate });
    if (!isDuplicate) {
      seen.add(values[i]);
      result.push(values[i]);
    }
  }

  return { steps, result };
}

export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const { steps, result } = buildSteps(input);
  const renderable: (SllDedupeStep | null)[] = [null, ...steps];
  const nodeX = (i: number): number => START_X + i * (NODE_W + GAP);
  const totalW = Math.max(VIEW_W, nodeX(values.length) + NODE_W + 50);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      if (stepIndex <= 0) return null;
      const step = steps[stepIndex - 1];
      return { key: step.isDuplicate ? "skip" : "keep", params: { value: step.value } };
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      const currentI = stepIndex - 1;
      const midY = NODE_Y + NODE_H / 2;

      const keptSoFar: number[] = [];
      for (let i = 0; i < currentI; i++) {
        if (!steps[i].isDuplicate) keptSoFar.push(values[i]);
      }

      // "head" label
      g.appendChild(
        text("head", {
          x: nodeX(0) + NODE_W / 2,
          y: NODE_Y - 8,
          "text-anchor": "middle",
          fill: "var(--viz-muted)",
          "font-size": 11,
          "font-weight": 700,
        })
      );

      values.forEach((value, i) => {
        const x = nodeX(i);

        let fill: string;
        if (i === currentI) {
          fill = "var(--viz-mid)";
        } else if (i < currentI) {
          fill = steps[i].isDuplicate ? "var(--viz-range)" : "var(--viz-found)";
        } else {
          fill = "var(--viz-cell)";
        }

        g.appendChild(
          rect({
            x,
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
            x: x + NODE_W / 2,
            y: midY + 6,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 18,
            "font-weight": 600,
          })
        );

        if (i < values.length - 1) {
          const x1 = x + NODE_W;
          const x2 = nodeX(i + 1);
          g.appendChild(
            line({ x1, y1: midY, x2, y2: midY, stroke: "var(--viz-stroke)", "stroke-width": 2 })
          );
          g.appendChild(
            text("→", {
              x: (x1 + x2) / 2,
              y: midY - 6,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 14,
            })
          );
        }
      });

      // null pointer after last node
      const lastRight = nodeX(values.length - 1) + NODE_W;
      g.appendChild(
        line({ x1: lastRight, y1: midY, x2: lastRight + 24, y2: midY, stroke: "var(--viz-stroke)", "stroke-width": 2 })
      );
      g.appendChild(
        text("∅", {
          x: lastRight + 36,
          y: midY + 6,
          "text-anchor": "middle",
          fill: "var(--viz-muted)",
          "font-size": 16,
        })
      );

      // result row
      const keptLabel = keptSoFar.length > 0 ? `[${keptSoFar.join(", ")}]` : "[ ]";
      g.appendChild(
        text(`result: ${keptLabel}`, {
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
