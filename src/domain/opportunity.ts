export interface Opportunity {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  edge: number;
  spread: number;
  liquidity: number;
  suggestedTradeSize: number;
  detectedAt: number;
}
