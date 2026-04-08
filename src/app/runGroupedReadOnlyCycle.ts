import type { AppContext } from './bootstrap';
import { mapGammaMarket } from '../clients/polymarket/mapper';
import { groupMarkets } from '../grouping/groupMarkets';
import { scanGroup, type GroupDiagnostics } from '../scanner/groupScanner';
import type { GroupOpportunity } from '../domain/groupOpportunity';

function simulateCryptoPaperTrade(opportunity: GroupOpportunity): GroupOpportunity {
  if (opportunity.category !== 'crypto-threshold-family') return opportunity;

  const tradeSizeUsd = 25;
  const conservativeFillPenalty = 0.003;
  const simulatedNetEdge = (opportunity.edgeToOne ?? 0) - conservativeFillPenalty;
  const simulatedPnlUsd = simulatedNetEdge * tradeSizeUsd;
  const simulationNotes: string[] = [];

  if (simulatedNetEdge <= 0) simulationNotes.push('edge erased by conservative fill penalty');
  if (!opportunity.feasible) simulationNotes.push('base opportunity failed feasibility checks');

  return {
    ...opportunity,
    simulatedTradeSizeUsd: tradeSizeUsd,
    simulatedNetEdge,
    simulatedPnlUsd,
    simulationNotes
  };
}

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
        severityScore: result.diagnostics.severityScore,
        feasible: result.diagnostics.feasible,
        feasibilityReasons: result.diagnostics.feasibilityReasons,
        memberPrices: result.diagnostics.memberPrices.slice(0, 6),
        failures: result.diagnostics.failures.slice(0, 5)
      }, 'Grouped market diagnostics');
    }

    if (!result.opportunity) continue;

    detected += 1;
    const simulated = simulateCryptoPaperTrade(result.opportunity);
    ctx.opportunitiesRepo.recordGroupOpportunity(simulated);
    if (simulated.category === 'crypto-threshold-family') {
      ctx.opportunitiesRepo.recordPaperCryptoLadder(simulated);
    }

    ctx.logger.info({
      groupKey: simulated.groupKey,
      title: simulated.title,
      category: simulated.category,
      memberCount: simulated.memberCount,
      summedYesAsk: simulated.summedYesAsk,
      summedYesBid: simulated.summedYesBid,
      edgeToOne: simulated.edgeToOne,
      severityScore: simulated.severityScore,
      feasible: simulated.feasible,
      feasibilityReasons: simulated.feasibilityReasons,
      simulatedNetEdge: simulated.simulatedNetEdge,
      simulatedTradeSizeUsd: simulated.simulatedTradeSizeUsd,
      simulatedPnlUsd: simulated.simulatedPnlUsd,
      simulationNotes: simulated.simulationNotes,
      note: simulated.note
    }, 'Grouped opportunity detected');
  }

  const topNearMisses = diagnosticsList.sort((a, b) => a.nearMissScore - b.nearMissScore).slice(0, 5).map((item) => ({
    groupKey: item.groupKey,
    title: item.title,
    category: item.category,
    usableMembers: item.usableMembers,
    failedMembers: item.failedMembers,
    askDistanceToOne: item.askDistanceToOne,
    bidDistanceToOne: item.bidDistanceToOne,
    orderingViolationCount: item.orderingViolations?.length ?? 0,
    nearMissScore: item.nearMissScore,
    severityScore: item.severityScore,
    feasible: item.feasible,
    memberPrices: item.memberPrices.slice(0, 4)
  }));

  ctx.logger.info({
    groups: groups.length,
    detected,
    groupedPersisted: ctx.opportunitiesRepo.listGrouped().length,
    cryptoLaddersPersisted: ctx.opportunitiesRepo.listCryptoLadders().length,
    paperCryptoLaddersPersisted: ctx.opportunitiesRepo.listPaperCryptoLadders().length,
    topNearMisses
  }, 'Grouped market scan complete');
}
