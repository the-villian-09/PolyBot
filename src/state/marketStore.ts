import type { Market } from '../domain/market';

export class MarketStore {
  private readonly markets = new Map<string, Market>();

  upsert(market: Market): void {
    this.markets.set(market.id, market);
  }

  bulkUpsert(markets: Market[]): void {
    for (const market of markets) this.upsert(market);
  }

  get(marketId: string): Market | undefined {
    return this.markets.get(marketId);
  }

  list(): Market[] {
    return [...this.markets.values()];
  }

  listActive(): Market[] {
    return this.list().filter((market) => market.active && !market.closed);
  }
}
