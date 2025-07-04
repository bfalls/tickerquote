import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type CandlestickData,
} from "lightweight-charts"; // this is a fantastic control, will have to consider this for other unrelated projects as well.

// Props interface ensures only properly typed candlestick data can be passed in, reducing runtime errors and clarifying component usage.
interface PriceChartProps {
  data: CandlestickData[];
}

export default function PriceChart({ data }: PriceChartProps) {
  // useRef is used here to persist the chart container and chart instance across renders without causing re-renders.
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    // Avoids trying to render the chart if the container ref is not yet set (component may not be mounted).
    if (!chartContainerRef.current) return;

    // Chart is created only after mount, and will be re-created if the data changes.
    // This ensures a fresh chart instance with the most current data.
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#000000",
      },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
    });
    chartRef.current = chart;

    // CandlestickSeries is used to visually represent OHLC candlestick data, which is a common standard for stock price charts.
    // ??? May add OHLCV later since it is getting volume data anyway.
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Setting the data here ensures the chart is always synced with the latest prop changes.
    candlestickSeries.setData(data);
    // fitContent ensures all chart data is visible by default, improving user experience.
    chart.timeScale().fitContent();
    // scrollToPosition is used to offset the chart slightly, so the most recent candles are not flush against the edge, improving readability.
    // ??? have to play with this more
    chart.timeScale().scrollToPosition(5, true);

    // handleResize ensures the chart resizes dynamically with the container when the window size changes.
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    // remove event listeners and chart instance on component unmount or data change to avoid memory leaks.
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  // Chart container ref is attached to a div that fills its parent width ("w-full"), enabling responsive chart sizing.
  return <div ref={chartContainerRef} className="w-full" />;
}