# Architecture Overview

High-level structure of the Shakespeare Productions API platform.

## Runtime Surfaces

1. Static Site (Netlify) – Marketing + API key dashboard (HTML in `public/`).
2. Netlify Functions – Primary API surface (`netlify/functions/*.js`).
3. Express Dev Server – Local development (`server.js`) mirroring function routing.

## Request Flow

Client -> HTTPS (Netlify Edge/CDN) -> Netlify Function -> (Optional) PostgreSQL (Neon) -> JSON response

## Key Functions

| Function | Purpose |
|----------|---------|
| `api.js` | Root descriptor / heartbeat for API versions & available endpoints |
| `productions.js` | Core productions listing + filtering (pagination, year filters future) |
| `generate-key.js` | Provision API keys (initial simple model) |
| `dashboard.js` | Authenticated dashboard data (key + usage placeholder) |
| `webhook-stripe.js` | Stripe subscription + usage event handling |
| `health.js` | Lightweight liveness probe |

## Data Layer

`lib/db-pool.js` centralizes Neon connection creation (serverless-friendly). Data access helpers:
- `lib/productions-data.js` – domain access for productions.

Seed / schema SQL in `neon/` and `supabase/` folders (Neon is the active target; supabase retained for historical parity during migration comparisons).

## API Keys & Auth

Current implementation: simple API key generation stored in Postgres (schema evolving). Keys passed via `x-api-key` header. Future: hashed storage + usage metering table + daily quota materialized view for rate enforcement.

## Rate Limiting

Presently handled opportunistically (Express middleware in dev) and planned for database-driven tracking in production functions (Netlify). Stripe subscription tier will map to row in a `plans` table controlling limits (requests/day, concurrency, maybe premium endpoints access).

## Subscriptions (Stripe)

- Product catalog configured via `setup-stripe-products.js` (dev script).
- Webhook (`webhook-stripe.js`) records subscription state transitions (activation, cancellation, renewal placeholder logic).
- Planned: enforce plan entitlements at function entry (middleware style wrapper).

## Build / Deployment

Meta build step writes build info (`scripts/generate-build-info.js`). Functions are deployed directly by Netlify without bundling; minimal dependencies keep cold starts low.

## Observability (Planned)

- Add lightweight request logging (structured JSON) gated by env var.
- Introduce error classification codes for client vs server faults.
- Usage metrics aggregated nightly into a reporting table.

## Deprecation Roadmap

| Component | Status | Action |
|-----------|--------|--------|
| Supabase SQL | Legacy | Archive to separate branch |
| Plain key generation | Transitional | Replace with hashed + prefix pattern |

## Security Considerations

- No secrets in repo; rely on environment variables for DB + Stripe keys.
- Future: rotate signing secret for webhook validator automatically.
- Enforce least privilege: DB role limited to CRUD on API tables only.

## Suggested Next Enhancements

1. Add integration tests hitting Netlify functions locally.
2. Migrate legacy award modules out; prune dependencies.
3. Implement per-key request counting and 429 responses.
4. Add search endpoint with full-text index (title, venue, city) once data enriched.

---
Document intentionally concise; expand only when components materially change.