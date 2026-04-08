import { bootstrap } from './app/bootstrap';

async function main() {
  const { logger, env } = bootstrap();

  logger.info(
    {
      app: env.APP_NAME,
      mode: env.APP_MODE,
      scanIntervalMs: env.SCAN_INTERVAL_MS,
      tradingEnabled: env.TRADING_ENABLED,
      allowLiveTrading: env.ALLOW_LIVE_TRADING
    },
    'PolyEdge Lite started'
  );
}

main().catch((error) => {
  console.error('Fatal startup error', error);
  process.exit(1);
});
