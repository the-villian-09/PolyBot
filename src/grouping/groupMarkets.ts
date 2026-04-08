import type { Market } from '../domain/market';
import type { MarketGroup } from '../domain/marketGroup';

function isChampionMarket(market: Market): boolean {
  return /win the 2026 nhl stanley cup/i.test(market.question) || /stanley cup champion/i.test(market.eventTitle ?? '');
}

function isExclusiveOutcomeEvent(title: string): boolean {
  return /winner|nominee|champion|rookie of the year/i.test(title);
}

function isTrumpMarket(market: Market): boolean {
  return /trump/i.test(market.question) || /trump/i.test(market.eventTitle ?? '') || /trump/i.test(market.groupTitle ?? '');
}

function isCryptoMarket(market: Market): boolean {
  return /bitcoin|btc|ethereum|eth|solana|fdv|market cap|airdrop|launch|megaeth|price above|price over|price reaches|fully diluted/i.test(market.question)
    || /bitcoin|btc|ethereum|eth|solana|fdv|market cap|airdrop|launch|megaeth|fully diluted/i.test(market.eventTitle ?? '')
    || /bitcoin|btc|ethereum|eth|solana|fdv|market cap|airdrop|launch|megaeth|fully diluted/i.test(market.groupTitle ?? '');
}

function normalizeTimeframeStem(question: string): { stem: string; sortKey: number } | null {
  const match = question.match(/^(.*) before ([a-z]+) (\d{4})\?$/i);
  if (!match) return null;

  const monthOrder = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthIndex = monthOrder.indexOf(match[2].toLowerCase());
  if (monthIndex === -1) return null;

  return { stem: match[1].trim().toLowerCase(), sortKey: Number(match[3]) * 100 + monthIndex };
}

function parseThresholdSortKey(question: string): number | null {
  const billionMatch = question.match(/(?:>|above|over)\s*\$?(\d+(?:\.\d+)?)\s*B/i);
  if (billionMatch) return Number(billionMatch[1]) * 1_000_000_000;

  const millionMatch = question.match(/(?:>|above|over)\s*\$?(\d+(?:\.\d+)?)\s*M/i);
  if (millionMatch) return Number(millionMatch[1]) * 1_000_000;

  const plainDollarMatch = question.match(/(?:>|above|over|reaches)\s*\$?(\d+(?:\.\d+)?)(?!\s*[BM])/i);
  if (plainDollarMatch) return Number(plainDollarMatch[1]);

  return null;
}

function buildChampionGroups(markets: Market[]): MarketGroup[] {
  const championMarkets = markets.filter(isChampionMarket);
  const byEvent = new Map<string, MarketGroup>();

  for (const market of championMarkets) {
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (!yesToken || !noToken) continue;

    const groupKey = `champion-market:${market.eventTitle ?? 'unknown-event'}`;
    const existing = byEvent.get(groupKey) ?? { groupKey, category: 'champion-market' as const, title: market.eventTitle ?? 'Unknown champion market group', members: [] };
    existing.members.push({ marketId: market.id, question: market.question, yesTokenId: yesToken.tokenId, noTokenId: noToken.tokenId, liquidityUsd: market.liquidityUsd, volume24h: market.volume24h });
    byEvent.set(groupKey, existing);
  }

  return [...byEvent.values()].filter((group) => group.members.length >= 2);
}

function buildExclusiveOutcomeGroups(markets: Market[]): MarketGroup[] {
  const byEvent = new Map<string, MarketGroup>();

  for (const market of markets) {
    const eventTitle = market.eventTitle ?? '';
    if (!isExclusiveOutcomeEvent(eventTitle)) continue;

    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (!yesToken || !noToken) continue;

    const groupKey = `exclusive-outcome-market:${eventTitle}`;
    const existing = byEvent.get(groupKey) ?? { groupKey, category: 'exclusive-outcome-market' as const, title: eventTitle, members: [] };
    existing.members.push({ marketId: market.id, question: market.question, yesTokenId: yesToken.tokenId, noTokenId: noToken.tokenId, liquidityUsd: market.liquidityUsd, volume24h: market.volume24h });
    byEvent.set(groupKey, existing);
  }

  return [...byEvent.values()].filter((group) => group.members.length >= 2);
}

function buildThematicGroups(markets: Market[], predicate: (market: Market) => boolean, prefix: 'trump-family' | 'crypto-family'): MarketGroup[] {
  const themed = markets.filter(predicate);
  const byEvent = new Map<string, MarketGroup>();

  for (const market of themed) {
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (!yesToken || !noToken) continue;

    const title = market.eventTitle || market.groupTitle || prefix;
    const groupKey = `${prefix}:${title}`;
    const existing = byEvent.get(groupKey) ?? { groupKey, category: prefix, title, members: [] };
    existing.members.push({ marketId: market.id, question: market.question, yesTokenId: yesToken.tokenId, noTokenId: noToken.tokenId, liquidityUsd: market.liquidityUsd, volume24h: market.volume24h });
    byEvent.set(groupKey, existing);
  }

  return [...byEvent.values()].filter((group) => group.members.length >= 2);
}

function buildCryptoThresholdGroups(markets: Market[]): MarketGroup[] {
  const byEvent = new Map<string, MarketGroup>();

  for (const market of markets.filter(isCryptoMarket)) {
    const sortKey = parseThresholdSortKey(market.question);
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (sortKey === null || !yesToken || !noToken) continue;

    const title = market.eventTitle || market.groupTitle || 'crypto-threshold-family';
    const groupKey = `crypto-threshold-family:${title}`;
    const existing = byEvent.get(groupKey) ?? { groupKey, category: 'crypto-threshold-family' as const, title, members: [] };
    existing.members.push({ marketId: market.id, question: market.question, yesTokenId: yesToken.tokenId, noTokenId: noToken.tokenId, liquidityUsd: market.liquidityUsd, volume24h: market.volume24h, sortKey });
    byEvent.set(groupKey, existing);
  }

  return [...byEvent.values()].map((group) => ({ ...group, members: [...group.members].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)) })).filter((group) => group.members.length >= 2);
}

function buildTimeframeGroups(markets: Market[]): MarketGroup[] {
  const byStem = new Map<string, MarketGroup>();

  for (const market of markets) {
    const parsed = normalizeTimeframeStem(market.question);
    const yesToken = market.outcomes[0];
    const noToken = market.outcomes[1];
    if (!parsed || !yesToken || !noToken) continue;

    const groupKey = `timeframe-market:${parsed.stem}`;
    const existing = byStem.get(groupKey) ?? { groupKey, category: 'timeframe-market' as const, title: parsed.stem, members: [] };
    existing.members.push({ marketId: market.id, question: market.question, yesTokenId: yesToken.tokenId, noTokenId: noToken.tokenId, liquidityUsd: market.liquidityUsd, volume24h: market.volume24h, sortKey: parsed.sortKey });
    byStem.set(groupKey, existing);
  }

  return [...byStem.values()].map((group) => ({ ...group, members: [...group.members].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)) })).filter((group) => group.members.length >= 2);
}

export function groupMarkets(markets: Market[]): MarketGroup[] {
  return [
    ...buildChampionGroups(markets),
    ...buildExclusiveOutcomeGroups(markets),
    ...buildThematicGroups(markets, isTrumpMarket, 'trump-family'),
    ...buildThematicGroups(markets, isCryptoMarket, 'crypto-family'),
    ...buildCryptoThresholdGroups(markets),
    ...buildTimeframeGroups(markets)
  ];
}
