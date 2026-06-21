import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines per dedup decision, by code mode. The head node is kept by the
 * pre-loop setup; every other node is decided inside the while-loop. A skipped
 * duplicate also repairs the backward pointer. 1-based; kept in lockstep with
 * exercise.js / exercise.pseudo.
 */
const HEAD_LINES: CodeLines = { js: [20, 21], pseudo: [13, 14] };
const DUP_LINES: CodeLines = {
  js: [24, 25, 26, 27, 28, 33],
  pseudo: [17, 18, 19, 20, 21, 22, 26],
};
const KEEP_LINES: CodeLines = {
  js: [24, 25, 26, 30, 31, 33],
  pseudo: [17, 18, 19, 24, 25, 26],
};

export interface DllDedupeStep {
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
): { steps: DllDedupeStep[]; result: readonly number[] } {
  const values = [...input.values];
  const seen = new Set<number>();
  const steps: DllDedupeStep[] = [];
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
  const renderable: (DllDedupeStep | null)[] = [null, ...steps];
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
    codeLines(stepIndex: number): CodeLines | null {
      if (stepIndex <= 0) return null;
      const step = steps[stepIndex - 1];
      if (step.nodeIndex === 0) return HEAD_LINES;
      return step.isDuplicate ? DUP_LINES : KEEP_LINES;
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

        // Bidirectional arrows between adjacent nodes
        if (i < values.length - 1) {
          const x1 = x + NODE_W;
          const x2 = nodeX(i + 1);
          const arrowMidX = (x1 + x2) / 2;
          // next pointer (forward, upper)
          g.appendChild(
            line({ x1, y1: midY - 4, x2, y2: midY - 4, stroke: "var(--viz-stroke)", "stroke-width": 1.5 })
          );
          g.appendChild(
            text("→", {
              x: arrowMidX,
              y: midY - 9,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 12,
            })
          );
          // prev pointer (backward, lower)
          g.appendChild(
            line({ x1: x2, y1: midY + 4, x2: x1, y2: midY + 4, stroke: "var(--viz-stroke)", "stroke-width": 1.5 })
          );
          g.appendChild(
            text("←", {
              x: arrowMidX,
              y: midY + 16,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 12,
            })
          );
        }
      });

      // null pointers at both ends
      const lastRight = nodeX(values.length - 1) + NODE_W;
      g.appendChild(
        line({ x1: lastRight, y1: midY - 4, x2: lastRight + 24, y2: midY - 4, stroke: "var(--viz-stroke)", "stroke-width": 1.5 })
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
      g.appendChild(
        line({ x1: START_X, y1: midY + 4, x2: START_X - 24, y2: midY + 4, stroke: "var(--viz-stroke)", "stroke-width": 1.5 })
      );
      g.appendChild(
        text("∅", {
          x: START_X - 36,
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
