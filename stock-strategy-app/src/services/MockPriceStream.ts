import type { PriceStream, PriceStreamOptions, Tick } from "./PriceStream";

// URL params override env: ?mock=1&bps=150&interval=500&vol=0.002
const qs = new URLSearchParams(globalThis.location?.search ?? "");
const BASE_BPS = Number(import.meta.env.VITE_MOCK_BPS ?? qs.get("bps") ?? 100);
const INTERVAL_MS = Number(
  import.meta.env.VITE_MOCK_INTERVAL_MS ?? qs.get("interval") ?? 800
);
const VOLATILITY = Number(
  import.meta.env.VITE_MOCK_VOL ?? qs.get("vol") ?? 0.0018
); // 0.18%

export class MockPriceStream implements PriceStream {
  private listeners = new Set<(t: Tick) => void>();
  private timer?: number;
  private state = new Map<string, { price: number }>();

  constructor(opts?: PriceStreamOptions) {
    // Seed explicit prices if provided
    if (opts?.seed) {
      for (const [sym, p] of Object.entries(opts.seed)) {
        if (Number.isFinite(p))
          this.state.set(sym, { price: Math.max(0.01, p) });
      }
    }
  }

  async connect(): Promise<void> {
    /* no-op */
  }

  subscribe(symbols: string[]): void {
    for (const s of symbols) {
      if (!this.state.has(s)) {
        // if ctor was given opts.seed, it is already set; otherwise create a default
        const existing = this.state.get(s);
        if (!existing) this.state.set(s, { price: Math.max(1, BASE_BPS) });
      }
    }
    this.ensureTimer();
    this.emitTicks();
  }

  unsubscribe(symbols: string[]): void {
    for (const s of symbols) this.state.delete(s);
    if (this.state.size === 0) this.stopTimer();
  }

  onTick(cb: (t: Tick) => void): void {
    this.listeners.add(cb);
  }

  close(): void {
    this.stopTimer();
    this.listeners.clear();
    this.state.clear();
  }

  private ensureTimer() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.emitTicks(), INTERVAL_MS);
  }
  private stopTimer() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private emitTicks() {
    const now = Date.now();
    for (const [sym, st] of this.state.entries()) {
      const eps = (Math.random() - 0.5) * 2 * VOLATILITY;
      st.price = Math.max(0.01, st.price * (1 + eps));
      const tick: Tick = {
        symbol: sym,
        price: Number(st.price.toFixed(2)),
        ts: now,
      };
      this.listeners.forEach((cb) => cb(tick));
    }
  }
}
