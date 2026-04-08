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
    const opportunity = await scanGroup(group, ctx);
    if (!opportunity) continue;

    detected += 1;
    ctx.logger.info({
      groupKey: opportunity.groupKey,
      title: opportunity.title,
      memberCount: opportunity.memberCount,
      summedYesAsk: opportunity.summedYesAsk,
      summedYesBid: opportunity.summedYesBid,
      edgeToOne: opportunity.edgeToOne,
      note: opportunity.note
    }, 'Grouped opportunity detected');
  }

  ctx.logger.info({ groups: groups.length, detected }, 'Grouped market scan complete');
}
