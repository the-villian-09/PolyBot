import { bootstrap } from './app/bootstrap';
import { runReadOnlyCycle } from './app/runReadOnlyCycle';

async function main() {
  const ctx = bootstrap();
  const { logger, env } = ctx;

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

  if (env.APP_MODE === 'dry-run' || env.APP_MODE === 'paper') {
    await runReadOnlyCycle(ctx);
    logger.info(
      {
        detected: ctx.opportunitiesRepo.listDetected().length,
        missed: ctx.opportunitiesRepo.listMissed().length
      },
      'Read-only cycle complete'
    );
  }
}

main().catch((error) => {
  console.error('Fatal startup error', error);
  process.exit(1);
});
