import { clear, circle, line, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Source lines that "execute" at each stage, by code mode. 1-based, kept in
 * lockstep with exercise.js and exercise.pseudo. `parseFirst`/`parseSecond`
 * each highlight the destructured split, the call into `parseIsoDate`, and
 * that helper's own body; `compute` highlights the final rounded-difference
 * return.
 */
const JS_LINE = {
  split: 13,
  parseFirstCall: 14,
  parseSecondCall: 15,
  computeReturn: 16,
  parseIsoBody: [24, 25],
} as const;

const PSEUDO_LINE = {
  split: 2,
  parseFirstCall: 3,
  parseSecondCall: 4,
  computeReturn: 5,
  parseIsoBody: [8, 9],
} as const;

const PARSE_FIRST_LINES: CodeLines = {
  js: [JS_LINE.split, JS_LINE.parseFirstCall, ...JS_LINE.parseIsoBody],
  pseudo: [PSEUDO_LINE.split, PSEUDO_LINE.parseFirstCall, ...PSEUDO_LINE.parseIsoBody],
};

const PARSE_SECOND_LINES: CodeLines = {
  js: [JS_LINE.parseSecondCall, ...JS_LINE.parseIsoBody],
  pseudo: [PSEUDO_LINE.parseSecondCall, ...PSEUDO_LINE.parseIsoBody],
};

const COMPUTE_LINES: CodeLines = {
  js: [JS_LINE.computeReturn],
  pseudo: [PSEUDO_LINE.computeReturn],
};

type DateDiffStage = "parseFirst" | "parseSecond" | "compute";

/** Snapshot after processing a single stage of the computation. */
interface DateDiffStep {
  readonly stage: DateDiffStage;
  readonly firstMs: number | null;
  readonly secondMs: number | null;
  readonly days: number | null;
}

/** Independently parses "YYYY-MM-DD" into its UTC epoch-millisecond instant (mirrors exercise.js's parseIsoDate without importing it). */
function parseIsoDateForViz(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

const VIEW_W = 480;
const VIEW_H = 190;
const LEFT_X = 110;
const RIGHT_X = 370;
const NODE_Y = 80;
const NODE_R = 30;
const DATE_LABEL_Y = NODE_Y + NODE_R + 26;
const EPOCH_LABEL_Y = DATE_LABEL_Y + 18;
const BRIDGE_LABEL_Y = NODE_Y - NODE_R - 14;
const RESULT_Y = VIEW_H - 14;

/**
 * Pure step model for date-difference. Independently simulates parsing both
 * dates and computing their difference (it does not import the exercise
 * function) and returns the trace plus the final day count, so tests can
 * assert this result matches `dateDifference`.
 */
export function buildSteps(input: VizInput): { steps: DateDiffStep[]; result: number } {
  const raw = input.text ?? "";
  const [firstDate, secondDate] = raw.split(",");
  const firstMs = parseIsoDateForViz(firstDate ?? "");
  const secondMs = parseIsoDateForViz(secondDate ?? "");
  const days = Math.round(Math.abs(secondMs - firstMs) / MS_PER_DAY);

  const steps: DateDiffStep[] = [
    { stage: "parseFirst", firstMs, secondMs: null, days: null },
    { stage: "parseSecond", firstMs, secondMs, days: null },
    { stage: "compute", firstMs, secondMs, days },
  ];

  return { steps, result: days };
}

/** Date-difference visualization: two date markers on a timeline, resolved one at a time, then bridged by their day count. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const raw = input.text ?? "";
  const [firstDate, secondDate] = raw.split(",");
  const { steps, result } = buildSteps(input);

  return {
    totalSteps: steps.length + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the untouched dates; parsing starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      if (step.stage === "parseFirst") {
        return { key: "parseFirst", params: { date: firstDate ?? "" } };
      }
      if (step.stage === "parseSecond") {
        return { key: "parseSecond", params: { date: secondDate ?? "" } };
      }
      return { key: "done", params: { days: step.days ?? 0 } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the untouched dates and highlights nothing.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      if (step.stage === "parseFirst") return PARSE_FIRST_LINES;
      if (step.stage === "parseSecond") return PARSE_SECOND_LINES;
      return COMPUTE_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const firstResolved = step !== null;
      const secondResolved = step !== null && step.stage !== "parseFirst";
      const bridgeStep = step !== null && step.stage === "compute" ? step : null;

      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      if (bridgeStep !== null) {
        g.appendChild(
          line({
            x1: LEFT_X + NODE_R,
            y1: NODE_Y,
            x2: RIGHT_X - NODE_R,
            y2: NODE_Y,
            stroke: "var(--viz-mid-label)",
            "stroke-width": 2,
          })
        );
        g.appendChild(
          text(`${bridgeStep.days} days`, {
            x: (LEFT_X + RIGHT_X) / 2,
            y: BRIDGE_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 14,
            "font-weight": 700,
          })
        );
      }

      const nodes: Array<{
        x: number;
        date: string;
        ms: number | null;
        resolved: boolean;
        active: boolean;
      }> = [
        {
          x: LEFT_X,
          date: firstDate ?? "",
          ms: step ? step.firstMs : null,
          resolved: firstResolved,
          active: step !== null && step.stage === "parseFirst",
        },
        {
          x: RIGHT_X,
          date: secondDate ?? "",
          ms: step ? step.secondMs : null,
          resolved: secondResolved,
          active: step !== null && step.stage === "parseSecond",
        },
      ];

      for (const node of nodes) {
        let fill = "var(--viz-cell)";
        if (node.active) fill = "var(--viz-mid)";
        else if (node.resolved) fill = "var(--viz-found)";

        g.appendChild(
          circle({
            cx: node.x,
            cy: NODE_Y,
            r: NODE_R,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(node.date, {
            x: node.x,
            y: DATE_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 13,
            "font-weight": 600,
          })
        );
        if (node.resolved && node.ms !== null) {
          g.appendChild(
            text(`day ${Math.floor(node.ms / MS_PER_DAY)}`, {
              x: node.x,
              y: EPOCH_LABEL_Y,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 11,
            })
          );
        }
      }

      if (bridgeStep !== null) {
        g.appendChild(
          text(`result = ${bridgeStep.days} days`, {
            x: VIEW_W / 2,
            y: RESULT_Y,
            "text-anchor": "middle",
            fill: "var(--viz-found)",
            "font-size": 15,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
