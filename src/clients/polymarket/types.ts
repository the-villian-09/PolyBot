export interface RawPolymarketOutcome {
  token_id?: string;
  tokenId?: string;
  outcome?: string;
  price?: number;
  winner?: boolean;
}

export interface RawPolymarketMarket {
  id: string;
  question?: string;
  active?: boolean;
  closed?: boolean;
  updatedAt?: string | number;
  updated_at?: string | number;
  liquidity?: number;
  liquidity_num?: number;
  tokens?: RawPolymarketOutcome[];
  outcomes?: { tokenId: string; outcome: string }[];
}

export interface RawPolymarketOrderBook {
  marketId: string;
  yesBids?: Array<{ price: number; size: number }>;
  yesAsks?: Array<{ price: number; size: number }>;
  noBids?: Array<{ price: number; size: number }>;
  noAsks?: Array<{ price: number; size: number }>;
  updatedAt?: string | number;
}
