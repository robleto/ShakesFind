# Changelog

## 1.0.0 (Initial Commercial Release)
-
## 2.0.0 (Shakespeare Productions Refactor)
- Domain shift from board game awards to Shakespeare productions
- Added `productions` table, seed data, and `/api/productions` endpoint
- Deprecated `/api/awards` and `/api/categories` (returns 410 Gone)
- Replaced parameters (`bgg_id`, `award_set`, `category`, `type`) with (`company`, `status`, `city`, `country`)
- New search fields: play title, company, venue, city
- Updated README, schema, Netlify functions, sample dataset
- Backwards incompatibility: clients must update queries; no automatic aliasing provided
- Neon Postgres schema & functions for API key generation, validation, subscription limit updates
- Stripe subscription flow (create + webhook handlers) with tier limit management
- Rate limiting (daily + monthly) and usage logging
- In-memory awards dataset loader with private dataset fallback (`internal/`)
- Netlify Functions endpoints: api, awards, categories, generate-key, create-subscription, webhook-stripe, health, dashboard
- Local Express server fallback for development
- Commercial license applied; public redistribution restricted

## 2.1.0 (Documentation Refinement)
- Text cleanup after productions refactor
- Removed stale award parameter references from primary docs
- Added `QUICK-START.md`
- No API surface changes

## 2.1.1 (Brand Correction – Shakespeare Focus)
- Reverted unintended interim "Games" wording to canonical Shakespeare Productions branding
- OpenAPI title/description restored
- README, pricing, dashboard, api key pages updated accordingly
- Removed speculative games roadmap (file deleted)
- Clarified legacy award deprecation note
