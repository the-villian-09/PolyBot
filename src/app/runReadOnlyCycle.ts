import { mapMarket, mapOrderBook } from '../clients/polymarket/mapper';
import type { AppContext } from './bootstrap';
import { scanOrderBook } from '../scanner/arbitrageScanner';
import { validateOpportunity } from '../rules/validateOpportunity';
import type { OrderBook } from '../domain/orderbook';

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

export async function runReadOnlyCycle(ctx: AppContext): Promise<void> {
  const rawMarkets = await ctx.polymarketClient.getMarkets();
  const markets = rawMarkets
    .map(mapMarket)
    .filter((market) => market.active && !market.closed && market.outcomes.length >= 2);

  ctx.marketStore.bulkUpsert(markets);
  ctx.logger.info({ count: markets.length }, 'Fetched active markets');

  let cycleDetected = 0;
  let cycleMissed = 0;

  for (const market of markets) {
    try {
      const yesToken = market.outcomes.find((outcome) => outcome.outcome === 'YES') ?? market.outcomes[0];
      const noToken = market.outcomes.find((outcome) => outcome.outcome === 'NO') ?? market.outcomes[1];

      if (!yesToken || !noToken) {
        cycleMissed += 1;
        ctx.opportunitiesRepo.recordMissed({
          marketId: market.id,
          edge: 0,
          reasonSkipped: 'missing outcome tokens',
          timestamp: Date.now()
        });
        continue;
      }

      const rawYesBook = await ctx.polymarketClient.getOrderBook(yesToken.tokenId);
      const rawNoBook = await ctx.polymarketClient.getOrderBook(noToken.tokenId);

      const mergedBook = mergeOutcomeBooks(
        market.id,
        mapOrderBook(rawYesBook),
        mapOrderBook(rawNoBook)
      );

      ctx.orderBookStore.upsert(mergedBook);

      const opportunity = scanOrderBook(mergedBook, ctx.env);
      if (!opportunity) {
        cycleMissed += 1;
        ctx.opportunitiesRepo.recordMissed({
          marketId: market.id,
          edge: 0,
          reasonSkipped: 'no candidate opportunity',
          timestamp: Date.now()
        });
        continue;
      }

      const validation = validateOpportunity(opportunity, ctx.env);
      if (!validation.valid) {
        cycleMissed += 1;
        ctx.opportunitiesRepo.recordMissed({
          marketId: market.id,
          edge: opportunity.edge,
          reasonSkipped: validation.reasons.join(', '),
          timestamp: Date.now()
        });
        ctx.logger.debug({ marketId: market.id, reasons: validation.reasons }, 'Opportunity skipped');
        continue;
      }

      cycleDetected += 1;
      ctx.opportunitiesRepo.recordOpportunity(opportunity);
      ctx.logger.info({ marketId: market.id, edge: opportunity.edge, tradeSize: opportunity.suggestedTradeSize }, 'Opportunity detected');
    } catch (error) {
      cycleMissed += 1;
      ctx.logger.error({ err: error, marketId: market.id }, 'Read-only cycle failed for market');
    }
  }

  ctx.logger.info({ cycleDetected, cycleMissed }, 'Read-only scan summary');
}
