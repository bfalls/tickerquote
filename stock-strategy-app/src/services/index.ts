import { RealPriceStream } from "./RealPriceStream";
import { MockPriceStream } from "./MockPriceStream";
import type { PriceStream, PriceStreamOptions } from "./PriceStream";

const qs = new URLSearchParams(globalThis.location?.search ?? "");

export function createPriceStream(opts?: PriceStreamOptions): PriceStream {
  const useMock =
    import.meta.env.VITE_USE_MOCK === "1" || qs.get("mock") === "1";
  return useMock
    ? new MockPriceStream(opts)
    : new RealPriceStream(undefined, opts); // requires VITE_PRICE_WSS_URL
}
