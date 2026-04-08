import fs from 'node:fs';
import path from 'node:path';
import type { Opportunity } from '../domain/opportunity';
import type { MissedOpportunity } from '../domain/missedOpportunity';
import type { GroupOpportunity } from '../domain/groupOpportunity';

interface RepeatabilityRecord {
  firstSeenAt: number;
  lastSeenAt: number;
  seenCount: number;
}

export class OpportunitiesRepo {
  private readonly detected: Opportunity[] = [];
  private readonly missed: MissedOpportunity[] = [];
  private readonly grouped: GroupOpportunity[] = [];
  private readonly cryptoLadders: GroupOpportunity[] = [];
  private readonly paperCryptoLadders: GroupOpportunity[] = [];

  constructor(private readonly baseDir: string = './data') {}

  recordOpportunity(opportunity: Opportunity): void {
    this.detected.push(opportunity);
    this.appendJsonl('opportunities.detected.jsonl', opportunity);
  }

  recordMissed(missedOpportunity: MissedOpportunity): void {
    this.missed.push(missedOpportunity);
    this.appendJsonl('opportunities.missed.jsonl', missedOpportunity);
  }

  recordGroupOpportunity(opportunity: GroupOpportunity): void {
    this.grouped.push(opportunity);
    this.appendJsonl('opportunities.grouped.jsonl', opportunity);

    if (opportunity.category === 'crypto-threshold-family') {
      this.cryptoLadders.push(opportunity);
      this.appendJsonl('opportunities.crypto-ladders.jsonl', opportunity);
      this.bumpRepeatability(opportunity.groupKey, opportunity.detectedAt);
    }
  }

  recordPaperCryptoLadder(opportunity: GroupOpportunity): void {
    this.paperCryptoLadders.push(opportunity);
    this.appendJsonl('opportunities.crypto-ladders.paper.jsonl', opportunity);
  }

  getRepeatability(groupKey: string): RepeatabilityRecord | null {
    const state = this.readRepeatabilityState();
    return state[groupKey] ?? null;
  }

  listDetected(): Opportunity[] {
    return [...this.detected];
  }

  listMissed(): MissedOpportunity[] {
    return [...this.missed];
  }

  listGrouped(): GroupOpportunity[] {
    return [...this.grouped];
  }

  listCryptoLadders(): GroupOpportunity[] {
    return [...this.cryptoLadders];
  }

  listPaperCryptoLadders(): GroupOpportunity[] {
    return [...this.paperCryptoLadders];
  }

  private appendJsonl(fileName: string, payload: unknown): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    const target = path.join(this.baseDir, fileName);
    fs.appendFileSync(target, `${JSON.stringify(payload)}\n`, 'utf8');
  }

  private repeatabilityPath(): string {
    fs.mkdirSync(this.baseDir, { recursive: true });
    return path.join(this.baseDir, 'opportunities.crypto-ladders.repeatability.json');
  }

  private readRepeatabilityState(): Record<string, RepeatabilityRecord> {
    const target = this.repeatabilityPath();
    if (!fs.existsSync(target)) return {};
    return JSON.parse(fs.readFileSync(target, 'utf8')) as Record<string, RepeatabilityRecord>;
  }

  private bumpRepeatability(groupKey: string, detectedAt: number): void {
    const target = this.repeatabilityPath();
    const state = this.readRepeatabilityState();
    const existing = state[groupKey];
    state[groupKey] = existing
      ? { ...existing, lastSeenAt: detectedAt, seenCount: existing.seenCount + 1 }
      : { firstSeenAt: detectedAt, lastSeenAt: detectedAt, seenCount: 1 };
    fs.writeFileSync(target, JSON.stringify(state, null, 2), 'utf8');
  }
}
