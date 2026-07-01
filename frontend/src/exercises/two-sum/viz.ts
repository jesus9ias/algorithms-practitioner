import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each phase of the algorithm, by code mode.
 * 1-based, kept in lockstep with exercise.js and exercise.pseudo. A step marks
 * every line involved in it (loop header + body), so lines may be non-contiguous.
 */
const JS_LINE = {
  loopCheck: 13,
  complement: 14,
  hasCheck: 15,
  found: 16,
  insert: 18,
} as const;

const PSEUDO_LINE = {
  loopCheck: 3,
  complement: 4,
  hasCheck: 5,
  found: 6,
  insert: 7,
} as const;

const CHECK_LINES: CodeLines = {
  js: [JS_LINE.loopCheck, JS_LINE.complement, JS_LINE.hasCheck],
  pseudo: [PSEUDO_LINE.loopCheck, PSEUDO_LINE.complement, PSEUDO_LINE.hasCheck],
};
const FOUND_LINES: CodeLines = {
  js: [JS_LINE.found],
  pseudo: [PSEUDO_LINE.found],
};
const INSERT_LINES: CodeLines = {
  js: [JS_LINE.insert],
  pseudo: [PSEUDO_LINE.insert],
};

type StepKind = "check" | "found" | "insert" | "done";

interface SeenEntry {
  readonly value: number;
  readonly index: number;
}

/** Snapshot of the whole algorithm state at one step. */
export interface TwoSumStep {
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
  /** Index currently being processed, else -1. */
  readonly index: number;
  /** Complement needed at this index (target - value), else null. */
  readonly complement: number | null;
  /** Hash map (value -> index) built so far — insertion order. */
  readonly seen: readonly SeenEntry[];
  /** Index of the complement's match in `seen`, else null. */
  readonly matchIndex: number | null;
  /** The pair of indices found so far, empty until a match is found. */
  readonly result: readonly number[];
}

const VIEW_W = 680;
const GAP = 8;
const INPUT_LABEL_Y = 24;
const INPUT_Y = 40;
const INPUT_H = 34;
const MAP_LABEL_Y = 100;
const MAP_Y = 108;
const MAP_H = 34;
const MAP_X = 12;
const CHIP_W = 58;
const CHIP_GAP = 10;
const RESULT_LABEL_Y = 168;
const RESULT_Y = 176;
const RESULT_CHIP_W = 40;
const VIEW_H = RESULT_Y + RESULT_CHIP_W + 16;

function seenSnapshot(seen: Map<number, number>): SeenEntry[] {
  return [...seen].map(([value, index]) => ({ value, index }));
}

/**
 * Pure step model for two-sum. Independently runs the same hash-map scan as
 * `twoSum` (it does not import the exercise function), recording one "check"
 * step per index (looking up its complement) followed by either a terminal
 * "found" step or an "insert" step, plus a terminal "done" step when the loop
 * completes with no pair. Returns the trace and the final result, so tests can
 * assert this result matches `twoSum`.
 */
export function buildSteps(input: VizInput): { steps: TwoSumStep[]; result: number[] } {
  const values = [...input.values];
  const target = input.target ?? 0;
  const steps: TwoSumStep[] = [];
  const seen = new Map<number, number>();

  for (let i = 0; i < values.length; i += 1) {
    const complement = target - values[i];
    steps.push({
      kind: "check",
      params: { index: i, value: values[i], complement },
      index: i,
      complement,
      seen: seenSnapshot(seen),
      matchIndex: null,
      result: [],
    });

    if (seen.has(complement)) {
      const matchIndex = seen.get(complement)!;
      const result = [matchIndex, i];
      steps.push({
        kind: "found",
        params: { matchIndex, index: i, complement },
        index: i,
        complement,
        seen: seenSnapshot(seen),
        matchIndex,
        result,
      });
      return { steps, result };
    }

    seen.set(values[i], i);
    steps.push({
      kind: "insert",
      params: { value: values[i], index: i },
      index: i,
      complement,
      seen: seenSnapshot(seen),
      matchIndex: null,
      result: [],
    });
  }

  steps.push({
    kind: "done",
    params: {},
    index: -1,
    complement: null,
    seen: seenSnapshot(seen),
    matchIndex: null,
    result: [],
  });

  return { steps, result: [] };
}

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  check: CHECK_LINES,
  found: FOUND_LINES,
  insert: INSERT_LINES,
  done: null,
};

