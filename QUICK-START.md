## Quick Start – Shakespeare Productions API

Run the API locally and explore Shakespeare production data (sample dataset) in minutes.

### 1. Install & Run
```
npm install
netlify dev   # runs functions + static + proxy
# or
npm run dev   # express fallback server (limited)
```

### 2. Get a Demo Key
Use the built‑in generator (demo tier):
```
open http://localhost:8888/apikey
```
Or call the function directly:
```
curl -X POST http://localhost:8888/.netlify/functions/generate-key -H 'Content-Type: application/json' -d '{"email":"demo@example.com"}'
```

### 3. Make Requests
```
curl "http://localhost:8888/api/?s=Hamlet&apikey=demo"
curl "http://localhost:8888/api/productions?page=1&pageSize=5&apikey=demo"
```

### 4. Environment Variables
Copy `.env.example` → `.env` and set at minimum:
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
REQUIRE_API_KEY=true
```

### 5. Stripe (Optional During Eval)
Provision products/prices once:
```
node setup-stripe-products.js
```
Add printed IDs & webhook secret to Netlify env before enabling paid tiers.

### 6. Health Check
```
curl http://localhost:8888/.netlify/functions/health
```

### 7. Conventions
- JSON only (`r=json` default) during transition
- Date fields ISO8601; times omitted
- Pagination: `page` (1-based), `pageSize` (≤100)

### 8. Troubleshooting
| Symptom | Fix |
|---------|-----|
| 401 Unauthorized | Ensure `REQUIRE_API_KEY` false for local OR supply a generated key |
| Empty search results | Sample dataset small; try `?s=Hamlet` | 
| 500 from DB calls | Verify Neon connection string & SSL params |

---
Questions: support@shakesfind.com
