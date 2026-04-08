# PolyBot MVP Strategy Spec

## Goal
Build a lean, headless Polymarket bot that finds and logs realistic pricing inefficiencies, starting in read-only and paper mode, designed for stable 24/7 operation on a VPS.

## Current primary thesis
PolyBot should now treat **crypto threshold ladders** as the primary MVP opportunity class.

The first live grouped detection came from a crypto threshold family:
- lower threshold and higher threshold contracts on the same post-launch FDV event
- the higher threshold was priced above the lower threshold on the ask side
- this created a clean ordering violation that is structurally more promising than the broad winner-family and mirrored-book scans tested earlier

## Strategy priority order
1. crypto threshold ladders
2. tech milestone and launch ladders
3. politics dependency logic
4. geopolitics by-date ladders
5. everything else later

## Why the pivot happened
Earlier live testing showed:
- single-market YES/NO ask arbitrage was effectively absent in the sampled live books
- winner-family completeness scans were heavily overround and not close to actionable
- broad grouped scans mostly produced wide-book noise

Crypto ladders were the first family that produced a live structural inconsistency with clean explanatory logic.

## Core MVP strategy

### Primary opportunity type, Crypto threshold ordering violations
For contracts on the same crypto event with ordered thresholds:
- lower threshold YES should be at least as expensive as higher threshold YES
- if the higher threshold is priced above the lower threshold, flag an ordering violation

Examples:
- FDV greater than $2B vs FDV greater than $6B one day after launch
- token price greater than X vs greater than Y by the same time horizon

### Secondary opportunity types, later
- tech milestone and launch ladders
- politics parent-child implications
- geopolitics by-date chains

## Data requirements
PolyBot should ingest:
- active markets from Gamma
- token and book data from CLOB
- group/event metadata needed to cluster related markets

For each market, capture:
- question
- event/group relationship
- ordered threshold metadata where possible
- token IDs
- liquidity
- recent volume
- timestamps
- best bid and ask on both sides

## Candidate filtering
A market or family is eligible only if:
- accepting orders
- active and not closed
- relationship group is recognized
- enough liquidity and recent volume
- book quality passes minimum thresholds
- timestamps are fresh enough
- threshold ordering can be parsed unambiguously

## Opportunity validation rules
A candidate should pass:
- ordering logic check
- minimum inversion size or severity threshold
- spread sanity
- enough displayed liquidity
- execution size cap
- stale-data rejection
- contradiction survives fee and slippage buffer

## Runtime modes

### dry-run
- scan continuously
- log grouped diagnostics
- persist grouped opportunities
- persist crypto ladder detections separately
- rank top near-miss families

### paper
- simulate order intents on ladder opportunities
- model fills conservatively
- record would-trade vs skipped

### live-small
- tiny notional only
- manual go-live gate required
- pause on ambiguity

## Safety rules
- fail closed on stale data
- fail closed on ambiguous threshold parsing
- fail closed on missing book legs
- no live trading unless explicit safety flags are enabled
- reconciliation required before execution work matters

## MVP deliverables

### Phase 1
- relationship-group discovery
- crypto ladder clustering
- read-only ladder inconsistency scanner
- grouped opportunity persistence
- detailed grouped diagnostics and near-miss ranking

### Phase 2
- paper execution skeleton for ladder opportunities
- severity scoring and execution-feasibility checks
- confidence and quality filters

### Phase 3
- tiny live execution
- timeout and cancel handling
- reconciliation checks

## Immediate next build step
Implement:
1. richer ladder-specific severity ranking
2. execution-feasibility checks for ladder detections
3. tech ladder support using the same ordered-threshold framework

## Recommendation
Do not spread effort evenly across many weak families.
Make crypto ladders the main MVP path, expand only after repeated live detections hold up under realistic execution assumptions.
