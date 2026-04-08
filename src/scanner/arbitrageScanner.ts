import type { OrderBook } from '../domain/orderbook';
import type { Opportunity } from '../domain/opportunity';
import { calculateEdge, calculateSpread } from './pricing';
import type { AppEnv } from '../config/schema';

export function scanOrderBook(book: OrderBook, env: AppEnv): Opportunity | null {
  const yesPrice = book.yesAsks[0]?.price;
  const noPrice = book.noAsks[0]?.price;
  const yesBid = book.yesBids[0]?.price;
  const yesAsk = book.yesAsks[0]?.price;

  if (yesPrice === undefined || noPrice === undefined || yesBid === undefined || yesAsk === undefined) {
    return null;
  }

  const edge = calculateEdge(yesPrice, noPrice);
  const spread = calculateSpread(yesBid, yesAsk);
  const liquidity = Math.min(book.yesAsks[0]?.size ?? 0, book.noAsks[0]?.size ?? 0);
  const suggestedTradeSize = Math.min(env.MAX_TRADE_SIZE_USD, liquidity * env.MAX_LIQUIDITY_FRACTION);

  if (yesPrice + noPrice >= env.ARBITRAGE_MAX_TOTAL_PRICE) return null;

  return {
    marketId: book.marketId,
    yesPrice,
    noPrice,
    edge,
    spread,
    liquidity,
    suggestedTradeSize,
    detectedAt: Date.now()
  };
}
