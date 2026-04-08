import type { AppContext } from './bootstrap';
import { runReadOnlyCycle } from './runReadOnlyCycle';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runLoop(ctx: AppContext): Promise<void> {
  const { env, logger } = ctx;

  logger.info({ mode: env.APP_MODE, scanIntervalMs: env.SCAN_INTERVAL_MS }, 'Starting dry-run loop');

  while (true) {
    const cycleStartedAt = Date.now();

    try {
      await runReadOnlyCycle(ctx);
      logger.info(
        {
          cycleDurationMs: Date.now() - cycleStartedAt,
          detected: ctx.opportunitiesRepo.listDetected().length,
          missed: ctx.opportunitiesRepo.listMissed().length
        },
        'Dry-run cycle complete'
      );
    } catch (error) {
      logger.error({ err: error }, 'Dry-run loop cycle failed');
    }

    await sleep(env.SCAN_INTERVAL_MS);
  }
}
