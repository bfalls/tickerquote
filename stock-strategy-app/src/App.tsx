// import { useState, useEffect } from "react";
// import { StrategyCarousel } from "./components/StrategyCarousel";
// import { StockTable } from "./components/StockTable";
// import { strategies } from "./strategies";

// console.log("Rendering App");

// function App() {
//   return (
//     <div>
//       <h1>Testing Strategies</h1>
//       <ul>
//         {Object.keys(strategies).map((s) => (
//           <li key={s}>{s}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }
// export default App;

// import React, { useState } from "react";
import { useState } from "react";
import { typedKeys } from "./utils/typedKeys";
import { StrategyCarousel } from "./components/StrategyCarousel";
import { StockTable } from "./components/StockTable";
import { strategies } from "./strategies";
import type { Fundamentals, StrategyName } from "./types";
// type StrategyName = keyof typeof strategies;

const mockFundamentals: Fundamentals[] = [
  { symbol: "AAPL", peRatio: 28, pbRatio: 6, debtToEquity: 1.5 },
  { symbol: "WMT", peRatio: 14, pbRatio: 3, debtToEquity: 0.9 },
  { symbol: "JPM", peRatio: 10, pbRatio: 1, debtToEquity: 0.6 },
];

function App() {
  // believe it or not, all helpers to get around Typescript type safety issues...
  const strategyKeys = typedKeys(strategies);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>(
    strategyKeys[0]
  );

  const evaluator = strategies[selectedStrategy];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Strategy Evaluator</h1>
      <StrategyCarousel
        strategies={Object.keys(strategies) as StrategyName[]}
        selected={selectedStrategy}
        onSelect={setSelectedStrategy}
      />
      <StockTable stocks={mockFundamentals} evaluate={evaluator} />
    </div>
  );
}

export default App;
