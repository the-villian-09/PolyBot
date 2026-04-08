import type { GroupOpportunity } from '../domain/groupOpportunity';
import type { MarketGroup } from '../domain/marketGroup';
import { mapOrderBook } from '../clients/polymarket/mapper';
import type { AppContext } from '../app/bootstrap';

export interface GroupDiagnostics {
  groupKey: string;
  title: string;
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market';
  memberCount: number;
  usableMembers: number;
  failedMembers: number;
  summedYesAsk: number;
  summedYesBid: number;
  askDistanceToOne: number;
  bidDistanceToOne: number;
  failures: Array<{ marketId: string; question: string; reason: string }>;
  orderingViolations?: Array<{ earlierMarketId: string; laterMarketId: string; earlierAsk: number; laterAsk: number }>;
  nearMissScore: number;
}

export interface GroupScanResult {
  opportunity: GroupOpportunity | null;
  diagnostics: GroupDiagnostics | null;
}

function calculateNearMissScore(category: GroupDiagnostics['category'], askDistanceToOne: number, bidDistanceToOne: number, orderingViolationCount: number, failures: number): number {
  if (category === 'timeframe-market') {
    return orderingViolationCount > 0 ? 0 : 1000 + failures;
  }

  return Math.min(Math.abs(askDistanceToOne), Math.abs(bidDistanceToOne)) + failures * 0.1;
}

export async function scanGroup(group: MarketGroup, ctx: AppContext): Promise<GroupScanResult> {
  let summedYesAsk = 0;
  let summedYesBid = 0;
  let usableMembers = 0;
  const failures: Array<{ marketId: string; question: string; reason: string }> = [];
  const usable: Array<{ marketId: string; question: string; ask: number; bid: number; sortKey?: number }> = [];

  for (const member of group.members) {
    try {
      const rawBook = await ctx.polymarketClient.getOrderBook(member.yesTokenId);
      const book = mapOrderBook(rawBook);
      const bestBid = book.yesBids[0]?.price;
      const bestAsk = book.yesAsks[0]?.price;

      if (bestBid === undefined || bestAsk === undefined) {
        failures.push({ marketId: member.marketId, question: member.question, reason: 'missing yes best bid or ask' });
        continue;
      }

      summedYesAsk += bestAsk;
      summedYesBid += bestBid;
      usableMembers += 1;
      usable.push({ marketId: member.marketId, question: member.question, ask: bestAsk, bid: bestBid, sortKey: member.sortKey });
    } catch {
      failures.push({ marketId: member.marketId, question: member.question, reason: 'orderbook fetch failed' });
    }
  }

  const orderingViolations: Array<{ earlierMarketId: string; laterMarketId: string; earlierAsk: number; laterAsk: number }> = [];
  if (group.category === 'timeframe-market') {
    const sorted = [...usable].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const earlier = sorted[i];
      const later = sorted[i + 1];
      if (earlier && later && earlier.ask > later.ask) {
        orderingViolations.push({
          earlierMarketId: earlier.marketId,
          laterMarketId: later.marketId,
          earlierAsk: earlier.ask,
          laterAsk: later.ask
        });
      }
    }
  }

  const diagnostics: GroupDiagnostics = {
    groupKey: group.groupKey,
    title: group.title,
    category: group.category,
    memberCount: group.members.length,
    usableMembers,
    failedMembers: failures.length,
    summedYesAsk,
    summedYesBid,
    askDistanceToOne: summedYesAsk - 1,
    bidDistanceToOne: 1 - summedYesBid,
    failures,
    orderingViolations,
    nearMissScore: calculateNearMissScore(group.category, summedYesAsk - 1, 1 - summedYesBid, orderingViolations.length, failures.length)
  };

  if (usableMembers < 2) {
    return { opportunity: null, diagnostics };
  }

  if (group.category === 'timeframe-market' && orderingViolations.length > 0) {
    return {
      diagnostics,
      opportunity: {
        groupKey: group.groupKey,
        category: group.category,
        title: group.title,
        memberCount: group.members.length,
        summedYesAsk,
        summedYesBid,
        edgeToOne: orderingViolations[0].earlierAsk - orderingViolations[0].laterAsk,
        detectedAt: Date.now(),
        note: `Time ordering violation count=${orderingViolations.length}`
      }
    };
  }

  if ((group.category === 'champion-market' || group.category === 'exclusive-outcome-market') && (summedYesAsk <= 1 || summedYesBid >= 1)) {
    return {
      diagnostics,
      opportunity: {
        groupKey: group.groupKey,
        category: group.category,
        title: group.title,
        memberCount: group.members.length,
        summedYesAsk,
        summedYesBid,
        edgeToOne: summedYesAsk <= 1 ? 1 - summedYesAsk : summedYesBid - 1,
        detectedAt: Date.now(),
        note: summedYesAsk <= 1
          ? `Completeness gap on asks, askDistanceToOne=${(summedYesAsk - 1).toFixed(4)}`
          : `Bid-side overfill, bidDistanceToOne=${(1 - summedYesBid).toFixed(4)}`
      }
    };
  }

  return { opportunity: null, diagnostics };
}
