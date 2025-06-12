import React from "react";

interface Props {
  peRatio: number | undefined;
  pbRatio: number | undefined;
  debtToEquity: number | undefined;
  setPeRatio: (v: number | undefined) => void;
  setPbRatio: (v: number | undefined) => void;
  setDebtToEquity: (v: number | undefined) => void;
}

export const FilterControls: React.FC<Props> = ({
  peRatio,
  pbRatio,
  debtToEquity,
  setPeRatio,
  setPbRatio,
  setDebtToEquity,
}) => {
  const resetFilters = () => {
    setPeRatio(undefined);
    setPbRatio(undefined);
    setDebtToEquity(undefined);
  };

  return (
    <div className="filter-controls">
    <div className="filter-field">
      <label htmlFor="peRatioFilter">Max P/E Ratio:</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          id="peRatioFilter"
          value={peRatio ?? ""}
          onChange={(e) =>
            setPeRatio(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        </div>

         <div className="filter-field">
        <label htmlFor="pbRatioFilter">Max P/B Ratio:</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          id="pbRatioFilter"
          value={pbRatio ?? ""}
          onChange={(e) =>
            setPbRatio(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        </div>

        <div className="filter-field">
        <label htmlFor="debtToEquityFilter">Max Debt/Equity:</label>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          id="debtToEquityFilter"
          value={debtToEquity ?? ""}
          onChange={(e) =>
            setDebtToEquity(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>

        <button className="reset-button" onClick={resetFilters}>
        Reset Filters
      </button>
    </div>
  );
};
