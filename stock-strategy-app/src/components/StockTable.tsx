import React from "react";
import type { Fundamentals } from "../types";
// import { evaluateAllStrategies } from "../strategies";
import "./StockTable.css";

interface Props {
  stocks: Fundamentals[];
  filters?: {
    peRatio?: number;
    pbRatio?: number;
    debtToEquity?: number;
  };
  selectedSymbol?: string | null;
  onSelect: (symbol: string) => void;
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

export const StockTable: React.FC<Props> = ({
  stocks,
  filters,
  selectedSymbol,
  onSelect,
}) => {
  const filteredStocks = stocks.filter((stock) =>
    passesFilters(stock, filters)
  );
  return (
    <div className="table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>P/E Ratio</th>
            <th>P/B Ratio</th>
            <th>Debt/Equity</th>
          </tr>
        </thead>
        <tbody>
          {filteredStocks.map((stock) => {
            const isSelected = selectedSymbol === stock.symbol;
            return (
              <tr
                key={stock.symbol}
                onClick={() => onSelect(stock.symbol)}
                className={isSelected ? "selected-row" : ""}>
                <td>{stock.symbol}</td>
                <td>{stock.metric.peTTM ?? "-"}</td>
                <td>{stock.metric.pb ?? "-"}</td>
                <td>{stock.metric["totalDebt/totalEquityAnnual"] ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
