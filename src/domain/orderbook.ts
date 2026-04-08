export interface BookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  marketId: string;
  yesBids: BookLevel[];
  yesAsks: BookLevel[];
  noBids: BookLevel[];
  noAsks: BookLevel[];
  updatedAt: number;
}
