import type { OrderBook } from '../domain/orderbook';

export class OrderBookStore {
  private readonly books = new Map<string, OrderBook>();

  upsert(book: OrderBook): void {
    this.books.set(book.marketId, book);
  }

  get(marketId: string): OrderBook | undefined {
    return this.books.get(marketId);
  }

  list(): OrderBook[] {
    return [...this.books.values()];
  }
}
