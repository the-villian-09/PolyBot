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
- read-only cycle for markets, books, and opportunity logging
- Polymarket integration checklist docs

## Commands

```bash
npm install --include=dev
npm run build
npm run dev
npm test
```

## Safety

Default mode should remain `paper` until integration, reconciliation, and execution paths are validated.
