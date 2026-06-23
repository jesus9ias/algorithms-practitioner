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
  countLoop: 14,
  countUpdate: 15,
  bucketLoop: 19,
  bucketPush: 20,
  collectOuter: 24,
  collectInner: 25,
  collectPush: 29,
} as const;

const PSEUDO_LINE = {
  countLoop: 3,
  countUpdate: 4,
  bucketLoop: 7,
  bucketPush: 8,
  collectOuter: 11,
  collectInner: 12,
  collectPush: 15,
} as const;

const COUNT_LINES: CodeLines = {
  js: [JS_LINE.countLoop, JS_LINE.countUpdate],
  pseudo: [PSEUDO_LINE.countLoop, PSEUDO_LINE.countUpdate],
};
const BUCKET_LINES: CodeLines = {
  js: [JS_LINE.bucketLoop, JS_LINE.bucketPush],
  pseudo: [PSEUDO_LINE.bucketLoop, PSEUDO_LINE.bucketPush],
};
const COLLECT_LINES: CodeLines = {
  js: [JS_LINE.collectOuter, JS_LINE.collectInner, JS_LINE.collectPush],
  pseudo: [PSEUDO_LINE.collectOuter, PSEUDO_LINE.collectInner, PSEUDO_LINE.collectPush],
};

type StepKind = "count" | "bucket" | "collect" | "done";

interface FreqEntry {
  readonly value: number;
  readonly count: number;
}

/** Snapshot of the whole algorithm state at one step. */
export interface TopKStep {
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
  /** Input index being counted during the count phase, else -1. */
  readonly countIndex: number;
  /** Frequency map discovered so far (insertion order), i.e. the hash table. */
  readonly entries: readonly FreqEntry[];
  /** Value being counted / placed / collected at this step, else null. */
  readonly activeValue: number | null;
  /** Bucket frequency being filled or read at this step, else -1. */
  readonly activeFreq: number;
  /** buckets[freq] = values placed in that frequency bucket so far. */
  readonly buckets: readonly (readonly number[])[];
  /** Result collected so far. */
  readonly collected: readonly number[];
}

const VIEW_W = 680;
const GAP = 8;
const INPUT_Y = 40;
const INPUT_H = 34;
const INPUT_LABEL_Y = 24;
const MAP_LABEL_Y = 96;
const MAP_Y = 104;
const MAP_H = 34;
const MAP_X = 12;
const CHIP_W = 58;
const CHIP_GAP = 10;
const BUCKET_LABEL_Y = 168;
const BUCKET_TOP = 176;
const BUCKET_ROW_H = 36;
const BUCKET_LABEL_W = 52;
const BUCKET_CHIP_W = 40;
const BUCKET_CHIP_GAP = 8;
const RESULT_CHIP_W = 40;

function entriesSnapshot(counts: Map<number, number>): FreqEntry[] {
  return [...counts].map(([value, count]) => ({ value, count }));
}

function bucketsSnapshot(buckets: readonly number[][]): number[][] {
  return buckets.map((b) => [...b]);
}

/**
 * Pure step model for top-k-frequent. Independently runs the same bucket-sort
 * pipeline as `topKFrequent` (it does not import the exercise function),
 * recording one step per counted element, per value bucketed, and per value
 * collected, plus a terminal "done" step. Returns the trace and the final
 * top-k array, so tests can assert this result matches `topKFrequent`.
 */
export function buildSteps(input: VizInput): { steps: TopKStep[]; result: number[] } {
  const values = [...input.values];
  const n = values.length;
  // `k` rides on the optional numeric target; with none, fall back to returning
  // every distinct value (k = array length is always ≥ the unique count).
  const k = input.target ?? n;
  const steps: TopKStep[] = [];

  // Phase 1 — count each value's frequency (the hash map).
  const counts = new Map<number, number>();
  for (let i = 0; i < n; i += 1) {
    const value = values[i];
    counts.set(value, (counts.get(value) ?? 0) + 1);
    steps.push({
      kind: "count",
      params: { value, count: counts.get(value)! },
      countIndex: i,
      entries: entriesSnapshot(counts),
      activeValue: value,
      activeFreq: -1,
      buckets: [],
      collected: [],
    });
  }

  const finalEntries = entriesSnapshot(counts);
  const maxFreq = finalEntries.reduce((m, e) => Math.max(m, e.count), 0);

  // Phase 2 — scatter each value into the bucket indexed by its frequency.
  const buckets: number[][] = Array.from({ length: maxFreq + 1 }, () => []);
  for (const { value, count } of finalEntries) {
    buckets[count].push(value);
    steps.push({
      kind: "bucket",
      params: { value, count },
      countIndex: -1,
      entries: finalEntries,
      activeValue: value,
      activeFreq: count,
      buckets: bucketsSnapshot(buckets),
      collected: [],
    });
  }

  // Phase 3 — read buckets from the highest frequency down until k collected.
  const result: number[] = [];
  let stop = false;
  for (let freq = maxFreq; freq >= 1 && !stop; freq -= 1) {
    for (const value of buckets[freq]) {
      if (result.length >= k) {
        stop = true;
        break;
      }
      result.push(value);
      steps.push({
        kind: "collect",
        params: { value, freq, position: result.length },
        countIndex: -1,
        entries: finalEntries,
        activeValue: value,
        activeFreq: freq,
        buckets: bucketsSnapshot(buckets),
        collected: [...result],
      });
    }
  }

  steps.push({
    kind: "done",
    params: { count: result.length },
    countIndex: -1,
    entries: finalEntries,
    activeValue: null,
    activeFreq: -1,
    buckets: bucketsSnapshot(buckets),
    collected: [...result],
  });

  return { steps, result };
}

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  count: COUNT_LINES,
  bucket: BUCKET_LINES,
  collect: COLLECT_LINES,
  done: null,
};

