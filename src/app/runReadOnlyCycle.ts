import { mapGammaMarket, mapOrderBook } from '../clients/polymarket/mapper';
import type { AppContext } from './bootstrap';
import { scanOrderBook } from '../scanner/arbitrageScanner';
import { validateOpportunity } from '../rules/validateOpportunity';
import type { OrderBook } from '../domain/orderbook';
import type { Market } from '../domain/market';

function mergeOutcomeBooks(marketId: string, yesBook: OrderBook, noBook: OrderBook): OrderBook {
  return {
    marketId,
    yesBids: yesBook.yesBids,
    yesAsks: yesBook.yesAsks,
    noBids: noBook.yesBids,
    noAsks: noBook.yesAsks,
    updatedAt: Math.max(yesBook.updatedAt, noBook.updatedAt)
  };
}

function byLiquidityDescending(a: Market, b: Market): number {
  return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0);
}

async function processMarket(ctx: AppContext, market: Market): Promise<{ detected: number; missed: number }> {
  try {
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];

    if (!yesToken || !noToken) {
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: 0,
        reasonSkipped: 'missing outcome tokens',
        timestamp: Date.now()
      });
      return { detected: 0, missed: 1 };
    }

    const [rawYesBook, rawNoBook] = await Promise.all([
      ctx.polymarketClient.getOrderBook(yesToken.tokenId),
      ctx.polymarketClient.getOrderBook(noToken.tokenId)
    ]);

    const mergedBook = mergeOutcomeBooks(
      market.id,
      mapOrderBook(rawYesBook),
      mapOrderBook(rawNoBook)
    );

    ctx.orderBookStore.upsert(mergedBook);

    const opportunity = scanOrderBook(mergedBook, ctx.env);
    if (!opportunity) {
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: 0,
        reasonSkipped: 'no candidate opportunity',
        timestamp: Date.now()
      });
      return { detected: 0, missed: 1 };
    }

    const validation = validateOpportunity(opportunity, ctx.env);
    if (!validation.valid) {
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: opportunity.edge,
        reasonSkipped: validation.reasons.join(', '),
        timestamp: Date.now()
      });
      ctx.logger.debug({ marketId: market.id, reasons: validation.reasons }, 'Opportunity skipped');
      return { detected: 0, missed: 1 };
    }

    ctx.opportunitiesRepo.recordOpportunity(opportunity);
    ctx.logger.info({ marketId: market.id, edge: opportunity.edge, tradeSize: opportunity.suggestedTradeSize }, 'Opportunity detected');
    return { detected: 1, missed: 0 };
  } catch (error) {
    ctx.logger.error({ err: error, marketId: market.id }, 'Read-only cycle failed for market');
    return { detected: 0, missed: 1 };
  }
}

export async function runReadOnlyCycle(ctx: AppContext): Promise<void> {
  const rawMarkets = await ctx.polymarketClient.getActiveGammaMarkets();
  const markets = rawMarkets
    .map(mapGammaMarket)
    .filter((market) => market.active && !market.closed && market.outcomes.length >= 2)
    .sort(byLiquidityDescending)
    .slice(0, ctx.env.DRY_RUN_MARKET_LIMIT);

  ctx.marketStore.bulkUpsert(markets);
  ctx.logger.info(
    { tradableCandidates: markets.length, marketLimit: ctx.env.DRY_RUN_MARKET_LIMIT, bookFetchConcurrency: ctx.env.BOOK_FETCH_CONCURRENCY },
    'Fetched tradable Gamma markets'
  );

  let cycleDetected = 0;
  let cycleMissed = 0;

  for (let index = 0; index < markets.length; index += ctx.env.BOOK_FETCH_CONCURRENCY) {
    const batch = markets.slice(index, index + ctx.env.BOOK_FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((market) => processMarket(ctx, market)));

    for (const result of results) {
      cycleDetected += result.detected;
      cycleMissed += result.missed;
    }
  }

  ctx.logger.info({ cycleDetected, cycleMissed }, 'Read-only scan summary');
}
