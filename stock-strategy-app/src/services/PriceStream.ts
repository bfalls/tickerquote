export type Tick = {
  symbol: string;
  price: number;
  ts: number; // epoch milliseconds
};

export type PriceStreamOptions = {
  // Seed starting prices for symbols (e.g., { AAPL: 226.18 }) 
  seed?: Record<string, number>;
};

export interface PriceStream {
  connect(): Promise<void>;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  onTick(cb: (t: Tick) => void): void;
  close(): void;
}
