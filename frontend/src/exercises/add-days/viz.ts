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
 * lockstep with exercise.js and exercise.pseudo. `parse` highlights the split,
 * the call into `parseIsoDate`, and that helper's own body; `shift`
 * highlights the offset parse and the shifted-instant arithmetic; `format`
 * highlights the final return and the `formatIsoDate` helper's own body.
 */
const JS_LINE = {
  split: 14,
  parseCall: 15,
  offset: 16,
  shift: 17,
  formatReturn: 18,
  parseIsoBody: [26, 27],
  formatIsoBody: [35, 36, 37, 38, 39],
} as const;

const PSEUDO_LINE = {
  split: 2,
  parseCall: 3,
  offset: 4,
  shift: 5,
  formatReturn: 6,
  parseIsoBody: [9, 10],
  formatIsoBody: [13, 14],
} as const;

const PARSE_LINES: CodeLines = {
  js: [JS_LINE.split, JS_LINE.parseCall, ...JS_LINE.parseIsoBody],
  pseudo: [PSEUDO_LINE.split, PSEUDO_LINE.parseCall, ...PSEUDO_LINE.parseIsoBody],
};

const SHIFT_LINES: CodeLines = {
  js: [JS_LINE.offset, JS_LINE.shift],
  pseudo: [PSEUDO_LINE.offset, PSEUDO_LINE.shift],
};

const FORMAT_LINES: CodeLines = {
  js: [JS_LINE.formatReturn, ...JS_LINE.formatIsoBody],
  pseudo: [PSEUDO_LINE.formatReturn, ...PSEUDO_LINE.formatIsoBody],
};

type DateShiftStage = "parse" | "shift" | "format";

/** Snapshot after processing a single stage of the computation. */
interface DateShiftStep {
  readonly stage: DateShiftStage;
  readonly startMs: number | null;
  readonly offsetDays: number | null;
  readonly shiftedMs: number | null;
  readonly resultDate: string | null;
}

/** Independently parses "YYYY-MM-DD" into its UTC epoch-millisecond instant (mirrors exercise.js's parseIsoDate without importing it). */
function parseIsoDateForViz(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Independently formats a UTC epoch-millisecond instant back into "YYYY-MM-DD" (mirrors exercise.js's formatIsoDate without importing it). */
function formatIsoDateForViz(ms: number): string {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a day count with an explicit leading sign, e.g. `10` -> "+10", `-5` -> "-5". */
function signed(offsetDays: number): string {
  return offsetDays >= 0 ? `+${offsetDays}` : `${offsetDays}`;
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
 * Pure step model for add-days. Independently simulates parsing the start
 * date, shifting it by the offset, and formatting the result (it does not
 * import the exercise function) and returns the trace plus the final date
 * string, so tests can assert this result matches `addDays`.
 */
export function buildSteps(input: VizInput): { steps: DateShiftStep[]; result: string } {
  const raw = input.text ?? "";
  const [isoDate, offsetStr] = raw.split(",");
  const startMs = parseIsoDateForViz(isoDate ?? "");
  const offsetDays = Number(offsetStr ?? "0");
  const shiftedMs = startMs + offsetDays * MS_PER_DAY;
  const resultDate = formatIsoDateForViz(shiftedMs);

  const steps: DateShiftStep[] = [
    { stage: "parse", startMs, offsetDays: null, shiftedMs: null, resultDate: null },
    { stage: "shift", startMs, offsetDays, shiftedMs, resultDate: null },
    { stage: "format", startMs, offsetDays, shiftedMs, resultDate },
  ];

  return { steps, result: resultDate };
}

/** Add-days visualization: the start date resolves, an offset bridge shifts it, then a second marker resolves to the formatted result. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const raw = input.text ?? "";
  const [isoDate] = raw.split(",");
  const { steps, result } = buildSteps(input);

  return {
    totalSteps: steps.length + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the untouched input; parsing starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      if (step.stage === "parse") {
        return { key: "parse", params: { date: isoDate ?? "" } };
      }
      if (step.stage === "shift") {
        return { key: "shift", params: { offset: signed(step.offsetDays ?? 0) } };
      }
      return { key: "done", params: { date: step.resultDate ?? "" } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the untouched input and highlights nothing.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      if (step.stage === "parse") return PARSE_LINES;
      if (step.stage === "shift") return SHIFT_LINES;
      return FORMAT_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const stage = step?.stage ?? null;
      const startMs = step?.startMs ?? null;
      const offsetDays = step?.offsetDays ?? null;
      const shiftedMs = step?.shiftedMs ?? null;
      const resultDate = step?.resultDate ?? null;

      const startResolved = step !== null;
      const shiftKnown = stage === "shift" || stage === "format";
      const resultResolved = stage === "format";

      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      if (shiftKnown && offsetDays !== null) {
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
          text(`${signed(offsetDays)} days`, {
            x: (LEFT_X + RIGHT_X) / 2,
            y: BRIDGE_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 14,
            "font-weight": 700,
          })
        );
      }

      const startFill = stage === "parse" ? "var(--viz-mid)" : startResolved ? "var(--viz-found)" : "var(--viz-cell)";
      g.appendChild(
        circle({
          cx: LEFT_X,
          cy: NODE_Y,
          r: NODE_R,
          fill: startFill,
          stroke: "var(--viz-stroke)",
          "stroke-width": 1.5,
        })
      );
      g.appendChild(
        text(isoDate ?? "", {
          x: LEFT_X,
          y: DATE_LABEL_Y,
          "text-anchor": "middle",
          fill: "var(--viz-text)",
          "font-size": 13,
          "font-weight": 600,
        })
      );
      if (startMs !== null) {
        g.appendChild(
          text(`day ${Math.floor(startMs / MS_PER_DAY)}`, {
            x: LEFT_X,
            y: EPOCH_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 11,
          })
        );
      }

      const resultFill = resultResolved ? "var(--viz-found)" : shiftKnown ? "var(--viz-mid)" : "var(--viz-cell)";
      g.appendChild(
        circle({
          cx: RIGHT_X,
          cy: NODE_Y,
          r: NODE_R,
          fill: resultFill,
          stroke: "var(--viz-stroke)",
          "stroke-width": 1.5,
        })
      );
      g.appendChild(
        text(resultResolved && resultDate !== null ? resultDate : "?", {
          x: RIGHT_X,
          y: DATE_LABEL_Y,
          "text-anchor": "middle",
          fill: "var(--viz-text)",
          "font-size": 13,
          "font-weight": 600,
        })
      );
      if (resultResolved && shiftedMs !== null) {
        g.appendChild(
          text(`day ${Math.floor(shiftedMs / MS_PER_DAY)}`, {
            x: RIGHT_X,
            y: EPOCH_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 11,
          })
        );
      }

      if (resultResolved && resultDate !== null) {
        g.appendChild(
          text(`result = ${resultDate}`, {
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
