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

async function processMarket(ctx: AppContext, market: Market): Promise<{ detected: number; missed: number; reasons: string[] }> {
  try {
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];

    if (!yesToken || !noToken) {
      const reason = 'missing outcome tokens';
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: 0,
        reasonSkipped: reason,
        timestamp: Date.now()
      });
      return { detected: 0, missed: 1, reasons: [reason] };
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

    const scan = scanOrderBook(mergedBook, ctx.env);
    if (!scan.opportunity) {
      const reason = scan.skipReasons.join(', ');
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: 0,
        reasonSkipped: reason,
        timestamp: Date.now()
      });
      return { detected: 0, missed: 1, reasons: scan.skipReasons };
    }

    const validation = validateOpportunity(scan.opportunity, ctx.env);
    if (!validation.valid) {
      ctx.opportunitiesRepo.recordMissed({
        marketId: market.id,
        edge: scan.opportunity.edge,
        reasonSkipped: validation.reasons.join(', '),
        timestamp: Date.now()
      });
      ctx.logger.debug({ marketId: market.id, reasons: validation.reasons }, 'Opportunity skipped');
      return { detected: 0, missed: 1, reasons: validation.reasons };
    }

    ctx.opportunitiesRepo.recordOpportunity(scan.opportunity);
    ctx.logger.info({ marketId: market.id, edge: scan.opportunity.edge, tradeSize: scan.opportunity.suggestedTradeSize }, 'Opportunity detected');
    return { detected: 1, missed: 0, reasons: [] };
  } catch (error) {
    const reason = 'market processing error';
    ctx.logger.error({ err: error, marketId: market.id }, 'Read-only cycle failed for market');
    return { detected: 0, missed: 1, reasons: [reason] };
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
  const reasonCounts = new Map<string, number>();

  for (let index = 0; index < markets.length; index += ctx.env.BOOK_FETCH_CONCURRENCY) {
    const batch = markets.slice(index, index + ctx.env.BOOK_FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((market) => processMarket(ctx, market)));

    for (const result of results) {
      cycleDetected += result.detected;
      cycleMissed += result.missed;
      for (const reason of result.reasons) {
        reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
      }
    }
  }

  ctx.logger.info({ cycleDetected, cycleMissed, skipReasonCounts: Object.fromEntries(reasonCounts) }, 'Read-only scan summary');
}
