# PolyBot Implementation Roadmap

## Phase A, Crypto-first MVP
Goal: make crypto threshold ladders the primary read-only product.

### Next code steps
1. Extend grouped diagnostics and persistence for crypto ladder detections
2. Rank ladder violations by severity and book quality
3. Add explicit execution-feasibility filters
4. Promote crypto ladder scan output to first-class artifacts

### Suggested file-level work
- `src/scanner/groupScanner.ts`
  - support more than two thresholds
  - compute ladder severity scores
  - add execution-feasibility scoring
- `src/grouping/groupMarkets.ts`
  - improve threshold parsing
  - support additional crypto ladder naming patterns
- `src/persistence/opportunitiesRepo.ts`
  - add grouped detection persistence
  - separate crypto ladder detections from generic misses
- `src/app/runGroupedReadOnlyCycle.ts`
  - emit crypto-specific summaries
  - rank top ladder opportunities clearly
- `STRATEGY.md`
  - update to make crypto ladders the primary MVP strategy

## Phase B, Tech ladder expansion
Goal: reuse crypto ladder logic for tech milestone and launch families.

### Suggested file-level work
- `src/grouping/groupMarkets.ts`
  - add tech threshold and launch-by-date family detection
- `src/scanner/groupScanner.ts`
  - add tech-specific ordering rules where needed
- `src/domain/marketGroup.ts`
  - support any additional metadata needed for tech ladders

## Phase C, Politics dependency logic
Goal: add richer relationship logic beyond winner completeness.

### Suggested file-level work
- `src/grouping/groupMarkets.ts`
  - add politics-specific family clustering
- `src/scanner/groupScanner.ts`
  - implement implication and hierarchy checks
- `src/domain/groupOpportunity.ts`
  - support dependency-violation metadata

## Go/No-Go criteria before live-small
- repeated crypto ladder detections across multiple runs or days
- conservative paper results survive spreads and slippage assumptions
- clear ranking of top opportunities
- enough usable ladders in the live market set
- no hidden parser or grouping ambiguity for the target family
