import React, { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
} from "lightweight-charts";
import { applyTickToDaily, startFromHistory } from "../utils/priceAggregator";
import { createPriceStream } from "../services";
import type { PriceStream, Tick as StreamTick } from "../services/PriceStream";

// Using environment variables for API endpoints allows backend URLs to be changed per environment (dev/prod) without code edits.
const apiUrl = import.meta.env.VITE_OHLCV_API_URL;
// const wssUrl = import.meta.env.VITE_PRICE_WSS_URL as string; // tick stream

interface Props {
  symbol: string | null;
}

// Strongly-typed API response contracts help catch data mismatches early and document expected data shape.
interface OHLCVValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface OHLCVResponse {
  meta: unknown;
  values: OHLCVValue[];
  status: string;
}

// Component is kept function-based and uses hooks for clean state/effect management and easier lifecycle reasoning.
export const StrategyDetail: React.FC<Props> = ({ symbol }) => {
  // useRef is used for mutable values that persist across renders but don't trigger re-renders, such as WebSocket and chart objects.
  const chartRef = useRef<HTMLDivElement>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const lastCandleRef = useRef<CandlestickData<UTCTimestamp> | null>(null);
  const streamRef = useRef<PriceStream | null>(null);
  // const symbolRef = useRef<string | undefined>(undefined);

  // Chart creation is done once on mount for performance and to avoid flicker on symbol change.
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current!, {
      width: 600,
      height: 300,
      // layout: {
      //   background: { type: "Solid", color: "#f5f7fb" },
      //   textColor: "#222",
      // },
      // rightPriceScale: { visible: true, borderVisible: false },
      // timeScale: { borderVisible: false, secondsVisible: false },
      // grid: {
      //   horzLines: { color: "#e6e9ef", visible: true },
      //   vertLines: { color: "#e6e9ef", visible: true },
      // },
    });

    const series = chart.addSeries(CandlestickSeries, {});
    // Consider options for styling candles if desired:
    // {
    //   upColor: "#26a69a",
    //   downColor: "#ef5350",
    //   wickUpColor: "#26a69a",
    //   wickDownColor: "#ef5350",
    //   borderVisible: false,
    // }
    candleSeriesRef.current = series;
    chartInstanceRef.current = chart;

    const onResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);

    // prevent memory leaks on unmount.
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, []);

  // On symbol change: fetch history, then create a seeded stream for THIS symbol only.
  useEffect(() => {
    if (!symbol || !candleSeriesRef.current) return;

    let cancelled = false;
    const currentSymbol = symbol; // capture to prevent cross-symbol bleed

    (async () => {
      try {
        const res = await fetch(`${apiUrl}?symbol=${currentSymbol}`);
        const json = (await res.json()) as OHLCVResponse;
        const rawValues = json?.values || [];

        const formattedData: CandlestickData[] = rawValues
          .map((d) => ({
            time: d.datetime, // BusinessDay string
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close,
          }))
          .reverse(); // oldest → newest

        if (cancelled) return;

        // 1) show history
        candleSeriesRef.current!.setData(formattedData);
        chartInstanceRef.current?.timeScale().fitContent();

        // 2) derive seed from THIS symbol's history
        const seed = startFromHistory(formattedData).lastCandle ?? null;
        const seedClose = seed ? seed.close : undefined;

        // 3) ensure we don't carry a candle from a previous symbol
        lastCandleRef.current = null;

        // 4) create a NEW stream instance seeded for THIS symbol only
        const opts =
          seedClose != null
            ? { seed: { [currentSymbol]: seedClose } }
            : undefined;
        const stream = createPriceStream(opts);
        streamRef.current = stream;

        const onTick = (t: StreamTick) => {
          // hard-guard: ignore ticks that aren't for the current symbol or after cancel
          if (cancelled || t.symbol !== currentSymbol) return;
          const series = candleSeriesRef.current;
          if (!series) return;

          const tick = {
            symbol: t.symbol,
            price: t.price,
            timestamp: Math.floor(t.ts / 1000),
          };

          lastCandleRef.current = applyTickToDaily(
            tick,
            lastCandleRef.current, // null on first tick → fresh candle
            (c) => {
              lastCandleRef.current = c;
              series.update(c);
            }, // onNew
            (c) => {
              lastCandleRef.current = c;
              series.update(c);
            } // onUpdate
          );
        };

        // Attach → subscribe → connect (mock connect() is no-op)
        stream.onTick(onTick);
        stream.subscribe([currentSymbol]);
        await stream.connect();

        if (cancelled) {
          try {
            stream.unsubscribe([currentSymbol]);
          } finally {
            stream.close();
          }
        }
      } catch (err) {
        console.error("Failed to fetch historical data:", err);
      }
    })();

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) {
        try {
          s.unsubscribe([currentSymbol]);
        } finally {
          s.close();
          if (streamRef.current === s) streamRef.current = null;
        }
      }
    };
  }, [symbol]);

  // Layout and fallback UI: this is still pretty simple but clearly communicates
  // whether a symbol is selected, and encapsulates the chart and detail area together.
  return (
    <div
      style={{
        padding: "1rem",
        borderLeft: "1px solid #ccc",
        minWidth: "300px",
      }}>
      <div ref={chartRef} style={{ width: "100%", height: 300 }} />
      <h3>Strategy Details</h3>
      {symbol ? (
        <p>
          Details for <strong>{symbol}</strong>
        </p>
      ) : (
        <p>No stock selected.</p>
      )}
    </div>
  );
};
