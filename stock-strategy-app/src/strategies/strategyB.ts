import type { Fundamentals, StrategyResult } from '../types';

export function evaluateStrategyB(data: Fundamentals): StrategyResult {
  if (data.pbRatio < 1 && data.debtToEquity < 0.8) return 'Buy';
  if (data.pbRatio < 2) return 'Hold';
  return 'Sell';
}
