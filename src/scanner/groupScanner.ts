import type { GroupOpportunity } from '../domain/groupOpportunity';
import type { MarketGroup } from '../domain/marketGroup';
import { mapOrderBook } from '../clients/polymarket/mapper';
import type { AppContext } from '../app/bootstrap';

export interface GroupScanResult {
  opportunity: GroupOpportunity | null;
  diagnostics: {
    groupKey: string;
    title: string;
    memberCount: number;
    summedYesAsk: number;
    summedYesBid: number;
    askDistanceToOne: number;
    bidDistanceToOne: number;
  } | null;
}

export async function scanGroup(group: MarketGroup, ctx: AppContext): Promise<GroupScanResult> {
  let summedYesAsk = 0;
  let summedYesBid = 0;

  for (const member of group.members) {
    const rawBook = await ctx.polymarketClient.getOrderBook(member.yesTokenId);
    const book = mapOrderBook(rawBook);
    const bestBid = book.yesBids[0]?.price;
    const bestAsk = book.yesAsks[0]?.price;

    if (bestBid === undefined || bestAsk === undefined) {
      return { opportunity: null, diagnostics: null };
    }

    summedYesAsk += bestAsk;
    summedYesBid += bestBid;
  }

  const diagnostics = {
    groupKey: group.groupKey,
    title: group.title,
    memberCount: group.members.length,
    summedYesAsk,
    summedYesBid,
    askDistanceToOne: summedYesAsk - 1,
    bidDistanceToOne: 1 - summedYesBid
  };

  if (summedYesAsk <= 1 || summedYesBid >= 1) {
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
