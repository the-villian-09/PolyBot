import type { RawGammaMarket, RawPolymarketMarket, RawPolymarketOrderBook } from './types';

interface MarketsResponse {
  data?: RawPolymarketMarket[];
}

interface BookResponse {
  market?: string;
  asset_id?: string;
  bids?: Array<{ price: string | number; size: string | number }>;
  asks?: Array<{ price: string | number; size: string | number }>;
  hash?: string;
  timestamp?: string;
}

export class PolymarketRestClient {
  constructor(
    private readonly clobBaseUrl: string,
    private readonly gammaBaseUrl: string
  ) {}

  async getMarkets(): Promise<RawPolymarketMarket[]> {
    const response = await fetch(`${this.clobBaseUrl}/markets`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PolyBot/0.1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`getMarkets failed with status ${response.status}`);
    }

    const payload = (await response.json()) as MarketsResponse | RawPolymarketMarket[];
    if (Array.isArray(payload)) return payload;
    return payload.data ?? [];
  }

  async getActiveGammaMarkets(limit = 200): Promise<RawGammaMarket[]> {
    const url = `${this.gammaBaseUrl}/markets?active=true&closed=false&archived=false&enableOrderBook=true&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PolyBot/0.1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`getActiveGammaMarkets failed with status ${response.status}`);
    }

    return (await response.json()) as RawGammaMarket[];
  }

  async getOrderBook(tokenId: string): Promise<RawPolymarketOrderBook> {
    const response = await fetch(`${this.clobBaseUrl}/book?token_id=${encodeURIComponent(tokenId)}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PolyBot/0.1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`getOrderBook failed with status ${response.status}`);
    }

    const payload = (await response.json()) as BookResponse & { error?: string };
    if (payload.error) {
      throw new Error(payload.error);
    }

    const asks = (payload.asks ?? []).map((level) => ({
      price: Number(level.price),
      size: Number(level.size)
    }));
    const bids = (payload.bids ?? []).map((level) => ({
      price: Number(level.price),
      size: Number(level.size)
    }));

    return {
      marketId: payload.market ?? tokenId,
      yesBids: bids,
      yesAsks: asks,
      noBids: [],
      noAsks: [],
      updatedAt: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now()
    };
  }
}
