import React from "react";
import type { Fundamentals, StrategyResult } from "../types";
import { evaluateAllStrategies } from "../strategies";
import "./StockTable.css";

interface Props {
  stocks: Fundamentals[];
  filters?: {
    peRatio?: number;
    pbRatio?: number;
    debtToEquity?: number;
  };
}

const passesFilters = (stock: Fundamentals, filters: Props["filters"] = {}) => {
  const { peRatio, pbRatio, debtToEquity } = filters;
  const metric = stock.metric;
  return (
    (peRatio === undefined || metric.peTTM <= peRatio) &&
    (pbRatio === undefined || metric.pb <= pbRatio) &&
    (debtToEquity === undefined ||
      metric["totalDebt/totalEquityAnnual"] <= debtToEquity)
  );
};

export const StockTable: React.FC<Props> = ({ stocks, filters }) => {
  const filtered = stocks.filter((stock) => passesFilters(stock, filters));

  return (
    <div className="table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>P/E Ratio</th>
            <th>P/B Ratio</th>
            <th>Debt/Equity</th>
            <th>Value</th>
            <th>Balance Sheet</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((stock) => {
            const results = evaluateAllStrategies(stock);
            const metric = stock.metric;
            return (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>
                <td>{metric.peTTM ?? "-"}</td>
                <td>{metric.pb ?? "-"}</td>
                <td className="border px-4 py-2">
                  {metric["totalDebt/totalEquityAnnual"]}
                </td>
                <td className="border px-4 py-2">
                  {results["Value Strategy"]}
                </td>
                <td className="border px-4 py-2">
                  {results["Balance Sheet Strategy"]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  //   return (
  //     <div className="overflow-x-auto">
  //       <table className="min-w-full table-auto border border-gray-300">
  //         <thead className="bg-gray-100">
  //           <tr>
  //             <th className="px-4 py-2 border">Symbol</th>
  //             <th className="px-4 py-2 border">P/E Ratio</th>
  //             <th className="px-4 py-2 border">P/B Ratio</th>
  //             <th className="px-4 py-2 border">Debt/Equity</th>
  //             <th className="px-4 py-2 border">Value</th>
  //             <th className="px-4 py-2 border">Balance Sheet</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {filtered.map((stock) => {
  //             const results = evaluateAllStrategies(stock);
  //             const metric = stock.metric;
  //             return (
  //               <tr key={stock.symbol} className="text-center">
  //                 <td className="border px-4 py-2">{stock.symbol}</td>
  //                 <td className="border px-4 py-2">{metric.peTTM}</td>
  //                 <td className="border px-4 py-2">{metric.pb}</td>
  //                 <td className="border px-4 py-2">
  //                   {metric["totalDebt/totalEquityAnnual"]}
  //                 </td>
  //                 <td className="border px-4 py-2">
  //                   {results["Value Strategy"]}
  //                 </td>
  //                 <td className="border px-4 py-2">
  //                   {results["Balance Sheet Strategy"]}
  //                 </td>
  //               </tr>
  //             );
  //           })}
  //         </tbody>
  //       </table>
  //     </div>
  //   );
};