/**
 * Two-sum visualization: a two-zone diagram — the input array with a scanning
 * cursor, and the live hash map (value → index) it builds — re-painted from a
 * snapshot at each step, plus a result strip for the matched pair.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];

  // Stable layout dimensions, derived once from the full input so the canvas
  // does not jump between steps.
  const count = Math.max(values.length, 1);
  const inputCellW = (VIEW_W - GAP * (count + 1)) / count;
  const inputX = (index: number): number => GAP + index * (inputCellW + GAP);

  const INITIAL: TwoSumStep = {
    kind: "check",
    params: {},
    index: -1,
    complement: null,
    seen: [],
    matchIndex: null,
    result: [],
  };
  const renderable: TwoSumStep[] = [INITIAL, ...steps];

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-algorithm state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return { key: step.kind, params: step.params };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the initial state; nothing executes.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return LINES_BY_KIND[step.kind];
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      const sectionLabel = (label: string, y: number): void => {
        g.appendChild(
          text(label, {
            x: MAP_X,
            y,
            fill: "var(--viz-muted)",
            "font-size": 13,
            "font-weight": 600,
          })
        );
      };

      const chip = (
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        fill: string,
        sub?: string
      ): void => {
        g.appendChild(
          rect({ x, y, width: w, height: h, rx: 6, fill, stroke: "var(--viz-stroke)", "stroke-width": 1.5 })
        );
        g.appendChild(
          text(label, {
            x: x + w / 2,
            y: y + h / 2 + (sub ? 0 : 5),
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
        if (sub) {
          g.appendChild(
            text(sub, {
              x: x + w / 2,
              y: y + h - 6,
              "text-anchor": "middle",
              fill: "var(--viz-muted)",
              "font-size": 11,
            })
          );
        }
      };

      // Zone 1 — input array with a scanning cursor.
      sectionLabel("input", INPUT_LABEL_Y);
      values.forEach((value, index) => {
        let fill = "var(--viz-cell)";
        if (step.result.includes(index)) fill = "var(--viz-found)";
        else if (index === step.index) fill = "var(--viz-mid)";
        else if (index < step.index) fill = "var(--viz-range)";
        g.appendChild(
          rect({
            x: inputX(index),
            y: INPUT_Y,
            width: inputCellW,
            height: INPUT_H,
            rx: 6,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(String(value), {
            x: inputX(index) + inputCellW / 2,
            y: INPUT_Y + INPUT_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 16,
            "font-weight": 600,
          })
        );
      });

      // Zone 2 — hash map (value -> index) built so far.
      sectionLabel("hash map (value → index)", MAP_LABEL_Y);
      if (step.seen.length === 0) {
        g.appendChild(
          text("(empty)", { x: MAP_X, y: MAP_Y + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else {
        step.seen.forEach((entry, idx) => {
          const x = MAP_X + idx * (CHIP_W + CHIP_GAP);
          const isMatch = step.kind === "found" && entry.index === step.matchIndex;
          chip(
            x,
            MAP_Y,
            CHIP_W,
            MAP_H,
            String(entry.value),
            isMatch ? "var(--viz-found)" : "var(--viz-cell)",
            `@${entry.index}`
          );
        });
      }

      // Zone 3 — result (the matched pair of indices, or empty).
      sectionLabel("result — indices", RESULT_LABEL_Y);
      if (step.result.length === 0) {
        g.appendChild(
          text("(none yet)", { x: MAP_X, y: RESULT_Y + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else {
        step.result.forEach((idx, i) => {
          const x = MAP_X + i * (RESULT_CHIP_W + CHIP_GAP);
          chip(x, RESULT_Y, RESULT_CHIP_W, RESULT_CHIP_W - 6, String(idx), "var(--viz-found)");
        });
      }

      svg.appendChild(g);
    },
  };
};
