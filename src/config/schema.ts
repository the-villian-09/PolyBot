import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  TZ: z.string().default('UTC'),
  APP_NAME: z.string().default('polyedge-lite'),
  APP_MODE: z.enum(['dry-run', 'paper', 'live-small', 'live']).default('paper'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  POLYMARKET_API_BASE_URL: z.string().min(1),
  POLYMARKET_GAMMA_BASE_URL: z.string().min(1).default('https://gamma-api.polymarket.com'),
  POLYMARKET_WS_URL: z.string().optional().default(''),
  POLYGON_CHAIN_ID: z.coerce.number().default(137),
  POLYGON_RPC_URL: z.string().min(1),
  POLYGON_RPC_FALLBACK_URL: z.string().optional().default(''),
  WALLET_PRIVATE_KEY: z.string().optional().default(''),
  WALLET_ADDRESS: z.string().optional().default(''),
  SCAN_INTERVAL_MS: z.coerce.number().default(200),
  MARKET_FRESHNESS_MS: z.coerce.number().default(3000),
  DRY_RUN_MARKET_LIMIT: z.coerce.number().int().positive().default(50),
  BOOK_FETCH_CONCURRENCY: z.coerce.number().int().positive().default(5),
  MIN_BOOK_BID_PRICE: z.coerce.number().default(0.05),
  MAX_BOOK_ASK_PRICE: z.coerce.number().default(0.95),
  MAX_MIRROR_GAP: z.coerce.number().default(0.05),
  MIN_GROUP_EDGE: z.coerce.number().default(0.005),
  MIN_GROUP_BID_LIQUIDITY: z.coerce.number().default(0.001),
  ARBITRAGE_MAX_TOTAL_PRICE: z.coerce.number().default(0.97),
  MIN_EDGE: z.coerce.number().default(0.012),
  MAX_SPREAD: z.coerce.number().default(0.02),
  MIN_LIQUIDITY_MULTIPLIER: z.coerce.number().default(2),
  MAX_BALANCE_FRACTION_PER_TRADE: z.coerce.number().default(0.10),
  MAX_TRADE_SIZE_USD: z.coerce.number().default(50),
  MAX_LIQUIDITY_FRACTION: z.coerce.number().default(0.80),
  FILL_TIMEOUT_MS: z.coerce.number().default(1500),
  MARKET_COOLDOWN_MS: z.coerce.number().default(10000),
  DAILY_STOP_LOSS_USD: z.coerce.number().default(50),
  MAX_TOTAL_CAPITAL_USD: z.coerce.number().default(500),
  MAX_PER_MARKET_EXPOSURE_USD: z.coerce.number().default(50),
  TRADING_ENABLED: z.coerce.boolean().default(false),
  ALLOW_LIVE_TRADING: z.coerce.boolean().default(false),
  RECONCILE_ON_STARTUP: z.coerce.boolean().default(true),
  RECONCILE_INTERVAL_MS: z.coerce.number().default(10000),
  DB_PATH: z.string().default('./data/polyedge.sqlite'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  LOG_TRADES: z.coerce.boolean().default(true),
  LOG_OPPORTUNITY_SKIPS: z.coerce.boolean().default(true)
}).superRefine((env, ctx) => {
  const liveMode = env.APP_MODE === 'live' || env.APP_MODE === 'live-small';

  if (env.POLYGON_CHAIN_ID !== 137) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'POLYGON_CHAIN_ID must be 137 for Polygon mainnet' });
  }

  if (env.MAX_PER_MARKET_EXPOSURE_USD > env.MAX_TOTAL_CAPITAL_USD) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MAX_PER_MARKET_EXPOSURE_USD cannot exceed MAX_TOTAL_CAPITAL_USD' });
  }

  if (env.MAX_TRADE_SIZE_USD > env.MAX_TOTAL_CAPITAL_USD) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MAX_TRADE_SIZE_USD cannot exceed MAX_TOTAL_CAPITAL_USD' });
  }

  if (env.BOOK_FETCH_CONCURRENCY > env.DRY_RUN_MARKET_LIMIT) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'BOOK_FETCH_CONCURRENCY cannot exceed DRY_RUN_MARKET_LIMIT' });
  }

  if (env.MIN_BOOK_BID_PRICE >= env.MAX_BOOK_ASK_PRICE) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MIN_BOOK_BID_PRICE must be lower than MAX_BOOK_ASK_PRICE' });
  }

  if (liveMode) {
    if (!env.WALLET_PRIVATE_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'WALLET_PRIVATE_KEY is required in live modes' });
    }
    if (!env.WALLET_ADDRESS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'WALLET_ADDRESS is required in live modes' });
    }
    if (!env.ALLOW_LIVE_TRADING || !env.TRADING_ENABLED) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Live modes require ALLOW_LIVE_TRADING=true and TRADING_ENABLED=true' });
    }
  }
});

export type AppEnv = z.infer<typeof envSchema>;
