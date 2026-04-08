export interface OutcomeToken {
  tokenId: string;
  outcome: 'YES' | 'NO';
}

export interface Market {
  id: string;
  question: string;
  active: boolean;
  closed?: boolean;
  updatedAt: number;
  liquidityUsd?: number;
  volume24h?: number;
  acceptingOrders?: boolean;
  groupTitle?: string;
  eventTitle?: string;
  slug?: string;
  outcomes: OutcomeToken[];
}
