import type { Market } from '../../domain/market';
import type { OrderBook } from '../../domain/orderbook';
import type { RawGammaMarket, RawPolymarketMarket, RawPolymarketOrderBook } from './types';

function parseJsonArray(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function mapGammaMarket(raw: RawGammaMarket): Market {
  const tokenIds = parseJsonArray(raw.clobTokenIds);

  return {
    id: raw.id,
    question: raw.question ?? 'Unknown market',
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).getTime() : Date.now(),
    liquidityUsd: raw.liquidityNum ?? Number(raw.liquidity ?? 0),
    volume24h: raw.volume24hr ?? 0,
    acceptingOrders: Boolean(raw.acceptingOrders),
    groupTitle: raw.groupItemTitle,
    eventTitle: raw.events?.[0]?.title,
    slug: raw.slug,
    outcomes: tokenIds.slice(0, 2).map((tokenId, index) => ({
      tokenId,
      outcome: index === 0 ? 'YES' : 'NO'
    }))
  };
}

export function mapMarket(raw: RawPolymarketMarket): Market {
  const rawTokens = raw.tokens ?? [];

  return {
    id: raw.id,
    question: raw.question ?? 'Unknown market',
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    updatedAt: raw.updatedAt
      ? new Date(raw.updatedAt).getTime()
      : raw.updated_at
        ? new Date(raw.updated_at).getTime()
        : Date.now(),
    liquidityUsd: raw.liquidity ?? raw.liquidity_num,
    outcomes: raw.outcomes?.length
      ? raw.outcomes.map((outcome, index) => ({
          tokenId: outcome.tokenId,
          outcome: index === 0 ? 'YES' : 'NO'
        }))
      : rawTokens.map((token, index) => ({
          tokenId: token.tokenId ?? token.token_id ?? `unknown-${index}`,
          outcome: index === 0 ? 'YES' : 'NO'
        }))
  };
}

export function mapOrderBook(raw: RawPolymarketOrderBook): OrderBook {
  return {
    marketId: raw.marketId,
    yesBids: raw.yesBids ?? [],
    yesAsks: raw.yesAsks ?? [],
    noBids: raw.noBids ?? [],
    noAsks: raw.noAsks ?? [],
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).getTime() : Date.now()
  };
}
