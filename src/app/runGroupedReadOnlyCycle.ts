import type { AppContext } from './bootstrap';
import { mapGammaMarket } from '../clients/polymarket/mapper';
import { groupMarkets } from '../grouping/groupMarkets';
import { scanGroup } from '../scanner/groupScanner';

export async function runGroupedReadOnlyCycle(ctx: AppContext): Promise<void> {
  const rawMarkets = await ctx.polymarketClient.getActiveGammaMarkets();
  const markets = rawMarkets.map(mapGammaMarket).filter((market) => market.active && !market.closed && market.outcomes.length >= 2);
  const groups = groupMarkets(markets);

  ctx.logger.info({ totalMarkets: markets.length, groups: groups.length }, 'Grouped market scan initialized');

  let detected = 0;

  for (const group of groups) {
    const result = await scanGroup(group, ctx);

    if (result.diagnostics) {
      ctx.logger.info({
        groupKey: result.diagnostics.groupKey,
        title: result.diagnostics.title,
        memberCount: result.diagnostics.memberCount,
        summedYesAsk: result.diagnostics.summedYesAsk,
        summedYesBid: result.diagnostics.summedYesBid,
        askDistanceToOne: result.diagnostics.askDistanceToOne,
        bidDistanceToOne: result.diagnostics.bidDistanceToOne
      }, 'Grouped market diagnostics');
    }

    if (!result.opportunity) continue;

    detected += 1;
    ctx.logger.info({
      groupKey: result.opportunity.groupKey,
      title: result.opportunity.title,
      memberCount: result.opportunity.memberCount,
      summedYesAsk: result.opportunity.summedYesAsk,
      summedYesBid: result.opportunity.summedYesBid,
      edgeToOne: result.opportunity.edgeToOne,
      note: result.opportunity.note
    }, 'Grouped opportunity detected');
  }

  ctx.logger.info({ groups: groups.length, detected }, 'Grouped market scan complete');
}
