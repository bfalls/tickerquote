import React from 'react';
import type { Fundamentals, StrategyResult } from '../types';

interface Props {
  stocks: Fundamentals[];
  evaluate: (f: Fundamentals) => StrategyResult;
}

export const StockTable: React.FC<Props> = ({ stocks, evaluate }) => {
  return (
    <table className="w-full text-left border mt-4">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2">Symbol</th>
          <th className="p-2">P/E</th>
          <th className="p-2">P/B</th>
          <th className="p-2">D/E</th>
          <th className="p-2">Strategy Result</th>
        </tr>
      </thead>
      <tbody>
        {stocks.map((s) => (
          <tr key={s.symbol}>
            <td className="p-2">{s.symbol}</td>
            <td className="p-2">{s.peRatio}</td>
            <td className="p-2">{s.pbRatio}</td>
            <td className="p-2">{s.debtToEquity}</td>
            <td className="p-2">{evaluate(s)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
