export class PolymarketRestClient {
  constructor(private readonly baseUrl: string) {}

  async getMarkets(): Promise<unknown[]> {
    throw new Error(`Not implemented: getMarkets against ${this.baseUrl}`);
  }

  async getOrderBook(_marketId: string): Promise<unknown> {
    throw new Error('Not implemented: getOrderBook');
  }
}
