export interface MarketGroupMember {
  marketId: string;
  question: string;
  yesTokenId: string;
  noTokenId: string;
  liquidityUsd?: number;
  volume24h?: number;
}

export interface MarketGroup {
  groupKey: string;
  category: 'champion-market';
  title: string;
  members: MarketGroupMember[];
}
