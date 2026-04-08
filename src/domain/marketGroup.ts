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
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market';
  title: string;
  members: MarketGroupMember[];
}
