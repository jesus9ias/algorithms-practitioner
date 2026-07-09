import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" at each step kind, by code mode. 1-based, kept
 * in lockstep with exercise.js and exercise.pseudo. The `coin > i` skip guard
 * (js line 19, pseudo lines 7-8) has no dedicated step — it is a silent,
 * uninteresting short-circuit — so those lines never appear below; only the
 * base case, a coin actually tried against dp[i], and the terminal lookup do.
 */
const JS_LINE = {
  dpInit: 14,
  base: 15,
  loopHeader: 17,
  coinLoopHeader: 18,
  candidateCompute: 20,
  updateCheck: 21,
  updateAssign: 22,
  returnValue: 27,
} as const;

const PSEUDO_LINE = {
  dpInit: 2,
  base: 3,
  loopHeader: 5,
  coinLoopHeader: 6,
  candidateCompute: 9,
  updateCheck: 10,
  updateAssign: 11,
  returnCheck: 13,
  returnImpossible: 14,
  returnValue: 15,
} as const;

const INIT_LINES: CodeLines = {
  js: [JS_LINE.dpInit, JS_LINE.base],
  pseudo: [PSEUDO_LINE.dpInit, PSEUDO_LINE.base],
};
const UPDATE_LINES: CodeLines = {
  js: [
    JS_LINE.loopHeader,
    JS_LINE.coinLoopHeader,
    JS_LINE.candidateCompute,
    JS_LINE.updateCheck,
    JS_LINE.updateAssign,
  ],
  pseudo: [
    PSEUDO_LINE.loopHeader,
    PSEUDO_LINE.coinLoopHeader,
    PSEUDO_LINE.candidateCompute,
    PSEUDO_LINE.updateCheck,
    PSEUDO_LINE.updateAssign,
  ],
};
const NO_CHANGE_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.coinLoopHeader, JS_LINE.candidateCompute, JS_LINE.updateCheck],
  pseudo: [
    PSEUDO_LINE.loopHeader,
    PSEUDO_LINE.coinLoopHeader,
    PSEUDO_LINE.candidateCompute,
    PSEUDO_LINE.updateCheck,
  ],
};
const DONE_LINES: CodeLines = {
  js: [JS_LINE.returnValue],
  pseudo: [PSEUDO_LINE.returnCheck, PSEUDO_LINE.returnImpossible, PSEUDO_LINE.returnValue],
};

export type CoinChangeStepKind = "init" | "update" | "noChange" | "done";

/** Snapshot of the dp table and the coin test being performed at one step. */
export interface CoinChangeStep {
  readonly kind: CoinChangeStepKind;
  /** dp-table index (amount) this step concerns. */
  readonly index: number;
  /** Coin being tried, or null for the init/done steps. */
  readonly coin: number | null;
  /** dp[index - coin] + 1, or null when that sub-amount is unreachable; null for init/done. */
  readonly candidate: number | null;
  /** dp[index] before this test, or null if unreachable so far. */
  readonly before: number | null;
  /** dp[index] after this test (equals before when unchanged). */
  readonly after: number | null;
  /** Snapshot of the whole dp table after this step; null entries are unreachable. */
  readonly dp: readonly (number | null)[];
}

const VIEW_W = 640;
const VIEW_H = 175;
const CELL_GAP = 8;
const CELL_Y = 50;
const CELL_H = 48;
const POINTER_Y = 30;
const LABEL_Y = 130;
const COIN_LABEL_Y = 155;

/**
 * Pure step model for bottom-up coin-change DP. Independently simulates the
 * tabulation (it does not import the exercise function): dp[0] = 0, then for
 * every amount 1..amount and every coin that fits, it records whether trying
 * that coin improves dp[amount]. Returns the trace plus the final result
 * (minimum coins, or -1), so tests can assert this matches `coinChange`.
 */
