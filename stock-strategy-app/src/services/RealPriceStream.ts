import type { PriceStream, PriceStreamOptions, Tick } from "./PriceStream";

type SubscribeMsg = { action: "subscribe"; symbols: string };
type UnsubscribeMsg = { action: "unsubscribe"; symbols: string };

export class RealPriceStream implements PriceStream {
  private socket?: WebSocket;
  private listeners = new Set<(t: Tick) => void>();
  private pendingSubs: string[] = [];
  private readonly url: string;

  constructor(url = import.meta.env.VITE_WEBSOCKET_URL as string, _opts?: PriceStreamOptions) {
    if (!url) throw new Error("VITE_WEBSOCKET_URL is not set");
    this.url = url;
  }

  async connect(): Promise<void> {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    )
      return;

    this.socket = new WebSocket(this.url);

    await new Promise<void>((resolve, reject) => {
      const s = this.socket!;
      const onOpen = () => {
        s.removeEventListener("open", onOpen);
        resolve();
      };
      const onError = (e: Event) => {
        s.removeEventListener("error", onError);
        reject(e);
      };
      s.addEventListener("open", onOpen);
      s.addEventListener("error", onError);
    });

    if (this.pendingSubs.length) {
      this._send({ action: "subscribe", symbols: this.pendingSubs.join(",") });
      this.pendingSubs = [];
    }

    this.socket.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        // Adapt to your EC2 payload. Support {symbol,price,ts} or {s,p,t}.
        const tick: Tick = {
          symbol: data.symbol ?? data.s,
          price: Number(data.price ?? data.p),
          ts: Number(data.ts ?? data.t ?? Date.now()),
        };
        if (tick.symbol && Number.isFinite(tick.price)) {
          this.listeners.forEach((cb) => cb(tick));
        }
      } catch {
        /* ignore malformed frames */
      }
    });
  }

  subscribe(symbols: string[]): void {
    const list = symbols.filter(Boolean);
    if (!list.length) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingSubs.push(...list);
      return;
    }
    this._send({ action: "subscribe", symbols: list.join(",") });
  }

  unsubscribe(symbols: string[]): void {
    const list = symbols.filter(Boolean);
    if (
      !list.length ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    )
      return;
    this._send({ action: "unsubscribe", symbols: list.join(",") });
  }

  onTick(cb: (t: Tick) => void): void {
    this.listeners.add(cb);
  }

  close(): void {
    try {
      this.socket?.close();
    } catch (err) {
      console.debug("Socket close ignored:", err);
    }
    this.socket = undefined;
    this.listeners.clear();
  }

  private _send(msg: SubscribeMsg | UnsubscribeMsg) {
    try {
      this.socket?.send(JSON.stringify(msg));
    } catch (err) {
      console.debug("Socket send ignored:", err);
    }
  }
}
