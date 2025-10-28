// src/utils/priceAggregator.ts
import type { CandlestickData, UTCTimestamp, BusinessDay, Time } from "lightweight-charts";

export type Tick = { symbol: string; price: number; timestamp: number; volume?: number };

/** Format YYYY-MM-DD in America/New_York for a given unix-seconds timestamp */
export function nyDayKey(tsSec: number): string {
  const d = new Date(tsSec * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives "YYYY-MM-DD"
  return fmt.format(d);
}

/** Convert YYYY-MM-DD to UTC midnight seconds (used as candle `time`) */
export function utcMidnightFromKey(key: string): UTCTimestamp {
  const [y, m, d] = key.split("-").map((v) => parseInt(v, 10));
  // UTC midnight for that calendar date
  const sec = Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
  return sec as UTCTimestamp;
}

/** Type guard: is BusinessDay */
function isBusinessDay(t: Time): t is BusinessDay {
  return typeof t === "object" && t !== null && "year" in t && "month" in t && "day" in t;
}

/** Convert lightweight-charts Time to unix seconds (UTC) */
function timeToUnixSeconds(t: Time): number {
  if (typeof t === "number") return t; // UTCTimestamp
  if (isBusinessDay(t)) {
    return Math.floor(Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0) / 1000);
  }
  // Should not be reachable, but keep return type strict:
  return 0;
}

/** Convert last historical candle to UTCTimestamp time */
export function startFromHistory(
  hist: CandlestickData<Time>[]
): { lastCandle: CandlestickData<UTCTimestamp> | null } {
  const last = hist.length > 0 ? hist[hist.length - 1] : null;
  if (!last) return { lastCandle: null };
  const unix = timeToUnixSeconds(last.time);
  return {
    lastCandle: {
      time: unix as UTCTimestamp,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    },
  };
}

/**
 * Apply a live tick to DAILY candles.
 * Buckets by NY trading day; updates today's candle or creates a new one when the day rolls.
 */
export function applyTickToDaily(
  tick: Tick,
  last: CandlestickData<UTCTimestamp> | null,
  onNew: (c: CandlestickData<UTCTimestamp>) => void,
  onUpdate: (c: CandlestickData<UTCTimestamp>) => void
): CandlestickData<UTCTimestamp> {
  const tickKey = nyDayKey(tick.timestamp);
  const lastKey =
    last ? nyDayKey(typeof last.time === "number" ? (last.time as number) : 0) : null;

  // New trading day (or no last)
  if (!last || lastKey === null || lastKey < tickKey) {
    const open = last ? last.close : tick.price;
    const c: CandlestickData<UTCTimestamp> = {
      time: utcMidnightFromKey(tickKey),
      open,
      high: Math.max(open, tick.price),
      low: Math.min(open, tick.price),
      close: tick.price,
    };
    onNew(c);
    return c;
  }

  // Same trading day → update O/H/L/C
  if (lastKey === tickKey) {
    const c: CandlestickData<UTCTimestamp> = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, tick.price),
      low: Math.min(last.low, tick.price),
      close: tick.price,
    };
    onUpdate(c);
    return c;
  }

  // Older tick → ignore
  return last;
}
