import React from "react";
import type { Fundamentals } from "../types";
// Keeping strategy evaluation logic decoupled; strategies may be evaluated elsewhere and results passed as props.
// import { evaluateAllStrategies } from "../strategies";
import "./StockTable.css";

// Accepts a list of stocks, optional filtering criteria, a selected symbol, and a callback for selection.
// This allows the table to be reusable across contexts where filtering or selection may differ.
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

// Helper function to encapsulate filter logic in one place for maintainability and potential reuse.
// Filters are optional and only applied if defined, allowing flexible filtering from the parent.
const passesFilters = (stock: Fundamentals, filters: Props["filters"] = {}) => {
  const { peRatio, pbRatio, debtToEquity } = filters;
  const metric = stock.metric;
  // Using <= comparisons so user filters act as maximum thresholds (e.g., "show me stocks with P/E below 15").
  // Handles undefined gracefully so missing filters don't exclude stocks.
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
  // Filter stocks client-side for fast, responsive updates as filters change.
  // This approach assumes stock data is already loaded, avoiding repeated backend calls for filter changes.
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
            // Highlight row if selected, so users can easily see their current focus.
            // Row click triggers parent callback, enabling parent-controlled selection state.
            return (
              <tr
                key={stock.symbol}
                onClick={() => onSelect(stock.symbol)}
                className={isSelected ? "selected-row" : ""}>
                {/* Use fallback display for missing or undefined metrics for robustness against incomplete data from backend */}
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