# Game Awards API

A RESTful API for board game awards data (an OMDB-style service for tabletop). Public sample ships with a limited subset; a larger private dataset (non-redistributable) can be mounted under `internal/`.

> Commercial deployment asset. Not an open contribution project.
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

The dataset includes major awards like Spiel des Jahres, Origins Awards, Diana Jones Award, and many more.

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
| `i` | Optional* | Award ID | `10865` |
| `t` | Optional* | Award title search | `Spiel des Jahres Winner` |
| `s` | Optional* | Search across all fields | `Catan` |
| `bgg_id` | Optional* | BoardGameGeek game ID | `13` |
| `year` | No | Filter by year | `2023` |
| `category` | No | Filter by category | `Game of the Year` |
| `award_set` | No | Filter by award set | `Spiel des Jahres` |
| `type` | No | Filter by type | `winner` or `nominee` |
| `r` | No | Response format | `json` (xml coming soon) |

*At least one of `i`, `t`, `s`, or `bgg_id` is required.

### Example Requests

#### Get award by ID
```
GET /api/?i=10865
```

#### Search for awards
```
GET /api/?s=Spiel des Jahres&year=2023
```

#### Get all awards for a specific game
```
GET /api/?bgg_id=361
```

#### Get awards by year
```
GET /api/years/2023
```

#### List all award sets
```
GET /api/awards
```

#### List all categories
```
GET /api/categories
```

## 📊 Data Structure

Each award object contains:

```json
{
  "Response": "True",
  "id": "10865",
  "slug": "1974-charles-s-roberts-best-amateur-game-winner",
  "url": "/boardgamehonor/10865/1974-charles-s-roberts-best-amateur-game-winner",
  "year": 1974,
  "title": "Charles S Roberts Best Amateur Game Winner",
  "primaryName": "",
  "alternateNames": [],
  "boardgames": [
    {
      "bggId": 18158,
      "name": "Manassas"
    }
  ],
  "awardSet": "1974 Charles S. Roberts",
  "position": "Charles S. Roberts Best Amateur Game",
  "isWinner": true,
  "isNominee": false
}
```

## 🎮 Use Cases

### For Publishers
- Track award performance across your game catalog
- Competitive analysis of award-winning games
- Marketing material for award achievements

### For Developers
- Integrate award data into gaming apps
- Build recommendation engines based on award-winning games
- Create award tracking features

### For Researchers
- Academic studies on game design trends
- Historical analysis of gaming industry recognition
- Award system comparisons across regions

### For Media
- Easy access for articles and reviews
- Award season coverage automation
- Historical context for feature pieces

## 🏗️ Architecture

- **Netlify Functions + Express fallback** – Serverless first, local dev convenience
- **Neon PostgreSQL** – Users, API keys, usage, (soon) award search
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

Need broader rights (OEM / white‑label)? Email sales@gameawardsapi.com.

### Managing the Private Dataset

Current search layer reads from `lib/awards-data.js`, which attempts to load a private full dataset at `internal/enhanced-honors-complete.json` (gitignored). The repo includes a minimal `data/sample-awards.json` for development & demonstrations.

To use a full dataset privately:
1. Place the JSON file at `internal/enhanced-honors-complete.json`
2. Restart local dev (`npm run dev` or `netlify dev`)
3. The loader will detect and use it automatically (log line: "Loaded full private dataset").

Do NOT redistribute proprietary or third‑party dataset dumps. Keep the full dataset private under `internal/`.

## 📝 License

See `LICENSE-COMMERCIAL.md`.

## 🙏 Acknowledgments

- Board game award data sourced from BoardGameGeek community
- Inspired by the excellent OMDB API structure
- Built for the board gaming community

## 📞 Support

- 📧 Email: support@gameawardsapi.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Board Game Developers](https://discord.gg/boardgamedev)

---

**🎲 Game Awards API** – Bringing board game award data to developers worldwide.
