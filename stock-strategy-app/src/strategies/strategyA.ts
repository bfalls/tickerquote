import type { Fundamentals, StrategyResult } from '../types';

export function evaluateStrategyA(data: Fundamentals): StrategyResult {
  if (data.metric.peTTM < 15 && data.metric["totalDebt/totalEquityAnnual"] < 1)
    return "Buy";
  if (data.metric.peTTM < 25) return "Hold";
  return 'Sell';
}
