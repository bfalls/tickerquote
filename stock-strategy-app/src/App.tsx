// console.log("Rendering App");

import { useEffect, useState } from "react";
import { typedKeys } from "./utils/typedKeys";
import { StrategyCarousel } from "./components/StrategyCarousel";
import { StockTable } from "./components/StockTable";
import { strategies } from "./strategies";
import type { Fundamentals, StrategyName } from "./types";
import { FilterControls } from "./components/FilterControls";
import "./App.css";

// const mockFundamentals: Fundamentals[] = [
//   { symbol: "AAPL", peRatio: 28, pbRatio: 6, debtToEquity: 1.5 },
//   { symbol: "WMT", peRatio: 14, pbRatio: 3, debtToEquity: 0.9 },
//   { symbol: "JPM", peRatio: 10, pbRatio: 1, debtToEquity: 0.6 },
// ];

function App() {
  // believe it or not, all helpers to get around Typescript type safety issues...
  const strategyKeys = typedKeys(strategies);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>(
    strategyKeys[0]
  );
  const [fundamentals, setFundamentals] = useState<Fundamentals[]>([]);

  // Filter state
  const [peRatio, setPeRatio] = useState<number | undefined>(undefined);
  const [pbRatio, setPbRatio] = useState<number | undefined>(undefined);
  const [debtToEquity, setDebtToEquity] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      "https://tickerquote-fundamentals-bucket.s3.amazonaws.com/djia_fundamentals.json",
      {
        signal: controller.signal,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const values = Object.values(data) as Fundamentals[];
        setFundamentals(values);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch fundamentals", err);
        }
      });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Strategy Evaluator</h1>
      <StrategyCarousel
        strategies={Object.keys(strategies) as StrategyName[]}
        selected={selectedStrategy}
        onSelect={setSelectedStrategy}
      />

      <FilterControls
        peRatio={peRatio}
        pbRatio={pbRatio}
        debtToEquity={debtToEquity}
        setPeRatio={setPeRatio}
        setPbRatio={setPbRatio}
        setDebtToEquity={setDebtToEquity}
      />

      <StockTable
        stocks={fundamentals}
        filters={{ peRatio, pbRatio, debtToEquity }}
      />
    </div>
  );
}

export default App;
