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
import type { StrategyFn } from "../types";

// Define valid strategy names
export const STRATEGY_NAMES = ["Value Strategy", "Balance Sheet Strategy"] as const;

export type StrategyName = typeof STRATEGY_NAMES[number];

// Map strategy names to their implementations
export const strategies: Record<StrategyName, StrategyFn> = {
  "Value Strategy": evaluateStrategyA,
  "Balance Sheet Strategy": evaluateStrategyB,
};
