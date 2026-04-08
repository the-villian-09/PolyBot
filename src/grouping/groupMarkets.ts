import type { Market } from '../domain/market';
import type { MarketGroup } from '../domain/marketGroup';

function isChampionMarket(market: Market): boolean {
  return /win the 2026 nhl stanley cup/i.test(market.question) || /stanley cup champion/i.test(market.eventTitle ?? '');
}

export function groupMarkets(markets: Market[]): MarketGroup[] {
  const championMarkets = markets.filter(isChampionMarket);
  const byEvent = new Map<string, MarketGroup>();

  for (const market of championMarkets) {
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (!yesToken || !noToken) continue;

    const groupKey = `champion-market:${market.eventTitle ?? 'unknown-event'}`;
    const existing = byEvent.get(groupKey) ?? {
      groupKey,
      category: 'champion-market' as const,
      title: market.eventTitle ?? 'Unknown champion market group',
      members: []
    };

    existing.members.push({
      marketId: market.id,
      question: market.question,
      yesTokenId: yesToken.tokenId,
      noTokenId: noToken.tokenId,
      liquidityUsd: market.liquidityUsd,
      volume24h: market.volume24h
    });

    byEvent.set(groupKey, existing);
  }

  return [...byEvent.values()].filter((group) => group.members.length >= 2);
}
