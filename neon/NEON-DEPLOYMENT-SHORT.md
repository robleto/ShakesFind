# Neon Quick Deployment (TL;DR)

1. Create Neon project → copy connection string
2. Run `neon/schema.sql` in SQL Editor
3. Set Netlify env vars:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
REQUIRE_API_KEY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```
4. Netlify settings:
- Build: `npm run build`
- Functions: `netlify/functions`
- Publish: `public`

5. Deploy (push to `main` → Netlify auto-build)
6. Test endpoints:
```
/health
/api/?i=10865&apikey=demo
/api/?s=Spiel%20des%20Jahres&year=2023&apikey=demo
```
7. Generate real key via `/apikey` form.

## Validate DB Functions
```sql
SELECT generate_api_key('test@example.com');
SELECT validate_api_key('paste_generated_key');
```

## Migrate From Supabase
- Remove old env vars (SUPABASE_*)
- Confirm no `@supabase/supabase-js` dependency (already removed)
- Use `NEON-MIGRATION.md` for detailed steps

Done. Your Neon-backed Game Awards API is production ready.
