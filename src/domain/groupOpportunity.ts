export interface GroupOpportunity {
  groupKey: string;
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market';
  title: string;
  memberCount: number;
  summedYesAsk: number;
  summedYesBid: number;
  edgeToOne: number;
  detectedAt: number;
  note: string;
}
