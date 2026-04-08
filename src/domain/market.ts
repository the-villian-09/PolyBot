export interface Market {
  id: string;
  question: string;
  active: boolean;
  updatedAt: number;
  liquidityUsd?: number;
}
