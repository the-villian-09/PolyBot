import type { Opportunity } from '../domain/opportunity';
import type { MissedOpportunity } from '../domain/missedOpportunity';

export class OpportunitiesRepo {
  private readonly detected: Opportunity[] = [];
  private readonly missed: MissedOpportunity[] = [];

  recordOpportunity(opportunity: Opportunity): void {
    this.detected.push(opportunity);
  }

  recordMissed(missedOpportunity: MissedOpportunity): void {
    this.missed.push(missedOpportunity);
  }

  listDetected(): Opportunity[] {
    return [...this.detected];
  }

  listMissed(): MissedOpportunity[] {
    return [...this.missed];
  }
}
