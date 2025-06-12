import type { Fundamentals, StrategyResult } from '../types';

export function evaluateStrategyB(data: Fundamentals): StrategyResult {
  if (data.metric.pb < 1 && data.metric["totalDebt/totalEquityAnnual"] < 0.8)
    return "Buy";
  if (data.metric.pb < 2) return "Hold";
  return 'Sell';
}