/**
 * Top-k-frequent visualization: a three-zone diagram — the input array with a
 * counting cursor, the live frequency map (hash table), and the frequency
 * buckets feeding a result strip — re-painted from a snapshot at each step.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];

  // Stable layout dimensions, derived once from the full input so the canvas
  // does not jump between steps.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const maxFreq = [...counts.values()].reduce((m, c) => Math.max(m, c), 0);

  const count = Math.max(values.length, 1);
  const inputCellW = (VIEW_W - GAP * (count + 1)) / count;
  const inputX = (index: number): number => GAP + index * (inputCellW + GAP);

  const bucketsHeight = maxFreq * BUCKET_ROW_H;
  const resultLabelY = BUCKET_TOP + bucketsHeight + 22;
  const resultY = resultLabelY + 8;
  const viewH = resultY + RESULT_CHIP_W + 16;

  const INITIAL: TopKStep = {
    kind: "count",
    params: {},
    countIndex: -1,
    entries: [],
    activeValue: null,
    activeFreq: -1,
    buckets: [],
    collected: [],
  };
  const renderable: TopKStep[] = [INITIAL, ...steps];

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
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${viewH}`);
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

      // Zone 1 — input array with a counting cursor.
      const counting = step.kind === "count";
      const counted = step.kind === "bucket" || step.kind === "collect" || step.kind === "done";
      sectionLabel("input", INPUT_LABEL_Y);
      values.forEach((value, index) => {
        let fill = "var(--viz-cell)";
        if (counted) fill = "var(--viz-range)";
        else if (counting) {
          if (index < step.countIndex) fill = "var(--viz-range)";
          else if (index === step.countIndex) fill = "var(--viz-mid)";
        }
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

      // Zone 2 — frequency map (the hash table): one chip per unique value.
      sectionLabel("frequency map (value ×count)", MAP_LABEL_Y);
      if (step.entries.length === 0) {
        g.appendChild(
          text("(empty)", { x: MAP_X, y: MAP_Y + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else {
        step.entries.forEach((entry, idx) => {
          const x = MAP_X + idx * (CHIP_W + CHIP_GAP);
          const active =
            step.activeValue === entry.value && (step.kind === "count" || step.kind === "bucket");
          chip(x, MAP_Y, CHIP_W, MAP_H, String(entry.value), active ? "var(--viz-mid)" : "var(--viz-cell)", `×${entry.count}`);
        });
      }

      // Zone 3 — buckets indexed by frequency, highest at the top.
      sectionLabel("buckets by frequency", BUCKET_LABEL_Y);
      let rowIdx = 0;
      for (let freq = maxFreq; freq >= 1; freq -= 1, rowIdx += 1) {
        const y = BUCKET_TOP + rowIdx * BUCKET_ROW_H;
        const rowActive = step.activeFreq === freq;
        g.appendChild(
          text(`×${freq}`, {
            x: MAP_X,
            y: y + BUCKET_CHIP_W / 2 + 1,
            fill: rowActive ? "var(--viz-mid-label)" : "var(--viz-muted)",
            "font-size": 13,
            "font-weight": rowActive ? 700 : 600,
          })
        );
        const bucketValues = step.buckets[freq] ?? [];
        bucketValues.forEach((value, col) => {
          const x = BUCKET_LABEL_W + col * (BUCKET_CHIP_W + BUCKET_CHIP_GAP);
          const isCollected = step.collected.includes(value);
          const isActive = rowActive && step.activeValue === value;
          let fill = "var(--viz-cell)";
          if (isCollected) fill = "var(--viz-found)";
          if (isActive) fill = "var(--viz-mid)";
          chip(x, y, BUCKET_CHIP_W, BUCKET_CHIP_W - 6, String(value), fill);
        });
      }

      // Zone 4 — result strip (the collected top-k).
      sectionLabel("result — top k (highest frequency first)", resultLabelY);
      if (step.collected.length === 0) {
        g.appendChild(
          text("(empty)", { x: MAP_X, y: resultY + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else {
        step.collected.forEach((value, idx) => {
          const x = MAP_X + idx * (RESULT_CHIP_W + BUCKET_CHIP_GAP);
          chip(x, resultY, RESULT_CHIP_W, RESULT_CHIP_W - 6, String(value), "var(--viz-found)");
        });
      }

      svg.appendChild(g);
    },
  };
};
