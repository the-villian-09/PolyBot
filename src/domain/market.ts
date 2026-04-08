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
  outcomes: OutcomeToken[];
}
