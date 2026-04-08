import { loadEnv } from '../config/env';
import { createLogger } from '../telemetry/logger';
import { OrderBookStore } from '../state/orderbookStore';
import { PolymarketRestClient } from '../clients/polymarket/restClient';
import { MarketStore } from '../state/marketStore';
import { OpportunitiesRepo } from '../persistence/opportunitiesRepo';

export interface AppContext {
  env: ReturnType<typeof loadEnv>;
  logger: ReturnType<typeof createLogger>;
  marketStore: MarketStore;
  orderBookStore: OrderBookStore;
  opportunitiesRepo: OpportunitiesRepo;
  polymarketClient: PolymarketRestClient;
}

export function bootstrap(): AppContext {
  const env = loadEnv();
  const logger = createLogger(env);

  const marketStore = new MarketStore();
  const orderBookStore = new OrderBookStore();
  const opportunitiesRepo = new OpportunitiesRepo();
  const polymarketClient = new PolymarketRestClient(env.POLYMARKET_API_BASE_URL);

  logger.info({ mode: env.APP_MODE }, 'PolyEdge Lite bootstrap complete');

  return {
    env,
    logger,
    marketStore,
    orderBookStore,
    opportunitiesRepo,
    polymarketClient
  };
}
