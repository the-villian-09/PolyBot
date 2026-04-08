export function calculateEdge(yesPrice: number, noPrice: number): number {
  return 1 - (yesPrice + noPrice);
}

export function calculateSpread(bestBid: number, bestAsk: number): number {
  return bestAsk - bestBid;
}
