import type { Opportunity } from '../domain/opportunity';
import type { AppEnv } from '../config/schema';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validateOpportunity(opportunity: Opportunity, env: AppEnv): ValidationResult {
  const reasons: string[] = [];

  if (opportunity.edge <= env.MIN_EDGE) reasons.push('edge too low');
  if (opportunity.spread >= env.MAX_SPREAD) reasons.push('spread too wide');
  if (opportunity.liquidity < opportunity.suggestedTradeSize * env.MIN_LIQUIDITY_MULTIPLIER) reasons.push('low liquidity');
  if (opportunity.suggestedTradeSize <= 0) reasons.push('trade size is zero');

  return {
    valid: reasons.length === 0,
    reasons
  };
}
