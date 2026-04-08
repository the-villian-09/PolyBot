import type { OrderBook } from '../domain/orderbook';
import type { Opportunity } from '../domain/opportunity';
import { calculateEdge, calculateSpread } from './pricing';
import type { AppEnv } from '../config/schema';

export interface ScanResult {
  opportunity: Opportunity | null;
  skipReasons: string[];
}

export function scanOrderBook(book: OrderBook, env: AppEnv): ScanResult {
  const yesBid = book.yesBids[0];
  const yesAsk = book.yesAsks[0];
  const noBid = book.noBids[0];
  const noAsk = book.noAsks[0];

  const skipReasons: string[] = [];

  if (!yesBid) skipReasons.push('missing yes bid');
  if (!yesAsk) skipReasons.push('missing yes ask');
  if (!noBid) skipReasons.push('missing no bid');
  if (!noAsk) skipReasons.push('missing no ask');

  if (skipReasons.length > 0) {
    return { opportunity: null, skipReasons };
  }

  const yesPrice = yesAsk.price;
  const noPrice = noAsk.price;
  const edge = calculateEdge(yesPrice, noPrice);
  const spread = calculateSpread(yesBid.price, yesAsk.price);
  const totalAsk = yesPrice + noPrice;
  const liquidity = Math.min(yesAsk.size, noAsk.size);
  const suggestedTradeSize = Math.min(env.MAX_TRADE_SIZE_USD, liquidity * env.MAX_LIQUIDITY_FRACTION);

  if (totalAsk >= env.ARBITRAGE_MAX_TOTAL_PRICE) skipReasons.push('combined ask too high');
  if (edge <= env.MIN_EDGE) skipReasons.push('edge below threshold');
  if (spread >= env.MAX_SPREAD) skipReasons.push('yes spread too wide');
  if (liquidity < suggestedTradeSize * env.MIN_LIQUIDITY_MULTIPLIER) skipReasons.push('insufficient displayed liquidity');
  if (suggestedTradeSize <= 0) skipReasons.push('trade size is zero');
  if (Date.now() - book.updatedAt > env.MARKET_FRESHNESS_MS) skipReasons.push('stale book');

  if (skipReasons.length > 0) {
    return { opportunity: null, skipReasons };
  }

  return {
    opportunity: {
      marketId: book.marketId,
      yesPrice,
      noPrice,
      edge,
      spread,
      liquidity,
      suggestedTradeSize,
      detectedAt: Date.now()
    },
    skipReasons: []
  };
}
