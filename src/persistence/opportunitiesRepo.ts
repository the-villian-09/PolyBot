import fs from 'node:fs';
import path from 'node:path';
import type { Opportunity } from '../domain/opportunity';
import type { MissedOpportunity } from '../domain/missedOpportunity';

export class OpportunitiesRepo {
  private readonly detected: Opportunity[] = [];
  private readonly missed: MissedOpportunity[] = [];

  constructor(private readonly baseDir: string = './data') {}

  recordOpportunity(opportunity: Opportunity): void {
    this.detected.push(opportunity);
    this.appendJsonl('opportunities.detected.jsonl', opportunity);
  }

  recordMissed(missedOpportunity: MissedOpportunity): void {
    this.missed.push(missedOpportunity);
    this.appendJsonl('opportunities.missed.jsonl', missedOpportunity);
  }

  listDetected(): Opportunity[] {
    return [...this.detected];
  }

  listMissed(): MissedOpportunity[] {
    return [...this.missed];
  }

  private appendJsonl(fileName: string, payload: unknown): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    const target = path.join(this.baseDir, fileName);
    fs.appendFileSync(target, `${JSON.stringify(payload)}\n`, 'utf8');
  }
}
