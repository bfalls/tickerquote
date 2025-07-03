import React, { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
} from "lightweight-charts";

interface Props {
  symbol: string | null;
}

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

    const series = chart.addSeries(CandlestickSeries, {});
    candleSeriesRef.current = series;
    chartInstanceRef.current = chart;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!symbol || !candleSeriesRef.current) return;

    const fetchHistoricalData = async () => {
      try {
        const res = await fetch(
          `https://rndszz8alj.execute-api.us-east-1.amazonaws.com/default/ohlcv?symbol=${symbol}`
        );
        const json = (await res.json()) as OHLCVResponse;
        const rawValues = json?.values || [];

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
