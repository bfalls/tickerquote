import React, { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

interface Props {
  symbol: string | null;
}

export const StrategyDetail: React.FC<Props> = ({ symbol }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const previousSymbolRef = useRef<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current!, {
      width: 600,
      height: 300,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {});

    candleSeries.setData([
      { time: "2025-06-01", open: 150, high: 160, low: 148, close: 155 },
      { time: "2025-06-02", open: 155, high: 162, low: 150, close: 158 },
      { time: "2025-06-03", open: 158, high: 165, low: 157, close: 161 },
    ]);

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://ws.twelvedata.com/v1/quotes/price?apikey=YOUR_API_KEY`
    );
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
          // Update the last candle with new price
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
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  // WebSocket opens once on mount
  useEffect(() => {
    const ws = wsRef.current;
    const prev = previousSymbolRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN || !symbol) return;

    // Unsubscribe previous
    if (prev) {
      ws.send(
        JSON.stringify({ action: "unsubscribe", params: { symbols: prev } })
      );
    }

    // Subscribe new
    ws.send(
      JSON.stringify({ action: "subscribe", params: { symbols: symbol } })
    );
    previousSymbolRef.current = symbol;
  }, [symbol]);

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
