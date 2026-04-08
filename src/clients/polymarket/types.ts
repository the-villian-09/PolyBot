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
  archived?: boolean;
  enable_order_book?: boolean;
  updatedAt?: string | number;
  updated_at?: string | number;
  liquidity?: number;
  liquidity_num?: number;
  tokens?: RawPolymarketOutcome[];
  outcomes?: { tokenId: string; outcome: string }[];
}

export interface RawGammaMarket {
  id: string;
  question?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  enableOrderBook?: boolean;
  updatedAt?: string | number;
  liquidity?: string | number;
  liquidityNum?: number;
  volume24hr?: number;
  acceptingOrders?: boolean;
  clobTokenIds?: string;
  outcomes?: string;
}

export interface RawPolymarketOrderBook {
  marketId: string;
  yesBids?: Array<{ price: number; size: number }>;
  yesAsks?: Array<{ price: number; size: number }>;
  noBids?: Array<{ price: number; size: number }>;
  noAsks?: Array<{ price: number; size: number }>;
  updatedAt?: string | number;
}
