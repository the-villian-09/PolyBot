import dotenv from 'dotenv';
import { envSchema, type AppEnv } from './schema';

dotenv.config();

let cachedEnv: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
