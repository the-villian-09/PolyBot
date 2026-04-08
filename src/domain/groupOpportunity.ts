export interface GroupOpportunity {
  groupKey: string;
  category: 'champion-market' | 'timeframe-market' | 'exclusive-outcome-market' | 'trump-family' | 'crypto-family' | 'crypto-threshold-family';
  title: string;
  memberCount: number;
  summedYesAsk: number;
  summedYesBid: number;
  edgeToOne: number;
  severityScore?: number;
  feasible?: boolean;
  feasibilityReasons?: string[];
  simulatedNetEdge?: number;
  simulatedTradeSizeUsd?: number;
  simulatedPnlUsd?: number;
  simulationNotes?: string[];
  detectedAt: number;
  note: string;
}
