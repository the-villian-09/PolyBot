import pino from 'pino';
import type { AppEnv } from '../config/schema';

export function createLogger(env: AppEnv) {
  return pino({
    name: env.APP_NAME,
    level: env.LOG_LEVEL,
    transport: env.LOG_FORMAT === 'text'
      ? {
          target: 'pino-pretty',
          options: { colorize: false }
        }
      : undefined
  });
}
