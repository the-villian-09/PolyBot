# PolyBot

PolyBot is a lean MVP Polymarket arbitrage bot focused on clean execution, good filtering, and stability.

## Current status

The repository currently includes:
- TypeScript project setup
- env validation
- structured logging
- core domain types
- market and orderbook stores
- scanner and validation logic
- Polymarket read-only client scaffold
- dry-run scan loop
- file-based JSONL persistence for detected and missed opportunities
- Polymarket integration checklist docs

## Commands

```bash
npm install --include=dev
npm run build
npm run dev
npm test
```

## Modes

- `dry-run` , continuous scan loop, no trading
- `paper` , single read-only scan cycle for now
- `live-small` , not implemented yet
- `live` , not implemented yet

## Safety

Default mode should remain `paper` or `dry-run` until integration, reconciliation, and execution paths are validated.