export function buildSteps(input: VizInput): { steps: CoinChangeStep[]; result: number } {
  const coins = [...input.values];
  const amount = Math.max(input.target ?? 0, 0);

  const dp: (number | null)[] = new Array(amount + 1).fill(null);
  dp[0] = 0;
  const steps: CoinChangeStep[] = [
    { kind: "init", index: 0, coin: null, candidate: null, before: null, after: 0, dp: [...dp] },
  ];

  for (let i = 1; i <= amount; i += 1) {
    for (const coin of coins) {
      if (coin > i) continue;
      const sub = dp[i - coin];
      const candidate = sub === null ? null : sub + 1;
      const before = dp[i];
      const improves = candidate !== null && (before === null || candidate < before);
      if (improves) {
        dp[i] = candidate;
      }
      steps.push({
        kind: improves ? "update" : "noChange",
        index: i,
        coin,
        candidate,
        before,
        after: dp[i],
        dp: [...dp],
      });
    }
  }

  const result = dp[amount] === null ? -1 : dp[amount];
  steps.push({
    kind: "done",
    index: amount,
    coin: null,
    candidate: null,
    before: dp[amount],
    after: dp[amount],
    dp: [...dp],
  });

  return { steps, result };
}

/** Renders a null dp cell as "∞" (unreachable with the coins tried so far). */
function cellLabel(value: number | null): string {
  return value === null ? "∞" : String(value);
}

/**
 * Coin-change visualization: a dp-table row of cells for amounts 0..amount
 * (reusing the memo-table archetype seeded by climbing-stairs/fibonacci),
 * filled as the tabulation runs, plus a coin strip showing which denomination
 * is being tried at each step.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const coins = [...input.values];
  const { steps, result } = buildSteps(input);
  const amount = Math.max(input.target ?? 0, 0);
  const count = amount + 1;

  const INITIAL_STEP: CoinChangeStep = {
    kind: "init",
    index: -1,
    coin: null,
    candidate: null,
    before: null,
    after: null,
    dp: new Array(count).fill(null),
  };
  const renderable: CoinChangeStep[] = [INITIAL_STEP, ...steps];

  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-computation state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "init":
          return { key: "init", params: { value: step.after ?? 0 } };
        case "update":
          return {
            key: "update",
            params: {
              index: step.index,
              coin: step.coin ?? 0,
              subIndex: step.index - (step.coin ?? 0),
              candidate: step.candidate ?? 0,
              before: step.before === null ? "∞" : step.before,
              after: step.after ?? 0,
            },
          };
        case "noChange":
          return {
            key: "noChange",
            params: {
              index: step.index,
              coin: step.coin ?? 0,
              subIndex: step.index - (step.coin ?? 0),
              candidate: step.candidate === null ? "∞" : step.candidate,
              before: step.before === null ? "∞" : step.before,
            },
          };
        case "done":
          return result === -1
            ? { key: "doneImpossible", params: { amount } }
            : { key: "doneFound", params: { amount, result } };
        default:
          return null;
      }
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-computation state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "init":
          return INIT_LINES;
        case "update":
          return UPDATE_LINES;
        case "noChange":
          return NO_CHANGE_LINES;
        case "done":
          return DONE_LINES;
        default:
          return null;
      }
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      const subIndex = step.coin !== null ? step.index - step.coin : -1;

      for (let index = 0; index < count; index += 1) {
        const value = step.dp[index] ?? null;
        const isActive = index === step.index;
        const isContributing = index === subIndex;
        let fill = "var(--viz-cell)";
        if (isActive) {
          fill = "var(--viz-found)";
        } else if (isContributing) {
          fill = "var(--viz-mid)";
        } else if (value !== null) {
          fill = "var(--viz-range)";
        }

        g.appendChild(
          rect({
            x: cellX(index),
            y: CELL_Y,
            width: cellW,
            height: CELL_H,
            rx: 6,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(cellLabel(value), {
            x: cellX(index) + cellW / 2,
            y: CELL_Y + CELL_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 16,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(index), {
            x: cellX(index) + cellW / 2,
            y: LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 12,
          })
        );
      }

      if (step.index >= 0 && step.index < count) {
        g.appendChild(
          text("dp", {
            x: cellX(step.index) + cellW / 2,
            y: POINTER_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 13,
            "font-weight": 700,
          })
        );
      }

      g.appendChild(
        text(
          coins.length === 0
            ? "coins: (none)"
            : `coins: ${coins.map((c) => (c === step.coin ? `[${c}]` : String(c))).join(", ")}`,
          {
            x: CELL_GAP,
            y: COIN_LABEL_Y,
            fill: "var(--viz-muted)",
            "font-size": 13,
            "font-weight": 600,
          }
        )
      );

      svg.appendChild(g);
    },
  };
};
