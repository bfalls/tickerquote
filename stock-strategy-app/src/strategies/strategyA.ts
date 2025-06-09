import type { Fundamentals, StrategyResult } from '../types';

export function evaluateStrategyA(data: Fundamentals): StrategyResult {
  if (data.peRatio < 15 && data.debtToEquity < 1) return 'Buy';
  if (data.peRatio < 25) return 'Hold';
  return 'Sell';
}
