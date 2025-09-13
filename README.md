# Shakespeare Productions API

An OMDB-style REST API for upcoming and recent Shakespeare theatre productions worldwide: play titles, companies, venues, cities, countries, run dates, status, and optional metadata. Built for theatre apps, research, media, and operational tooling.

> Commercial deployment asset. Not an open contribution project.

Legacy Note: Earlier iterations referenced a "Game Awards" domain. All award endpoints and parameters have been fully removed as of v3.0.0; the repository now focuses solely on Shakespeare production data.
## 🚀 Deployment & Operations

Production reference stack: Netlify (Functions + static) + Neon (Postgres) + Stripe (subscriptions). Detailed deployment, Neon, Stripe, and quick start guides now live under `docs/technical/`.

Fast path:
```bash
Netlify UI basics:
  Build command: npm run build
  Functions dir: netlify/functions
  Publish dir: public
  Add required env vars (`DATABASE_URL`, Stripe keys, etc.)
```

Migration from Supabase? See the "Migration & Legacy Notes" section inside `DEPLOYMENT.md` (Supabase env removal + Neon connection format) – prior separate docs were consolidated.

### Local Development

```bash
npm install
npm run dev  # nodemon auto-restart (Express)

# Or test Netlify functions + static site locally
netlify dev
```

Legacy (pre‑2.0) dataset context referenced board game award sets (Spiel des Jahres, Origins Awards, etc.). Those artifacts have been purged (v3.0.0) and are no longer shipped.

## ⚡ Quick Start (Local)

```bash
npm install
npm run dev          # Express + auto-reload
# or test serverless functions directly
node local-functions-server.js &
node scripts/run-function.js api "s=wingspan&apikey=demo"
```

Stripe test bootstrap (optional now, required before subscriptions):
```bash
cp .env.example .env   # fill DATABASE_URL + Stripe keys
node setup-stripe-products.js
# add printed price + webhook secrets to Netlify env and redeploy
```

Health & build metadata:
```bash
curl http://localhost:4000/.netlify/functions/health
```

## 📋 API Endpoints

### Base URL
```
http://localhost:3000/api/
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
## Active Domain
Sample dataset includes Hamlet, Macbeth, Romeo and Juliet with company, venue, city, country, run dates, and status (upcoming | running | closed).

#### Parameters (Active)
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `i` | Optional* | Production ID | `prod_1` |
| `t` | Optional* | Play title (substring) | `Hamlet` |
| `s` | Optional* | Free search (play, company, venue, city) | `Stratford` |
| `year` | No | Filter by start year | `2025` |
| `company` | No | Filter by company substring | `Royal` |
| `status` | No | Filter by status | `running` |
| `city` | No | Exact city match (case-insensitive) | `London` |
| `country` | No | Exact country match | `UK` |
```
GET /api/?i=10865
*At least one of `i`, `t`, or `s` is required.

### Examples
Get production by ID:
```
GET /api/?i=prod_1
```
Search for productions:
GET /api/?s=Hamlet&year=2025
GET /api/?bgg_id=361
Get productions by year:
```
GET /api/years/2025
List productions:
```
GET /api/productions
```
Each production object contains:
```json
{
  "Response": "True",
  "id": "prod_1",
  "play_title": "Hamlet",
  "company_name": "Royal Shakespeare Company",
  "venue_name": "Swan Theatre",
  "city": "Stratford-upon-Avon",
  "country": "UK",
  "start_date": "2025-10-01",
  "end_date": "2025-11-30",
  "status": "upcoming",
  "ticket_url": "https://tickets.example/hamlet-rsc",
  "official_url": "https://rsc.org/hamlet",
  "synopsis": "A prince struggles with revenge and mortality.",
  "start_year": 2025
}
```
  "_note": "Award-era fields removed",
## 🎯 Use Cases
### For Theatre Companies
- Promote upcoming productions programmatically
- Syndicate run schedules to partner sites
- Monitor competitive programming in key cities
### For Developers
- Build city or venue production discovery apps
- Automate newsletters of upcoming Shakespeare shows
- Power ticket alert bots
### For Researchers
- Analyze geographic distribution of Shakespeare productions
- Study seasonality of programming
- Cross-reference cultural funding & staging frequency
### For Media
- Rapid fact-checking of current runs
- Auto-generate production context sidebars
- Trend pieces on staging popularity
- **Neon PostgreSQL** – Users, API keys, usage, future production indexing
- **In-memory dataset (current search)** – Pending SQL-backed search flag (`USE_DB=1`)
<!-- Award-era research bullets removed -->
Current search layer reads from `lib/productions-data.js`, which can load a private full dataset at `internal/enhanced-productions.json` (gitignored). The repo includes a minimal `data/sample-productions.json` for development & demonstrations.
<!-- Removed legacy award comparison bullet -->
1. Place the JSON file at `internal/enhanced-productions.json`
### For Media
- Inspired by the excellent OMDB API structure
- Built for theatre data products

**🎭 Shakespeare Productions API** – Bringing live Shakespeare production data to developers worldwide.

- **Netlify Functions + Express fallback** – Serverless first, local dev convenience
- **Neon PostgreSQL** – Users, API keys, usage, (future) richer production indexing
- **In-memory dataset (current search)** – Pending SQL-backed search flag (`USE_DB=1`)
- **Rate limiting & usage tracking** – PL/pgSQL (`validate_api_key_enhanced`) sets remaining quota headers
- **Build metadata** – `build-info.json` surfaced via `/health`

## 🔐 Security & Rate Limiting

- Tiered daily/monthly quotas (Free / Professional / Enterprise)
- API key validation + suspension logic (Stripe payment_failed events)
- CORS (`*` default – tighten if embedding in browsers)
- Helmet security headers via Express fallback
- Planned: peppered key hashing (`API_KEY_SECRET`), narrower CORS

## 📈 Key Environment Variables (excerpt)

See full matrix in `docs/technical/DEPLOYMENT.md` (populate for buyer handoff).
```env
DATABASE_URL=postgresql://...?...sslmode=require
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REQUIRE_API_KEY=true
DEPLOY_ENV=production
```
Optional overrides: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` (Express path), `USE_DB=1` (future search switch).

## 🛡️ Commercial Usage & Licensing

This repository is distributed under a custom commercial license (`LICENSE-COMMERCIAL.md`). It is intended as a deployable asset you can run for your own product or internal tooling. Public redistribution of the full codebase or bulk dataset is prohibited.

Permitted:
- Deploy and operate the API for your users
- Modify code internally
- Extend subscription tiers / pricing logic

Not Permitted:
- Publishing the full repo publicly
- Reselling the raw dataset or bulk exports as a standalone product
- Open‑sourcing the private full dataset

Need broader rights (OEM / white‑label)? Email sales@shakesfind.com.

### Managing the Private Dataset

Award dataset loader was removed in v3.0.0 along with related sample data.

## 📝 License

See `LICENSE-COMMERCIAL.md`.

## 🙏 Acknowledgments

- Inspired by the excellent OMDB API structure
- Built for theatre data products

## 📞 Support

- 📧 Email: support@shakesfind.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Board Game Developers](https://discord.gg/boardgamedev)

---

---
This README reflects the canonical Shakespeare Productions focus after deprecating prior award endpoints.
