import type { GroupOpportunity } from '../domain/groupOpportunity';
import type { MarketGroup } from '../domain/marketGroup';
import { mapOrderBook } from '../clients/polymarket/mapper';
import type { AppContext } from '../app/bootstrap';

export async function scanGroup(group: MarketGroup, ctx: AppContext): Promise<GroupOpportunity | null> {
  let summedYesAsk = 0;
  let summedYesBid = 0;

  for (const member of group.members) {
    const rawBook = await ctx.polymarketClient.getOrderBook(member.yesTokenId);
    const book = mapOrderBook(rawBook);
    const bestBid = book.yesBids[0]?.price;
    const bestAsk = book.yesAsks[0]?.price;

    if (bestBid === undefined || bestAsk === undefined) {
      return null;
    }

    summedYesAsk += bestAsk;
    summedYesBid += bestBid;
  }

  const overround = summedYesAsk - 1;
  const underround = 1 - summedYesBid;

  if (summedYesAsk <= 1 || summedYesBid >= 1) {
    return {
      groupKey: group.groupKey,
      category: group.category,
      title: group.title,
      memberCount: group.members.length,
      summedYesAsk,
      summedYesBid,
      edgeToOne: summedYesAsk <= 1 ? 1 - summedYesAsk : summedYesBid - 1,
      detectedAt: Date.now(),
      note: summedYesAsk <= 1
        ? `Completeness gap on asks, over/under-round=${overround.toFixed(4)}`
        : `Bid-side overfill, over/under-round=${underround.toFixed(4)}`
    };
  }

  return null;
}
