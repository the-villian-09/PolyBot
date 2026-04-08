import { bootstrap } from './app/bootstrap';
import { runReadOnlyCycle } from './app/runReadOnlyCycle';
import { runLoop } from './app/runLoop';
import { runGroupedReadOnlyCycle } from './app/runGroupedReadOnlyCycle';

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

  await runGroupedReadOnlyCycle(ctx);

  if (env.APP_MODE === 'dry-run') {
    await runLoop(ctx);
    return;
  }

  if (env.APP_MODE === 'paper') {
    await runReadOnlyCycle(ctx);
    logger.info(
      {
        detected: ctx.opportunitiesRepo.listDetected().length,
        missed: ctx.opportunitiesRepo.listMissed().length
      },
      'Paper read-only cycle complete'
    );
    return;
  }

  logger.warn({ mode: env.APP_MODE }, 'Live execution modes are not implemented yet');
}

main().catch((error) => {
  console.error('Fatal startup error', error);
  process.exit(1);
});
