import { strategies } from "../strategies";

export type StrategyName = keyof typeof strategies;

export interface Fundamentals {
  symbol: string;
  peRatio: number;
  pbRatio: number;
  debtToEquity: number;
  [key: string]: number | string;
}

export type StrategyResult = 'Buy' | 'Hold' | 'Sell';
export type StrategyFn = (fundamentals: Fundamentals) => StrategyResult;
