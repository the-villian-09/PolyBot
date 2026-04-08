export interface GroupOpportunity {
  groupKey: string;
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market' | 'trump-family' | 'crypto-family' | 'crypto-threshold-family';
  title: string;
  memberCount: number;
  summedYesAsk: number;
  summedYesBid: number;
  edgeToOne: number;
  detectedAt: number;
  note: string;
}
