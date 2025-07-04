import React, { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
} from "lightweight-charts";
// Using environment variables for API endpoints allows backend URLs to be changed per environment (dev/prod) without code edits.
const apiUrl = import.meta.env.VITE_OHLCV_API_URL;

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
  const wsRef = useRef<WebSocket | null>(null);
  const previousSymbolRef = useRef<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Chart creation is done once on mount for performance and to avoid flicker on symbol change.
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current!, {
      width: 600,
      height: 300,
    });

    const series = chart.addSeries(CandlestickSeries, {});
    candleSeriesRef.current = series;
    chartInstanceRef.current = chart;

    // prevent memory leaks on unmount.
    return () => chart.remove();
  }, []);

  // Whenever the symbol changes, fetch the latest historical data to update the chart accordingly.
  useEffect(() => {
    if (!symbol || !candleSeriesRef.current) return;

    const fetchHistoricalData = async () => {
      try {
        const res = await fetch(`${apiUrl}?symbol=${symbol}`);
        const json = (await res.json()) as OHLCVResponse;
        const rawValues = json?.values || [];

        // Formatting and reversing ensures the chart receives data in chronological (oldest to newest) order.
        const formattedData: CandlestickData[] = rawValues
          .map((d) => ({
            time: d.datetime,
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close,
          }))
          .reverse(); // ensure oldest to newest

        candleSeriesRef.current!.setData(formattedData);
        chartInstanceRef.current?.timeScale().fitContent();
      } catch (err) {
        console.error("Failed to fetch historical data:", err);
      }
    };

    fetchHistoricalData();
  }, [symbol]);

  // Establish a single persistent WebSocket connection for live price updates, rather than reconnecting on every symbol change.
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (symbol) {
        ws.send(
          JSON.stringify({ action: "subscribe", params: { symbols: symbol } })
        );
        previousSymbolRef.current = symbol;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "price") {
        const price = parseFloat(data.price);
        const time = Math.floor(Date.now() / 1000) as UTCTimestamp; // current time in seconds

        if (candleSeriesRef.current) {
          // Always update the last candle with the latest price for real-time feedback.
          candleSeriesRef.current.update({
            time,
            open: price,
            high: price,
            low: price,
            close: price,
          });
        }
      }
    };

    ws.onerror = (err) => {
      // Logging WebSocket errors aids in diagnosing connection or backend issues.
      console.error("WebSocket error:", err);
    };

    // prevent resource leaks.
    return () => {
      ws.close();
    };
  }, []);

  // When the symbol changes, send unsubscribe/subscribe messages rather than reconnecting the socket.
  // This keeps the connection alive and reduces latency and backend load.
  useEffect(() => {
    const ws = wsRef.current;
    const prev = previousSymbolRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN || !symbol) return;

    // Unsubscribe from the previous symbol to avoid receiving redundant updates.
    if (prev) {
      ws.send(
        JSON.stringify({ action: "unsubscribe", params: { symbols: prev } })
      );
    }

    // Subscribe to the new symbol for updated data.
    ws.send(
      JSON.stringify({ action: "subscribe", params: { symbols: symbol } })
    );
    previousSymbolRef.current = symbol;
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