// import { evaluateStrategyA } from './strategyA';
// import { evaluateStrategyB } from './strategyB';
// import type { Fundamentals, StrategyResult } from '../types';

// // export type StrategyName = 'Value Strategy' | 'Balance Sheet Strategy';
// export type StrategyFn = (data: Fundamentals) => StrategyResult;

// export const strategies: Record<StrategyName, StrategyFn> = {
//   'Value Strategy': evaluateStrategyA,
//   'Balance Sheet Strategy': evaluateStrategyB,
// };

// export type StrategyName = keyof typeof strategies;


import { evaluateStrategyA } from "./strategyA";
import { evaluateStrategyB } from "./strategyB";
import type { Fundamentals, StrategyResult, StrategyFn } from "../types";
// import { strategies } from ".";

// Define valid strategy names
export const STRATEGY_NAMES = ["Value Strategy", "Balance Sheet Strategy"] as const;

export type StrategyName = typeof STRATEGY_NAMES[number];

// Map strategy names to their implementations
export const strategies: Record<StrategyName, StrategyFn> = {
  "Value Strategy": evaluateStrategyA,
  "Balance Sheet Strategy": evaluateStrategyB,
};

export function evaluateAllStrategies(
  fundamentals: Fundamentals
): Record<string, StrategyResult> {
  const results: Record<string, StrategyResult> = {};

  for (const [name, evaluator] of Object.entries(strategies)) {
    results[name] = evaluator(fundamentals);
  }

  return results;
}