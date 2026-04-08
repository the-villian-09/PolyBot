# PolyBot MVP Strategy Spec

## Goal
Build a lean, headless Polymarket bot that finds and logs realistic pricing inefficiencies, starting in read-only and paper mode, designed for stable 24/7 operation on a VPS.

## Core shift

### Old assumption
Scan single binary markets for static buy-both-sides arbitrage:
- `YES ask + NO ask < 1`

### Revised assumption
This pattern is too rare to be the main MVP edge source on the live books we inspected.
Polymarket books often preserve parity while remaining very wide.
The MVP should focus on mispricing across related markets, not only within one mirrored binary book.

## MVP strategy focus

### A. Related-market mispricing detection
Find logically linked markets where prices imply contradictions or inconsistent probabilities.

Examples:
- event A should imply event B, but prices disagree
- overlapping markets sum to impossible probability
- mutually exclusive outcomes exceed or underfill expected total
- timeframe markets create inconsistent ordering

### B. Category-aware scanning
Only scan market families where relationship logic is clear enough to model safely.

Good candidates:
- election or politics chains
- sports series or bracket relationships
- milestone timing markets
- event-before-event markets
- grouped market sets from the same event family

Avoid for MVP:
- vague unrelated standalone binaries
- markets with unclear dependency structure
- low-information novelty markets

## Non-goals
Still out of scope:
- AI or news sentiment
- dashboards or UI
- dynamic ML scoring
- autonomous strategy mutation
- broad market-making
- complex multi-leg live execution beyond simple controlled orders

## Opportunity types for MVP
PolyBot should detect and rank these:

### Type 1. Mutual exclusivity violations
If several outcomes cannot all happen, total implied probability should not exceed sane bounds.

### Type 2. Completeness gaps
If a set of outcomes should cover all possibilities, total implied probability should not be materially below or above 1 after fees and slippage allowance.

### Type 3. Temporal inconsistency
If one event must occur before another, shorter-horizon and longer-horizon prices should respect ordering.

### Type 4. Parent-child inconsistency
If a child market outcome implies a parent outcome, the child price should not exceed the parent beyond tolerance.

## Data requirements
PolyBot should ingest:
- active markets from Gamma
- token and book data from CLOB
- event and group metadata needed to cluster related markets

For each market, capture:
- question
- group or event relationship
- outcome labels
- token IDs
- liquidity
- recent volume
- timestamps
- best bid and ask on both sides

## Candidate filtering
A market is eligible only if:
- accepting orders
- active and not closed
- relationship group is recognized
- enough liquidity and recent volume
- book quality passes minimum thresholds
- timestamps are fresh enough

## Opportunity validation rules
A candidate should pass:
- relationship logic check
- minimum gross edge
- spread sanity
- enough displayed liquidity
- execution size cap
- stale-data rejection
- contradiction survives fee and slippage buffer

## Runtime modes

### dry-run
- scan continuously
- log candidates
- log skip reasons
- store grouped mispricing diagnostics

### paper
- simulate order intents
- simulate fills conservatively
- record would-trade vs skipped

### live-small
- tiny notional only
- manual go-live gate required
- pause on ambiguity

## Safety rules
- fail closed on stale data
- fail closed on ambiguous market relationships
- fail closed on missing book legs
- no live trading unless explicit safety flags are enabled
- reconciliation required before execution work matters

## MVP deliverables

### Phase 1
- relationship-group discovery
- market clustering
- read-only inconsistency scanner
- detailed skip and candidate logging

### Phase 2
- paper execution skeleton
- persistence for candidate history
- confidence and quality filters

### Phase 3
- tiny live execution
- timeout and cancel handling
- reconciliation checks

## Immediate next build step
Implement:
1. market grouping and clustering
2. relationship rules for one category first
3. a read-only mispricing detector for grouped markets

## Recommendation
Start with one clean category first, not the whole exchange.
The best first target is a market family with obvious logical relationships and repeatable structure.
