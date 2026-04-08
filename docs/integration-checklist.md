# Polymarket Integration Checklist

## Purpose
This checklist captures the exact integration questions and validations required before enabling real trading in PolyBot.

## 1. CLOB API confirmation
- Confirm official base URL for the current Polymarket CLOB API.
- Confirm market metadata endpoint.
- Confirm order book endpoint.
- Confirm open orders endpoint.
- Confirm order status endpoint.
- Confirm fills or trade history endpoint.
- Confirm cancel order endpoint.
- Confirm whether websocket feeds are available and reliable.

## 2. Authentication and signing
- Confirm current auth scheme for the CLOB API.
- Confirm required headers.
- Confirm signing algorithm and payload format.
- Confirm whether API key, secret, and passphrase are needed.
- Confirm whether wallet-based signatures alone are sufficient.
- Confirm whether separate auth is needed for reads vs writes.

## 3. Market metadata
- Confirm market ID format.
- Confirm token ID format for YES and NO outcomes.
- Confirm active, closed, and tradable flags.
- Confirm settlement and expiry-related fields.
- Confirm liquidity fields and whether they are trustworthy enough for filtering.

## 4. Order book semantics
- Confirm best bid and ask semantics per outcome.
- Confirm tick size and minimum order size.
- Confirm size units, shares vs notional.
- Confirm how stale book timestamps are represented.

## 5. Order lifecycle
- Confirm supported order types.
- Confirm whether limit orders only are appropriate for this bot.
- Confirm time-in-force and expiration options.
- Confirm partial fill behavior.
- Confirm cancel semantics and response codes.
- Confirm whether client order IDs are supported.

## 6. Wallet and Polygon
- Confirm Polygon mainnet chain ID and required RPC calls.
- Confirm token contracts needed for trading.
- Confirm allowance or approval requirements.
- Confirm gas assumptions and MATIC minimum needed for operations.
- Confirm whether balances should come from Polygon RPC, Polymarket API, or both.

## 7. Risk and operational validation
- Measure API latency from the DigitalOcean droplet.
- Measure Polygon RPC latency from the DigitalOcean droplet.
- Test one small read-only cycle against live endpoints.
- Verify parsing for several real markets.
- Verify that order book data maps correctly to internal models.
- Confirm rate limits and implement conservative defaults.
- Test retry handling for timeouts, 429s, and 5xx errors.
- Test startup reconciliation assumptions before live execution is built.

## 8. Go-live gate
Do not enable live mode until all of the following are true:
- market and book ingestion are correct
- stale data detection works
- missed-opportunity reasons are logged clearly
- auth/signing flow is confirmed from current docs
- one end-to-end paper cycle is stable
- latency from the Ubuntu droplet is acceptable
- wallet funding and risk caps are explicitly configured
