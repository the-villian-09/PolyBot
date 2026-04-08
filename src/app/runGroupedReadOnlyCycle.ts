import type { AppContext } from './bootstrap';
import { mapGammaMarket } from '../clients/polymarket/mapper';
import { groupMarkets } from '../grouping/groupMarkets';
import { scanGroup, type GroupDiagnostics } from '../scanner/groupScanner';

export async function runGroupedReadOnlyCycle(ctx: AppContext): Promise<void> {
  const rawMarkets = await ctx.polymarketClient.getActiveGammaMarkets();
  const markets = rawMarkets.map(mapGammaMarket).filter((market) => market.active && !market.closed && market.outcomes.length >= 2);
  const groups = groupMarkets(markets);

  ctx.logger.info({ totalMarkets: markets.length, groups: groups.length }, 'Grouped market scan initialized');

  let detected = 0;
  const diagnosticsList: GroupDiagnostics[] = [];

  for (const group of groups) {
    const result = await scanGroup(group, ctx);

    if (result.diagnostics) {
      diagnosticsList.push(result.diagnostics);
      ctx.logger.info({
        groupKey: result.diagnostics.groupKey,
        title: result.diagnostics.title,
        category: result.diagnostics.category,
        memberCount: result.diagnostics.memberCount,
        usableMembers: result.diagnostics.usableMembers,
        failedMembers: result.diagnostics.failedMembers,
        summedYesAsk: result.diagnostics.summedYesAsk,
        summedYesBid: result.diagnostics.summedYesBid,
        askDistanceToOne: result.diagnostics.askDistanceToOne,
        bidDistanceToOne: result.diagnostics.bidDistanceToOne,
        orderingViolationCount: result.diagnostics.orderingViolations?.length ?? 0,
        nearMissScore: result.diagnostics.nearMissScore,
        memberPrices: result.diagnostics.memberPrices.slice(0, 6),
        failures: result.diagnostics.failures.slice(0, 5)
      }, 'Grouped market diagnostics');
    }

    if (!result.opportunity) continue;

    detected += 1;
    ctx.opportunitiesRepo.recordGroupOpportunity(result.opportunity);
    ctx.logger.info({
      groupKey: result.opportunity.groupKey,
      title: result.opportunity.title,
      category: result.opportunity.category,
      memberCount: result.opportunity.memberCount,
      summedYesAsk: result.opportunity.summedYesAsk,
      summedYesBid: result.opportunity.summedYesBid,
      edgeToOne: result.opportunity.edgeToOne,
      note: result.opportunity.note
    }, 'Grouped opportunity detected');
  }

  const topNearMisses = diagnosticsList
    .sort((a, b) => a.nearMissScore - b.nearMissScore)
    .slice(0, 5)
    .map((item) => ({
      groupKey: item.groupKey,
      title: item.title,
      category: item.category,
      usableMembers: item.usableMembers,
      failedMembers: item.failedMembers,
      askDistanceToOne: item.askDistanceToOne,
      bidDistanceToOne: item.bidDistanceToOne,
      orderingViolationCount: item.orderingViolations?.length ?? 0,
      nearMissScore: item.nearMissScore,
      memberPrices: item.memberPrices.slice(0, 4)
    }));

  ctx.logger.info({
    groups: groups.length,
    detected,
    groupedPersisted: ctx.opportunitiesRepo.listGrouped().length,
    cryptoLaddersPersisted: ctx.opportunitiesRepo.listCryptoLadders().length,
    topNearMisses
  }, 'Grouped market scan complete');
}
