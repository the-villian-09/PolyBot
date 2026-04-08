export interface MarketGroupMember {
  marketId: string;
  question: string;
  yesTokenId: string;
  noTokenId: string;
  liquidityUsd?: number;
  volume24h?: number;
  sortKey?: number;
}

export interface MarketGroup {
  groupKey: string;
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market' | 'trump-family' | 'crypto-family' | 'crypto-threshold-family';
  title: string;
  members: MarketGroupMember[];
}
