// console.log("Rendering App");

import { useEffect, useState } from "react";
import { typedKeys } from "./utils/typedKeys";
import { StrategyCarousel } from "./components/StrategyCarousel";
import { StockTable } from "./components/StockTable";
import { strategies } from "./strategies";
import type { Fundamentals, StrategyName } from "./types";
import { FilterControls } from "./components/FilterControls";
import { StrategyDetail } from "./components/StrategyDetail";
import "./App.css";

function App() {
  // believe it or not, all helpers to get around Typescript type safety issues...
  const strategyKeys = typedKeys(strategies);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>(
    strategyKeys[0]
  );
  const [fundamentals, setFundamentals] = useState<Fundamentals[]>([]);
  const [fundamentalsLastModified, setFundamentalsLastModified] = useState<
    string | null
  >(null);
  // const [fundamentalsEtag, setFundamentalsEtag] = useState<string | null>(null);
  const [fundamentalsLastChecked, setFundamentalsLastChecked] = useState<
    string | null
  >(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Filter state
  const [peRatio, setPeRatio] = useState<number | undefined>(undefined);
  const [pbRatio, setPbRatio] = useState<number | undefined>(undefined);
  const [debtToEquity, setDebtToEquity] = useState<number | undefined>(
    undefined
  );

  const fetchFundamentals = async (signal?: AbortSignal) => {
    fetch(
      "https://tickerquote-fundamentals-bucket.s3.amazonaws.com/djia_fundamentals.json",
      {
        signal,
      }
    )
      .then(async (res) => {
        // const etag = res.headers.get("ETag");
        const lastModified = res.headers.get("Last-Modified");
        const data = await res.json();
        const values = Object.values(data) as Fundamentals[];
        setFundamentals(values);
        setFundamentalsLastModified(lastModified);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch fundamentals", err);
        }
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchFundamentals(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const checkForFundamentalsUpdate = async () => {
    const res = await fetch(
      "https://tickerquote-fundamentals-bucket.s3.amazonaws.com/djia_fundamentals.json",
      {
        method: "HEAD",
        headers: {
          "If-Modified-Since": fundamentalsLastModified ?? "",
        },
      }
    );

    if (res.status === 304) {
      alert("You're already viewing the latest data.");
    } else if (res.status === 200) {
      alert("New data is available! Refreshing...");
      await fetchFundamentals();
    } else {
      console.error("Unexpected response:", res.status);
    }

    setFundamentalsLastChecked(new Date().toLocaleString());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Strategy Evaluator</h1>
      <div id="appContainer">
        <div id="appScreener">
          <StrategyCarousel
            strategies={Object.keys(strategies) as StrategyName[]}
            selected={selectedStrategy}
            onSelect={setSelectedStrategy}
          />

          {fundamentalsLastModified && (
            <p style={{ fontSize: "0.85em", color: "#6B7280" }}>
              Data last updated:{" "}
              {new Date(fundamentalsLastModified).toLocaleString()}
              <span
                style={{ cursor: "pointer", marginLeft: "8px" }}
                onClick={checkForFundamentalsUpdate}
                title="Check for updates">
                🔄
              </span>
            </p>
          )}

          {fundamentalsLastChecked && (
            <p
              style={{
                fontSize: "0.75em",
                color: "#6B7280",
                marginTop: "4px",
              }}>
              Last checked: {new Date(fundamentalsLastChecked).toLocaleString()}
            </p>
          )}
          <FilterControls
            peRatio={peRatio}
            pbRatio={pbRatio}
            debtToEquity={debtToEquity}
            setPeRatio={setPeRatio}
            setPbRatio={setPbRatio}
            setDebtToEquity={setDebtToEquity}
          />
        </div>

        <div id="mainContainer">
          <div id="listTable">
            <StockTable
              stocks={fundamentals}
              filters={{ peRatio, pbRatio, debtToEquity }}
              selectedSymbol={selectedSymbol}
              onSelect={setSelectedSymbol}
            />
          </div>
          <div id="detailContainer">
            <StrategyDetail symbol={selectedSymbol} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
