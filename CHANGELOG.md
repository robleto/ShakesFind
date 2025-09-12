# Changelog

## 1.0.0 (Initial Commercial Release)
- Neon Postgres schema & functions for API key generation, validation, subscription limit updates
- Stripe subscription flow (create + webhook handlers) with tier limit management
- Rate limiting (daily + monthly) and usage logging
- In-memory awards dataset loader with private dataset fallback (`internal/`)
- Netlify Functions endpoints: api, awards, categories, generate-key, create-subscription, webhook-stripe, health, dashboard
- Local Express server fallback for development
- Commercial license applied; public redistribution restricted
